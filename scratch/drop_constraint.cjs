const { Client } = require('pg');
require('dotenv').config({ path: '.env' });

async function main() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });
  
  try {
    await client.connect();
    await client.query('ALTER TABLE subscription_plans DROP CONSTRAINT IF EXISTS subscription_plans_slug_key;');
    console.log('Constraint dropped');
  } catch (e) {
    console.error('Error dropping constraint:', e);
  } finally {
    await client.end();
  }
}

main();
