import pool from '@/lib/db';

/**
 * Payment Reconciliation Service
 * Automatically reconciles storefront orders with accounting module
 */

/**
 * Create journal entries for a paid order
 */
export async function reconcileOrderPayment(orderId, businessId) {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Get order details
    const orderResult = await client.query(
      `SELECT 
        o.*,
        b.business_name,
        bs.settings->>'currency' as business_currency
      FROM storefront_orders o
      JOIN businesses b ON o.business_id = b.id
      LEFT JOIN business_settings bs ON b.id = bs.business_id
      WHERE o.id = $1 AND o.business_id = $2`,
      [orderId, businessId]
    );
    
    if (orderResult.rows.length === 0) {
      throw new Error('Order not found');
    }
    
    const order = orderResult.rows[0];
    
    // Only reconcile paid orders
    if (order.payment_status !== 'paid') {
      await client.query('ROLLBACK');
      return { 
        success: false, 
        message: 'Order payment status is not paid',
        payment_status: order.payment_status 
      };
    }
    
    // Check if already reconciled
    const existingResult = await client.query(
      `SELECT id FROM journal_entries WHERE reference_id = $1 AND reference_type = 'storefront_order'`,
      [orderId]
    );
    
    if (existingResult.rows.length > 0) {
      await client.query('ROLLBACK');
      return { 
        success: false, 
        message: 'Order already reconciled',
        journal_entry_id: existingResult.rows[0].id
      };
    }
    
    // Get or create chart of accounts for this business
    const accounts = await getOrCreateAccounts(client, businessId, order.currency || 'PKR');
    
    // Calculate amounts
    const subtotal = parseFloat(order.subtotal);
    const taxAmount = parseFloat(order.tax_amount || 0);
    const shippingAmount = parseFloat(order.shipping_amount || 0);
    const discountAmount = parseFloat(order.discount_amount || 0);
    const totalAmount = parseFloat(order.total_amount);
    
    // Create journal entry
    const journalEntryResult = await client.query(
      `INSERT INTO journal_entries (
        business_id, 
        entry_date, 
        reference_type, 
        reference_id, 
        description,
        total_debit,
        total_credit,
        status,
        created_at
      ) VALUES ($1, NOW(), 'storefront_order', $2, $3, $4, $4, 'posted', NOW())
      RETURNING id`,
      [
        businessId,
        orderId,
        `Storefront Order #${order.order_number} - ${order.customer_name || order.customer_email || 'Guest'}`,
        totalAmount
      ]
    );
    
    const journalEntryId = journalEntryResult.rows[0].id;
    
    // Create journal entry lines
    const lines = [];
    
    // 1. Debit Cash/Bank (Asset increases)
    lines.push({
      account_id: accounts.cashAccountId,
      debit: totalAmount,
      credit: 0,
      description: 'Payment received'
    });
    
    // 2. Credit Sales Revenue (Revenue increases)
    lines.push({
      account_id: accounts.revenueAccountId,
      debit: 0,
      credit: subtotal,
      description: 'Sales revenue'
    });
    
    // 3. Credit Tax Payable (if tax applies)
    if (taxAmount > 0) {
      lines.push({
        account_id: accounts.taxPayableAccountId,
        debit: 0,
        credit: taxAmount,
        description: 'Sales tax payable'
      });
    }
    
    // 4. Credit Shipping Revenue (if shipping charged)
    if (shippingAmount > 0) {
      lines.push({
        account_id: accounts.shippingRevenueAccountId,
        debit: 0,
        credit: shippingAmount,
        description: 'Shipping revenue'
      });
    }
    
    // 5. Debit Discount Expense (if discount applied)
    if (discountAmount > 0) {
      lines.push({
        account_id: accounts.discountExpenseAccountId,
        debit: discountAmount,
        credit: 0,
        description: 'Sales discount'
      });
    }
    
    // Insert journal entry lines
    for (const line of lines) {
      await client.query(
        `INSERT INTO journal_entry_lines (
          journal_entry_id,
          account_id,
          debit,
          credit,
          description
        ) VALUES ($1, $2, $3, $4, $5)`,
        [
          journalEntryId,
          line.account_id,
          line.debit,
          line.credit,
          line.description
        ]
      );
    }
    
    // Update order with reconciliation info
    await client.query(
      `UPDATE storefront_orders 
       SET 
        reconciled_at = NOW(),
        journal_entry_id = $1,
        metadata = jsonb_set(
          COALESCE(metadata, '{}'::jsonb),
          '{reconciliation}',
          jsonb_build_object(
            'journal_entry_id', $1,
            'reconciled_at', NOW(),
            'total_amount', $2,
            'tax_amount', $3,
            'shipping_amount', $4,
            'discount_amount', $5
          )
        )
       WHERE id = $6`,
      [journalEntryId, totalAmount, taxAmount, shippingAmount, discountAmount, orderId]
    );
    
    await client.query('COMMIT');
    
    return {
      success: true,
      journal_entry_id: journalEntryId,
      message: 'Order reconciled successfully',
      total_amount: totalAmount,
      lines: lines.length
    };
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Payment reconciliation error:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Get or create chart of accounts for a business
 */
async function getOrCreateAccounts(client, businessId, currency) {
  // Try to get existing accounts
  let result = await client.query(
    `SELECT id, account_type FROM chart_of_accounts 
     WHERE business_id = $1 
     AND account_type IN ('cash', 'revenue_sales', 'tax_payable', 'revenue_shipping', 'expense_discount')
     AND is_active = true`,
    [businessId]
  );
  
  const accounts = {};
  
  for (const row of result.rows) {
    switch (row.account_type) {
      case 'cash':
        accounts.cashAccountId = row.id;
        break;
      case 'revenue_sales':
        accounts.revenueAccountId = row.id;
        break;
      case 'tax_payable':
        accounts.taxPayableAccountId = row.id;
        break;
      case 'revenue_shipping':
        accounts.shippingRevenueAccountId = row.id;
        break;
      case 'expense_discount':
        accounts.discountExpenseAccountId = row.id;
        break;
    }
  }
  
  // Create missing accounts
  if (!accounts.cashAccountId) {
    const res = await client.query(
      `INSERT INTO chart_of_accounts (business_id, account_code, account_name, account_type, category, currency, is_active)
       VALUES ($1, '1000', 'Cash & Bank', 'cash', 'asset', $2, true) RETURNING id`,
      [businessId, currency]
    );
    accounts.cashAccountId = res.rows[0].id;
  }
  
  if (!accounts.revenueAccountId) {
    const res = await client.query(
      `INSERT INTO chart_of_accounts (business_id, account_code, account_name, account_type, category, currency, is_active)
       VALUES ($1, '4000', 'Sales Revenue', 'revenue_sales', 'revenue', $2, true) RETURNING id`,
      [businessId, currency]
    );
    accounts.revenueAccountId = res.rows[0].id;
  }
  
  if (!accounts.taxPayableAccountId) {
    const res = await client.query(
      `INSERT INTO chart_of_accounts (business_id, account_code, account_name, account_type, category, currency, is_active)
       VALUES ($1, '2000', 'Sales Tax Payable', 'tax_payable', 'liability', $2, true) RETURNING id`,
      [businessId, currency]
    );
    accounts.taxPayableAccountId = res.rows[0].id;
  }
  
  if (!accounts.shippingRevenueAccountId) {
    const res = await client.query(
      `INSERT INTO chart_of_accounts (business_id, account_code, account_name, account_type, category, currency, is_active)
       VALUES ($1, '4100', 'Shipping Revenue', 'revenue_shipping', 'revenue', $2, true) RETURNING id`,
      [businessId, currency]
    );
    accounts.shippingRevenueAccountId = res.rows[0].id;
  }
  
  if (!accounts.discountExpenseAccountId) {
    const res = await client.query(
      `INSERT INTO chart_of_accounts (business_id, account_code, account_name, account_type, category, currency, is_active)
       VALUES ($1, '5000', 'Sales Discounts', 'expense_discount', 'expense', $2, true) RETURNING id`,
      [businessId, currency]
    );
    accounts.discountExpenseAccountId = res.rows[0].id;
  }
  
  return accounts;
}

/**
 * Get reconciliation status for orders
 */
export async function getReconciliationStatus(businessId, options = {}) {
  const client = await pool.connect();
  
  try {
    const { startDate, endDate, status } = options;
    
    let query = `
      SELECT 
        o.id,
        o.order_number,
        o.total_amount,
        o.currency,
        o.payment_status,
        o.reconciled_at,
        o.journal_entry_id,
        je.entry_date as reconciled_date,
        CASE 
          WHEN o.reconciled_at IS NOT NULL THEN 'reconciled'
          WHEN o.payment_status = 'paid' THEN 'pending'
          ELSE 'not_applicable'
        END as reconciliation_status
      FROM storefront_orders o
      LEFT JOIN journal_entries je ON o.journal_entry_id = je.id
      WHERE o.business_id = $1
    `;
    
    const params = [businessId];
    
    if (startDate) {
      params.push(startDate);
      query += ` AND o.created_at >= $${params.length}`;
    }
    
    if (endDate) {
      params.push(endDate);
      query += ` AND o.created_at <= $${params.length}`;
    }
    
    if (status) {
      if (status === 'reconciled') {
        query += ` AND o.reconciled_at IS NOT NULL`;
      } else if (status === 'pending') {
        query += ` AND o.reconciled_at IS NULL AND o.payment_status = 'paid'`;
      }
    }
    
    query += ` ORDER BY o.created_at DESC LIMIT 100`;
    
    const result = await client.query(query, params);
    
    // Get summary stats
    const statsResult = await client.query(
      `SELECT 
        COUNT(*) as total_orders,
        COUNT(CASE WHEN reconciled_at IS NOT NULL THEN 1 END) as reconciled_count,
        COUNT(CASE WHEN reconciled_at IS NULL AND payment_status = 'paid' THEN 1 END) as pending_count,
        COALESCE(SUM(CASE WHEN reconciled_at IS NOT NULL THEN total_amount ELSE 0 END), 0) as reconciled_amount,
        COALESCE(SUM(CASE WHEN reconciled_at IS NULL AND payment_status = 'paid' THEN total_amount ELSE 0 END), 0) as pending_amount
      FROM storefront_orders
      WHERE business_id = $1`,
      [businessId]
    );
    
    return {
      orders: result.rows,
      summary: statsResult.rows[0]
    };
    
  } finally {
    client.release();
  }
}

/**
 * Auto-reconcile all pending orders for a business
 */
export async function autoReconcilePendingOrders(businessId) {
  const client = await pool.connect();
  
  try {
    // Get all paid but unreconciled orders
    const result = await client.query(
      `SELECT id FROM storefront_orders 
       WHERE business_id = $1 
       AND payment_status = 'paid' 
       AND reconciled_at IS NULL`,
      [businessId]
    );
    
    const results = [];
    
    for (const row of result.rows) {
      try {
        const reconcileResult = await reconcileOrderPayment(row.id, businessId);
        results.push({
          order_id: row.id,
          success: reconcileResult.success,
          journal_entry_id: reconcileResult.journal_entry_id
        });
      } catch (err) {
        results.push({
          order_id: row.id,
          success: false,
          error: err.message
        });
      }
    }
    
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    
    return {
      total: results.length,
      successful,
      failed,
      results
    };
    
  } finally {
    client.release();
  }
}
