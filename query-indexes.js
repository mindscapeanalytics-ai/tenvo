const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const result = await prisma.$queryRawUnsafe(`
    SELECT indexname, indexdef
    FROM pg_indexes
    WHERE tablename IN ('product_serials', 'product_batches', 'product_variants')
  `);
  console.log(JSON.stringify(result, null, 2));
}
main().catch(console.error).finally(() => prisma.$disconnect());
