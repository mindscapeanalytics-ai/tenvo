-- Diagnostic SQL: Check demo stores configuration
-- Run this to see why demo stores return 404

-- 1. Check if demo-boutique business exists
SELECT 
    id,
    business_name,
    domain,
    category,
    is_active,
    is_deleted,
    approval_status,
    plan_tier,
    created_at
FROM businesses
WHERE domain = 'demo-boutique'
OR business_name LIKE '%demo%'
OR domain LIKE '%demo%'
ORDER BY created_at DESC
LIMIT 10;

-- 2. Check business_custom_domains for demo stores
SELECT 
    bcd.id,
    b.business_name,
    b.domain as business_domain,
    bcd.domain as custom_domain,
    bcd.is_active,
    bcd.is_primary,
    bcd.created_at
FROM business_custom_domains bcd
JOIN businesses b ON b.id = bcd.business_id
WHERE b.domain LIKE '%demo%'
   OR b.business_name LIKE '%demo%'
ORDER BY bcd.created_at DESC;

-- 3. Check storefront settings
SELECT 
    b.business_name,
    b.domain,
    bs.is_storefront_enabled,
    bs.settings->'storefront'->>'enabled' as storefront_setting
FROM business_settings bs
JOIN businesses b ON b.id = bs.business_id
WHERE b.domain LIKE '%demo%'
   OR b.business_name LIKE '%demo%';

-- 4. Check product counts for demo stores
SELECT 
    b.business_name,
    b.domain,
    COUNT(p.id) as total_products,
    COUNT(p.id) FILTER (WHERE p.is_active = true AND COALESCE(p.is_deleted, false) = false) as active_products
FROM businesses b
LEFT JOIN products p ON p.business_id = b.id
WHERE b.domain LIKE '%demo%'
   OR b.business_name LIKE '%demo%'
GROUP BY b.id, b.business_name, b.domain;

-- 5. POTENTIAL FIX: If demo stores are missing custom domain entries
-- Uncomment and run if diagnosis shows missing entries:
/*
INSERT INTO business_custom_domains (business_id, domain, is_active, is_primary)
SELECT id, domain, true, true
FROM businesses
WHERE (domain LIKE '%demo%' OR business_name LIKE '%demo%')
  AND id NOT IN (SELECT business_id FROM business_custom_domains WHERE is_active = true)
ON CONFLICT (business_id, domain) DO UPDATE
SET is_active = true, is_primary = true;
*/
