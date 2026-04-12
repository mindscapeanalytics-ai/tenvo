const OWNED_ENTITY_TABLES = {
  product: 'products',
  vendor: 'vendors',
  warehouse: 'warehouse_locations',
  customer: 'customers',
  purchase: 'purchases',
  invoice: 'invoices',
};

function normalizeEntityKey(entityType) {
  return String(entityType || '').trim().toLowerCase();
}

export async function assertEntityBelongsToBusiness(client, entityType, id, businessId, messageLabel = null) {
  if (!id) return;

  const key = normalizeEntityKey(entityType);
  const table = OWNED_ENTITY_TABLES[key];
  if (!table) {
    throw new Error(`Unsupported ownership check for entity: ${entityType}`);
  }

  const result = await client.query(
    `SELECT 1 FROM ${table} WHERE id = $1 AND business_id = $2 LIMIT 1`,
    [id, businessId]
  );

  if (result.rows.length === 0) {
    throw new Error(`${messageLabel || key} does not belong to this business`);
  }
}
