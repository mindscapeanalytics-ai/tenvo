// Fix script: ensure status column exists and all affiliates have correct status
import { prismaBase as prisma } from '../lib/db.js';

async function main() {
  console.log('1. Ensuring status column exists on affiliates...');
  await prisma.$executeRaw`
    ALTER TABLE affiliates ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending'
  `;
  await prisma.$executeRaw`
    ALTER TABLE affiliates ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true
  `;
  await prisma.$executeRaw`
    ALTER TABLE affiliates ADD COLUMN IF NOT EXISTS total_earnings DECIMAL(12,2) NOT NULL DEFAULT 0.00
  `;
  await prisma.$executeRaw`
    ALTER TABLE affiliates ADD COLUMN IF NOT EXISTS payout_details JSONB DEFAULT '{}'
  `;
  console.log('   ✓ Columns ensured');

  console.log('\n2. Current affiliate rows:');
  const rows = await prisma.$queryRaw`
    SELECT id, name, email, referral_code, status FROM affiliates ORDER BY created_at
  `;
  for (const r of rows) {
    console.log(`   - ${r.email} | status: "${r.status}" | code: ${r.referral_code}`);
  }

  if (rows.length === 0) {
    console.log('   (no affiliates in DB)');
  }

  console.log('\nDone.');
  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
