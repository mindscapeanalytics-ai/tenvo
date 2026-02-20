import {
    createPayrollEmployeeAction,
    getPayrollEmployeesAction,
    updatePayrollEmployeeAction,
    processPayrollAction,
    getPayrollRunsAction,
    getPayslipsAction
} from '@/lib/actions/standard/payroll';

export const payrollAPI = {
    // Employee management
    async addEmployee(data) { return await createPayrollEmployeeAction(data); },
    async getEmployees(businessId, status) { return await getPayrollEmployeesAction(businessId, status); },
    async updateEmployee(data) { return await updatePayrollEmployeeAction(data); },

    // Payroll processing
    async processPayroll(data) { return await processPayrollAction(data); },
    async getRuns(businessId) { return await getPayrollRunsAction(businessId); },
    async getPayslips(businessId, runId) { return await getPayslipsAction(businessId, runId); },
};
