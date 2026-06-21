/**
 * Map client purchase line items to DB-ready rows (filters empty lines).
 * @param {Array<Record<string, unknown>>} items
 */
export function mapPurchaseItemsForDb(items = []) {
  return items
    .filter((item) => item?.product_id && Number(item.quantity) > 0)
    .map((item) => {
      const quantity = Number(item.quantity || 0);
      const unitCost = Number(item.unit_cost ?? item.unitCost ?? 0);
      const taxRate = Number(item.tax_rate ?? item.taxRate ?? 0);
      const lineBase = quantity * unitCost;
      const taxAmount = Number(
        item.tax_amount ?? (lineBase * taxRate) / 100
      );
      const totalAmount = Number(
        item.total_amount ?? item.total ?? lineBase + taxAmount
      );

      return {
        product_id: item.product_id,
        description: item.description || item.name || 'Item',
        quantity,
        unit_cost: unitCost,
        tax_rate: taxRate,
        tax_amount: taxAmount,
        total_amount: totalAmount,
        batch_number: item.batch_number || null,
        batch_id: item.batch_id || null,
        expiry_date: item.expiry_date || null,
        manufacturing_date: item.manufacturing_date || null,
      };
    });
}

/**
 * Normalize a purchase create/update payload before validation.
 * @param {Record<string, unknown>} data
 */
export function normalizePurchasePayload(data = {}) {
  const items = mapPurchaseItemsForDb(data.items || []);
  return {
    ...data,
    items,
  };
}
