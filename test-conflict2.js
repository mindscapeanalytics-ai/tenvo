const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function main() {
  const envContent = fs.readFileSync(path.join(__dirname, '.env.local'), 'utf8');
  const dbMatch = envContent.match(/DATABASE_URL="?([^"\r\n]+)"?/);
  const client = new Client({ connectionString: dbMatch[1] });
  await client.connect();
  
  try {
    const bId = '22222222-2222-2222-2222-222222222222';
    
    await client.query(`
        INSERT INTO product_serials (business_id, serial_number, status, purchase_date)
        VALUES ($1, $2, 'in_stock', NOW())
        ON CONFLICT (business_id, serial_number) WHERE COALESCE(is_deleted, false) = false DO UPDATE
          SET status = 'in_stock',
              is_deleted = false,
              deleted_at = NULL,
              updated_at = NOW()
    `, [bId, 'TEST-SERIAL-002']);
    
    console.log("SUCCESS: Query executed without error");
  } catch (err) {
    console.error("ERROR:", err.message);
  } finally {
    await client.end();
  }
}

main().catch(console.error);
