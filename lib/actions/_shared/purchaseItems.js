'use server';

let purchaseItemsHasBusinessIdCache = null;

async function purchaseItemsHasBusinessId(client) {
  if (purchaseItemsHasBusinessIdCache !== null) {
    return purchaseItemsHasBusinessIdCache;
  }

  const result = await client.query(`
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'purchase_items'
      AND column_name = 'business_id'
    LIMIT 1
  `);

  purchaseItemsHasBusinessIdCache = result.rows.length > 0;
  return purchaseItemsHasBusinessIdCache;
}

export async function insertPurchaseItemCompat(client, {
  businessId,
  purchaseId,
  productId,
  description,
  quantity,
  unitCost,
  taxRate = 0,
  totalAmount,
  batchId = null,
  withReturning = false,
  includeId = false,
}) {
  const hasBusinessId = await purchaseItemsHasBusinessId(client);

  const effectiveTotalAmount =
    totalAmount ?? (Number(quantity || 0) * Number(unitCost || 0));

  if (includeId) {
    if (hasBusinessId) {
      return client.query(`
        INSERT INTO purchase_items (
          id, business_id, purchase_id, product_id, description, quantity, unit_cost, tax_rate, total_amount, batch_id, created_at
        ) VALUES (
          gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, NOW()
        )
        ${withReturning ? 'RETURNING *' : ''}
      `, [
        businessId,
        purchaseId,
        productId,
        description || '',
        quantity,
        unitCost || 0,
        taxRate || 0,
        effectiveTotalAmount,
        batchId,
      ]);
    }

    return client.query(`
      INSERT INTO purchase_items (
        id, purchase_id, product_id, description, quantity, unit_cost, tax_rate, total_amount, batch_id, created_at
      ) VALUES (
        gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, NOW()
      )
      ${withReturning ? 'RETURNING *' : ''}
    `, [
      purchaseId,
      productId,
      description || '',
      quantity,
      unitCost || 0,
      taxRate || 0,
      effectiveTotalAmount,
      batchId,
    ]);
  }

  if (hasBusinessId) {
    return client.query(`
      INSERT INTO purchase_items (
        business_id, purchase_id, product_id, description, quantity,
        unit_cost, tax_rate, total_amount, batch_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      ${withReturning ? 'RETURNING *' : ''}
    `, [
      businessId,
      purchaseId,
      productId,
      description || '',
      quantity,
      unitCost || 0,
      taxRate || 0,
      effectiveTotalAmount,
      batchId,
    ]);
  }

  return client.query(`
    INSERT INTO purchase_items (
      purchase_id, product_id, description, quantity,
      unit_cost, tax_rate, total_amount, batch_id
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    ${withReturning ? 'RETURNING *' : ''}
  `, [
    purchaseId,
    productId,
    description || '',
    quantity,
    unitCost || 0,
    taxRate || 0,
    effectiveTotalAmount,
    batchId,
  ]);
}
