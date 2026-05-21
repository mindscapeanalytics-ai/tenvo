'use server';

import pool from '@/lib/db';
import { actionSuccess, actionFailure } from '@/lib/actions/_shared/result';

/**
 * Get business by domain for storefront
 */
export async function getBusinessByDomain(domain) {
  const client = await pool.connect();
  
  try {
    // First try to find by domain field
    let result = await client.query(
      `SELECT 
        b.id, b.business_name, b.domain, b.email, b.phone, b.description,
        b.logo_url, b.cover_image_url, b.website, b.category,
        b.address, b.city, b.country, b.postal_code,
        b.is_active, b.is_verified, b.created_at,
        bs.plan_tier, bs.settings as business_settings,
        p.features as plan_features
      FROM businesses b
      LEFT JOIN business_settings bs ON b.id = bs.business_id
      LEFT JOIN subscription_plans p ON bs.plan_id = p.id
      WHERE b.domain = $1 AND b.is_active = true`,
      [domain]
    );
    
    // If not found, check if it's a custom domain
    if (result.rows.length === 0) {
      result = await client.query(
        `SELECT 
          b.id, b.business_name, b.domain, b.email, b.phone, b.description,
          b.logo_url, b.cover_image_url, b.website, b.category,
          b.address, b.city, b.country, b.postal_code,
          b.is_active, b.is_verified, b.created_at,
          bs.plan_tier, bs.settings as business_settings,
          p.features as plan_features
        FROM business_custom_domains cd
        JOIN businesses b ON cd.business_id = b.id
        LEFT JOIN business_settings bs ON b.id = bs.business_id
        LEFT JOIN subscription_plans p ON bs.plan_id = p.id
        WHERE cd.domain = $1 AND cd.is_active = true AND b.is_active = true`,
        [domain]
      );
    }
    
    if (result.rows.length === 0) {
      return actionFailure('BUSINESS_NOT_FOUND', 'Business not found');
    }
    
    const business = result.rows[0];
    
    // Check if storefront is enabled for this business
    const settings = business.business_settings || {};
    if (settings.storefront?.enabled === false) {
      return actionFailure('STOREFRONT_DISABLED', 'Storefront is not enabled for this business');
    }
    
    // Get categories
    const categoriesResult = await client.query(
      `SELECT id, name, slug, description, image_url, parent_id
      FROM product_categories
      WHERE business_id = $1 AND is_active = true
      ORDER BY sort_order, name`,
      [business.id]
    );
    
    return actionSuccess({
      business: {
        id: business.id,
        business_name: business.business_name,
        domain: business.domain,
        email: business.email,
        phone: business.phone,
        description: business.description,
        logo_url: business.logo_url,
        cover_image_url: business.cover_image_url,
        website: business.website,
        category: business.category,
        address: business.address,
        city: business.city,
        country: business.country,
        postal_code: business.postal_code,
        is_verified: business.is_verified,
        created_at: business.created_at,
      },
      settings: {
        ...settings,
        currency: settings.currency || 'PKR',
        locale: settings.locale || 'en-PK',
      },
      categories: categoriesResult.rows,
      plan: {
        tier: business.plan_tier || 'starter',
        features: business.plan_features || {},
      },
    });
    
  } catch (error) {
    console.error('[getBusinessByDomain] Error:', error);
    return actionFailure('DATABASE_ERROR', error.message);
  } finally {
    client.release();
  }
}

/**
 * Get business public settings
 */
export async function getBusinessPublicSettings(businessId) {
  const client = await pool.connect();
  
  try {
    const result = await client.query(
      `SELECT settings FROM business_settings WHERE business_id = $1`,
      [businessId]
    );
    
    if (result.rows.length === 0) {
      return actionSuccess({
        currency: 'PKR',
        locale: 'en-PK',
        storefront: {
          theme: 'default',
          primary_color: '#c49c3b',
        },
      });
    }
    
    const settings = result.rows[0].settings || {};
    
    return actionSuccess({
      currency: settings.currency || 'PKR',
      locale: settings.locale || 'en-PK',
      storefront: settings.storefront || {},
    });
    
  } catch (error) {
    console.error('[getBusinessPublicSettings] Error:', error);
    return actionFailure('DATABASE_ERROR', error.message);
  } finally {
    client.release();
  }
}

/**
 * Get business contact information
 */
export async function getBusinessContact(businessId) {
  const client = await pool.connect();
  
  try {
    const result = await client.query(
      `SELECT 
        business_name, email, phone, 
        address, city, country,
        website, social_links
      FROM businesses
      WHERE id = $1`,
      [businessId]
    );
    
    if (result.rows.length === 0) {
      return actionFailure('BUSINESS_NOT_FOUND', 'Business not found');
    }
    
    return actionSuccess(result.rows[0]);
    
  } catch (error) {
    console.error('[getBusinessContact] Error:', error);
    return actionFailure('DATABASE_ERROR', error.message);
  } finally {
    client.release();
  }
}

/**
 * Check if business has active storefront
 */
export async function isStorefrontActive(businessId) {
  const client = await pool.connect();
  
  try {
    const result = await client.query(
      `SELECT b.is_active, bs.settings
      FROM businesses b
      LEFT JOIN business_settings bs ON b.id = bs.business_id
      WHERE b.id = $1`,
      [businessId]
    );
    
    if (result.rows.length === 0) {
      return actionFailure('BUSINESS_NOT_FOUND', 'Business not found');
    }
    
    const { is_active, settings } = result.rows[0];
    const storefrontEnabled = settings?.storefront?.enabled !== false;
    
    return actionSuccess({
      active: is_active && storefrontEnabled,
      is_active,
      storefront_enabled: storefrontEnabled,
    });
    
  } catch (error) {
    console.error('[isStorefrontActive] Error:', error);
    return actionFailure('DATABASE_ERROR', error.message);
  } finally {
    client.release();
  }
}
