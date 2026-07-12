const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function main() {
  const envContent = fs.readFileSync(path.join(__dirname, '.env.local'), 'utf8');
  const dbMatch = envContent.match(/DATABASE_URL="?([^"\r\n]+)"?/);
  if (!dbMatch) throw new Error('No DATABASE_URL found');
  
  const client = new Client({ connectionString: dbMatch[1] });
  await client.connect();
  
  const result = await client.query(`
    SELECT indexname, indexdef
    FROM pg_indexes
    WHERE tablename IN ('product_serials', 'product_batches', 'product_variants')
  `);
  
  console.log(JSON.stringify(result.rows, null, 2));
  await client.end();
}

main().catch(console.error);
