/**
 * Provisions starter categories and products after business registration.
 */
import { prismaBase } from '../db.js';
import { buildRegistrationSeedPayload, slugifyCategoryName } from '../utils/registrationSeed.js';
import { ProductService } from './ProductService.js';

/**
 * @param {import('@prisma/client').Prisma.TransactionClient} prismaTx
 * @param {string} businessId
 * @param {string[]} categoryNames
 */
export async function seedProductCategoriesForBusiness(prismaTx, businessId, categoryNames) {
  if (!Array.isArray(categoryNames) || categoryNames.length === 0) return 0;

  let count = 0;
  for (let i = 0; i < categoryNames.length; i++) {
    const name = String(categoryNames[i] || '').trim();
    if (!name) continue;

    await prismaTx.product_categories.upsert({
      where: {
        business_id_name: {
          business_id: businessId,
          name,
        },
      },
      create: {
        business_id: businessId,
        name,
        slug: slugifyCategoryName(name),
        sort_order: i,
        is_active: true,
      },
      update: {
        sort_order: i,
        is_active: true,
      },
    });
    count++;
  }
  return count;
}

/**
 * Seed vertical template categories + products for a new business.
 * @param {{ businessId: string, domainKey: string, countryIso: string, itemNames?: string[] | null }} params
 */
export async function provisionRegistrationSeed({ businessId, domainKey, countryIso, itemNames = null }) {
  const payload = buildRegistrationSeedPayload({
    businessId,
    domainKey,
    countryIso,
  });

  let items = payload.items;
  if (Array.isArray(itemNames) && itemNames.length > 0) {
    const selected = new Set(itemNames);
    items = items.filter((row) => selected.has(row.name));
  }

  return prismaBase.$transaction(async (tx) => {
    const categoryCount = await seedProductCategoriesForBusiness(
      tx,
      businessId,
      payload.categories
    );

    let productCount = 0;
    if (items.length > 0) {
      const results = await ProductService.seedProducts(businessId, items, tx);
      productCount = results.length;
    }

    return {
      categoryCount,
      productCount,
      marketFeatures: payload.marketFeatures,
    };
  });
}
