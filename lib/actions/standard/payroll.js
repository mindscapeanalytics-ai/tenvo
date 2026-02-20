'use server';

import pool from '@/lib/db';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { verifyBusinessAccess } from '@/lib/auth/access';
import { createGLEntryAction } from '@/lib/actions/basic/accounting';
import { ACCOUNT_CODES } from '@/lib/config/accounting';

async function checkAuth(businessId, client = null) {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) throw new Error('Unauthorized');
    if (businessId) await verifyBusinessAccess(session.user.id, businessId, [], client);
    return session;
}

// ─── Employee Management ────────────────────────────────────────────────────

/**
 * Add an employee to the payroll system
 */
export async function createPayrollEmployeeAction(data) {
    const client = await pool.connect();
    try {
        await checkAuth(data.businessId, client);

        const result = await client.query(`
            INSERT INTO payroll_employees (
                business_id, user_id, employee_code, full_name,
                cnic, phone, email, department, designation,
                join_date, base_salary, bank_name, bank_account, tax_filer
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
            RETURNING *
        `, [
            data.businessId, data.userId || null, data.employeeCode,
            data.fullName, data.cnic || null, data.phone || null,
            data.email || null, data.department || null, data.designation || null,
            data.joinDate || null, data.baseSalary || 0,
            data.bankName || null, data.bankAccount || null,
            data.taxFiler || false
        ]);

        return { success: true, employee: result.rows[0] };
    } catch (error) {
        console.error('Create payroll employee error:', error);
        return { success: false, error: error.message };
    } finally {
        client.release();
    }
}

/**
 * Get all payroll employees for a business
 */
export async function getPayrollEmployeesAction(businessId, status = 'active') {
    const client = await pool.connect();
    try {
        await checkAuth(businessId, client);
        const result = await client.query(
            `SELECT * FROM payroll_employees WHERE business_id = $1 AND status = $2 ORDER BY full_name`,
            [businessId, status]
        );
        return { success: true, employees: result.rows };
    } catch (error) {
        console.error('Get payroll employees error:', error);
        return { success: false, error: error.message };
    } finally {
        client.release();
    }
}

/**
 * Update employee details
 */
export async function updatePayrollEmployeeAction(data) {
    const client = await pool.connect();
    try {
        await checkAuth(data.businessId, client);
        await client.query(`
            UPDATE payroll_employees SET
                full_name = COALESCE($1, full_name),
                department = COALESCE($2, department),
                designation = COALESCE($3, designation),
                base_salary = COALESCE($4, base_salary),
                bank_name = COALESCE($5, bank_name),
                bank_account = COALESCE($6, bank_account),
                tax_filer = COALESCE($7, tax_filer),
                phone = COALESCE($8, phone),
                status = COALESCE($9, status),
                updated_at = NOW()
            WHERE id = $10 AND business_id = $11
        `, [
            data.fullName, data.department, data.designation,
            data.baseSalary, data.bankName, data.bankAccount,
            data.taxFiler, data.phone, data.status,
            data.employeeId, data.businessId
        ]);
        return { success: true };
    } catch (error) {
        console.error('Update payroll employee error:', error);
        return { success: false, error: error.message };
    } finally {
        client.release();
    }
}

// ─── Payroll Processing ─────────────────────────────────────────────────────

/**
 * Create and process a payroll run for a month
 */
