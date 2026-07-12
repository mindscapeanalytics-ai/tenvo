import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log("Adding missing unique constraints...");

    try {
        // 1. product_serials
        await prisma.$executeRawUnsafe(`
            CREATE UNIQUE INDEX IF NOT EXISTS product_serials_business_serial_active_key
            ON product_serials(business_id, serial_number)
            WHERE COALESCE(is_deleted, false) = false
            AND serial_number IS NOT NULL
            AND TRIM(serial_number) != '';
        `);
        console.log("Added product_serials_business_serial_active_key");

        // 2. product_batches
        await prisma.$executeRawUnsafe(`
            CREATE UNIQUE INDEX IF NOT EXISTS product_batches_business_product_batch_active_key
            ON product_batches(business_id, product_id, batch_number)
            WHERE COALESCE(is_deleted, false) = false
            AND batch_number IS NOT NULL
            AND TRIM(batch_number) != '';
        `);
        console.log("Added product_batches_business_product_batch_active_key");

        // 3. product_variants
        await prisma.$executeRawUnsafe(`
            CREATE UNIQUE INDEX IF NOT EXISTS product_variants_business_sku_active_key
            ON product_variants(business_id, variant_sku)
            WHERE COALESCE(is_deleted, false) = false
            AND variant_sku IS NOT NULL
            AND TRIM(variant_sku) != '';
        `);
        console.log("Added product_variants_business_sku_active_key");

        console.log("All missing unique constraints added successfully.");
    } catch (e) {
        console.error("Error adding constraints:", e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
