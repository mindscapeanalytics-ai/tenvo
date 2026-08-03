require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
pool.query(
  `SELECT column_name, data_type FROM information_schema.columns 
   WHERE table_name='products' AND column_name IN ('category_id','category') ORDER BY column_name`
).then(r => {
  r.rows.forEach(c => console.log(c.column_name, '->', c.data_type));
  pool.end();
}).catch(e => { console.error(e.message); pool.end(); });