export async function processPayrollAction(data) {
    const client = await pool.connect();
    try {
        const session = await checkAuth(data.businessId, client);
        await client.query('BEGIN');

        // Check for duplicate run
        const dupCheck = await client.query(
            `SELECT id FROM payroll_runs WHERE business_id = $1 AND period_month = $2 AND period_year = $3`,
            [data.businessId, data.month, data.year]
        );
        if (dupCheck.rows.length > 0) {
            throw new Error(`Payroll for ${data.month}/${data.year} already exists`);
        }

        // Get active employees
        const empRes = await client.query(
            `SELECT * FROM payroll_employees WHERE business_id = $1 AND status = 'active'`,
            [data.businessId]
        );
        if (empRes.rows.length === 0) throw new Error('No active employees found');

        // Generate run number
        const numRes = await client.query(
            `SELECT COALESCE(MAX(CAST(NULLIF(REGEXP_REPLACE(run_number, '[^0-9]', '', 'g'), '') AS INTEGER)), 0) + 1 AS n
             FROM payroll_runs WHERE business_id = $1`, [data.businessId]
        );
        const runNumber = `PAY-${String(numRes.rows[0].n).padStart(6, '0')}`;

        // Create payroll run
        const runRes = await client.query(`
            INSERT INTO payroll_runs (
                business_id, run_number, period_month, period_year,
                employee_count, status, processed_by, processed_at
            ) VALUES ($1, $2, $3, $4, $5, 'processing', $6, NOW()) RETURNING *
        `, [data.businessId, runNumber, data.month, data.year, empRes.rows.length, session.user.id]);
        const run = runRes.rows[0];

        let totalGross = 0, totalDeductions = 0, totalNet = 0;

        // Overrides per employee (if provided)
        const overrides = (data.overrides || []).reduce((map, o) => {
            map[o.employeeId] = o;
            return map;
        }, {});

        // Process each employee
        for (const emp of empRes.rows) {
            const override = overrides[emp.id] || {};
            const baseSalary = parseFloat(override.baseSalary || emp.base_salary);
            const allowances = parseFloat(override.allowances || 0);
            const overtime = parseFloat(override.overtime || 0);
            const grossSalary = baseSalary + allowances + overtime;

            // Pakistan tax calculation (simplified slab)
            let taxDeduction = 0;
            if (emp.tax_filer) {
                const annualGross = grossSalary * 12;
                if (annualGross > 600000 && annualGross <= 1200000) taxDeduction = grossSalary * 0.025;
                else if (annualGross > 1200000 && annualGross <= 2400000) taxDeduction = grossSalary * 0.125;
                else if (annualGross > 2400000 && annualGross <= 3600000) taxDeduction = grossSalary * 0.200;
                else if (annualGross > 3600000 && annualGross <= 6000000) taxDeduction = grossSalary * 0.250;
                else if (annualGross > 6000000) taxDeduction = grossSalary * 0.325;
            }
            taxDeduction = Math.round(taxDeduction * 100) / 100;

            // EOBI (Employees' Old-Age Benefits Institution) — employer 5%, employee 1%
            const eobi = Math.round(Math.min(grossSalary * 0.01, 350) * 100) / 100; // Capped at Rs.350

            const loanDeduction = parseFloat(override.loanDeduction || 0);
            const otherDeductions = parseFloat(override.otherDeductions || 0);
            const totalDed = taxDeduction + eobi + loanDeduction + otherDeductions;
            const netSalary = Math.round((grossSalary - totalDed) * 100) / 100;

            await client.query(`
                INSERT INTO payroll_items (
                    run_id, employee_id, base_salary, allowances, overtime,
                    gross_salary, tax_deduction, eobi, loan_deduction,
                    other_deductions, total_deductions, net_salary
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
            `, [
                run.id, emp.id, baseSalary, allowances, overtime,
                grossSalary, taxDeduction, eobi, loanDeduction,
                otherDeductions, totalDed, netSalary
            ]);

            totalGross += grossSalary;
            totalDeductions += totalDed;
            totalNet += netSalary;
        }

        // Update run totals
        await client.query(`
            UPDATE payroll_runs SET
                total_gross = $1, total_deductions = $2, total_net = $3, status = 'completed'
            WHERE id = $4
        `, [totalGross, totalDeductions, totalNet, run.id]);

        // GL entry: Debit Salary Expense, Credit Salary Payable
        const salaryExpenseCode = ACCOUNT_CODES.OPERATING_EXPENSES || '5001';
        await createGLEntryAction({
            businessId: data.businessId,
            date: new Date(),
            description: `Payroll: ${runNumber} (${data.month}/${data.year})`,
            referenceType: 'payroll_run',
            referenceId: run.id,
            createdBy: session.user.id,
            entries: [
                { accountCode: salaryExpenseCode, debit: totalGross, credit: 0 },
                { accountCode: ACCOUNT_CODES.ACCOUNTS_PAYABLE, debit: 0, credit: totalNet },
                { accountCode: ACCOUNT_CODES.SALES_TAX_PAYABLE, debit: 0, credit: totalDeductions },
            ],
        }, client);

        await client.query('COMMIT');
        return {
            success: true,
            run: { ...run, total_gross: totalGross, total_deductions: totalDeductions, total_net: totalNet },
        };
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Process payroll error:', error);
        return { success: false, error: error.message };
    } finally {
        client.release();
    }
}

/**
 * Get payroll runs for a business
 */
export async function getPayrollRunsAction(businessId) {
    const client = await pool.connect();
    try {
        await checkAuth(businessId, client);
        const result = await client.query(
            `SELECT * FROM payroll_runs WHERE business_id = $1 ORDER BY period_year DESC, period_month DESC`,
            [businessId]
        );
        return { success: true, runs: result.rows };
    } catch (error) {
        console.error('Get payroll runs error:', error);
        return { success: false, error: error.message };
    } finally {
        client.release();
    }
}

/**
 * Get payslips for a specific run
 */
export async function getPayslipsAction(businessId, runId) {
    const client = await pool.connect();
    try {
        await checkAuth(businessId, client);
        const result = await client.query(`
            SELECT pi.*, pe.full_name, pe.employee_code, pe.department,
                   pe.designation, pe.bank_name, pe.bank_account, pe.cnic
            FROM payroll_items pi
            JOIN payroll_employees pe ON pi.employee_id = pe.id
            WHERE pi.run_id = $1
            ORDER BY pe.full_name
        `, [runId]);
        return { success: true, payslips: result.rows };
    } catch (error) {
        console.error('Get payslips error:', error);
        return { success: false, error: error.message };
    } finally {
        client.release();
    }
}
