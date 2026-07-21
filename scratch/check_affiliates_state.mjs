// Script: check and fix affiliates status column via app's own db connection
const { prismaBase } = await import('../lib/db.js');

async function main() {
  // Check columns
  const cols = await prismaBase.$queryRaw`
    SELECT column_name, data_type, column_default
    FROM information_schema.columns
    WHERE table_name = 'affiliates'
    ORDER BY ordinal_position
  `;
  console.log('\n=== AFFILIATES COLUMNS ===');
  for (const c of cols) console.log(` - ${c.column_name} (${c.data_type})`);

  // Check rows
  const rows = await prismaBase.$queryRaw`
    SELECT id, name, email, referral_code, status FROM affiliates
  `;
  console.log('\n=== AFFILIATE ROWS ===');
  for (const r of rows) console.log(` - ${r.email} | status: ${r.status} | code: ${r.referral_code}`);

  await prismaBase.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
