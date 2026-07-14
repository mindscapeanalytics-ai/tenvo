# Custom Domain Analysis for Public Storefronts — 2026

**Date:** July 14, 2026  
**Scope:** Custom domain functionality for tenant public storefronts  
**Status:** 🟡 **PARTIALLY IMPLEMENTED** — Database layer exists, DNS/SSL routing NOT functional

---

## Executive Summary

The Tenvo platform has **database infrastructure** for custom domains (`business_custom_domains` table) but **lacks host-header routing** to make custom domains actually work. Currently, storefronts are accessible only via:

- ✅ Path-based: `tenvo.store/store/{business-domain}`
- ❌ Custom domain: `example.com` → **NOT FUNCTIONAL**

### What's Missing

1. **Host-header routing** in `proxy.ts` or Next.js middleware
2. **DNS CNAME validation** before domain activation
3. **SSL certificate provisioning** (Let's Encrypt or Cloudflare)
4. **Admin UI** for managing custom domains
5. **Database constraints** (`UNIQUE(LOWER(domain))` on `business_custom_domains`)

---

## Current Implementation

### 1. Database Layer (✅ Exists)

**Table:** `business_custom_domains`

```sql
CREATE TABLE business_custom_domains (
  id SERIAL PRIMARY KEY,
  business_id UUID NOT NULL,
  domain VARCHAR(255) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  is_primary BOOLEAN DEFAULT false,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_business_custom_domains_domain ON business_custom_domains(domain);
CREATE INDEX idx_business_custom_domains_business_id ON business_custom_domains(business_id);
```

**Location:** `lib/db/migrations/add_storefront_tables_v3.sql`

**Missing in Prisma schema:** ❌ The `business_custom_domains` model is NOT defined in `prisma/schema.prisma`, only in SQL migrations.

### 2. Domain Resolution Logic (✅ Implemented, ❌ Not Routed)

**File:** `lib/tenancy/resolveStorefrontBusiness.js`

The resolver HAS logic to query `business_custom_domains`:

```javascript
// Lines 213-232: Custom domain lookup
const result = await client.query(
  `SELECT
    b.id, b.business_name, b.domain, b.email, ...
  FROM business_custom_domains cd
  JOIN businesses b ON cd.business_id = b.id
  LEFT JOIN business_settings bs ON b.id = bs.business_id
  WHERE LOWER(cd.domain) = ANY($1::text[])
    AND cd.is_active = true
    AND COALESCE(b.is_active, true) = true
  ORDER BY (LOWER(cd.domain) = $2) DESC, cd.is_primary DESC NULLS LAST, cd.id ASC
  LIMIT 5`,
  [lookupKeys, normalizedDomain]
);
```

**Problem:** This query is executed, but it's NEVER reached because:
- The proxy/middleware doesn't extract the host header and route `custom-domain.com` requests to the `/store/[businessDomain]` route
- The route always expects `businessDomain` from the URL path, not from DNS

### 3. Routing Layer (❌ NOT IMPLEMENTED)

**File:** `proxy.ts`

Current logic:
```typescript
export function proxy(request: NextRequest) {
  const host = request.headers.get('host');
  
  // Only handles canonical host redirects (www → non-www)
  const canonicalHost = resolveCanonicalHostRedirect(host ?? '');
  if (canonicalHost) {
    const url = request.nextUrl.clone();
    url.protocol = 'https:';
    url.host = canonicalHost;
    return NextResponse.redirect(url, 308);
  }
  
  // Sets security headers only
  const res = NextResponse.next();
  // ...
  return res;
}
```

**What's Missing:**

```typescript
// NEEDED: Custom domain detection and rewrite
const host = request.headers.get('host');
if (host && !host.includes('tenvo.store') && !host.includes('localhost')) {
  // This is potentially a custom domain
  const businessDomain = await lookupCustomDomain(host);
  if (businessDomain) {
    // Rewrite to /store/[businessDomain]
    const url = request.nextUrl.clone();
    url.pathname = `/store/${businessDomain}${url.pathname}`;
    return NextResponse.rewrite(url);
  }
}
```

### 4. Layout Entry Point (✅ Ready)

**File:** `app/store/[businessDomain]/layout.jsx`

```javascript
export default async function StoreLayout({ children, params }) {
  const { businessDomain } = await params;
  const result = await fetchBusinessByDomain(businessDomain);
  // ...
}
```

**How it works NOW:**
- User visits: `tenvo.store/store/demo-boutique`
- `businessDomain` = `demo-boutique` (from URL path)
- `fetchBusinessByDomain` → `resolveStorefrontBusiness` → queries `businesses.domain`

**How it SHOULD work with custom domains:**
- User visits: `myboutique.com`
- Proxy detects custom domain, looks up `business_custom_domains.domain = 'myboutique.com'`
- Rewrites internally to `/store/demo-boutique` (or passes the custom domain as `businessDomain`)
- Layout calls `fetchBusinessByDomain('myboutique.com')`
- Resolver finds business via `business_custom_domains` query (which already exists!)

---

## Gap Analysis

### Critical Gaps (P0)

| # | Gap | Impact | File/Area |
|---|-----|--------|-----------|
| 1 | **No host-header routing** | Custom domains don't work at all | `proxy.ts` |
| 2 | **Missing Prisma model** | Can't manage domains via ORM | `prisma/schema.prisma` |
| 3 | **No DNS validation** | Tenant can add domains not pointed to platform | Admin/settings |
| 4 | **No SSL provisioning** | HTTPS won't work for custom domains | Infrastructure |
| 5 | **No admin UI** | Tenants can't add/verify custom domains | Hub settings |

### Medium Priority (P1)

| # | Gap | Impact | File/Area |
|---|-----|--------|-----------|
| 6 | **No `UNIQUE(LOWER(domain))` constraint** | Two tenants could claim same domain | SQL migrations |
| 7 | **No collision check with `businesses.domain`** | Custom domain could collide with another's primary | Validation logic |
| 8 | **Cache invalidation incomplete** | `invalidateStorefrontCatalog.js` references `custom_domain` column that doesn't exist in table | `lib/storefront/invalidateStorefrontCatalog.js` |
| 9 | **No verification workflow** | No way to prove tenant owns domain before activation | Domain management |
| 10 | **No wildcard subdomain support** | Can't do `*.example.com` → one business | Domain resolution |

### Low Priority (P2)

| # | Gap | Impact |
|---|-----|--------|
| 11 | No domain transfer/ownership change flow | Hard to move domain between businesses |
| 12 | No audit log for domain changes | Can't track who added/removed domains |
| 13 | No email notifications on domain events | Tenant doesn't know when domain verified/failed |

---

## Architecture: How Custom Domains SHOULD Work

### 1. DNS Setup (Tenant's responsibility)

Tenant creates CNAME record:
```
myboutique.com  →  proxy.tenvo.store
# OR
store.myboutique.com  →  proxy.tenvo.store
```

### 2. SSL Provisioning (Platform's responsibility)

**Option A: Cloudflare for SaaS**
- Tenant adds domain in hub → Platform API calls Cloudflare
- Cloudflare auto-provisions SSL certificate
- Handles DNS challenges automatically

**Option B: Let's Encrypt + Certbot**
- Platform server runs certbot
- Uses DNS-01 or HTTP-01 challenge
- Renews certificates automatically

**Option C: Manual wildcard cert**
- `*.tenvo.store` only (doesn't cover custom domains)

### 3. Proxy Routing (Platform's implementation)

**File:** `proxy.ts` (or new `middleware.ts`)

```typescript
export async function middleware(request: NextRequest) {
  const host = request.headers.get('host') || '';
  const pathname = request.nextUrl.pathname;
  
  // Skip platform routes
  if (
    host.includes('tenvo.store') || 
    host.includes('localhost') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next')
  ) {
    return NextResponse.next();
  }
  
  // Custom domain detection
  const cleanHost = host.replace(/:\d+$/, '').toLowerCase();
  
  // Check if this host is a known custom domain
  const businessDomain = await lookupCustomDomainFromCache(cleanHost);
  
  if (businessDomain) {
    // Rewrite to internal route
    const url = request.nextUrl.clone();
    url.pathname = `/store/${businessDomain}${pathname === '/' ? '' : pathname}`;
    
    // Pass original host for metadata/canonicals
    const response = NextResponse.rewrite(url);
    response.headers.set('x-tenvo-custom-domain', cleanHost);
    return response;
  }
  
  // Unknown domain → 404 or redirect to main site
  return NextResponse.redirect(new URL('https://tenvo.store/404'));
}
```

**Cache layer:**

```typescript
// lib/cache/customDomainCache.ts
const CUSTOM_DOMAIN_CACHE_TTL = 300; // 5 minutes

export async function lookupCustomDomainFromCache(host: string) {
  const cacheKey = `custom-domain:${host}`;
  
  // Try Redis L1
  const cached = await redis.get(cacheKey);
  if (cached) return cached;
  
  // Query DB
  const result = await pool.query(
    `SELECT b.domain as business_domain
     FROM business_custom_domains cd
     JOIN businesses b ON cd.business_id = b.id
     WHERE LOWER(cd.domain) = $1 
       AND cd.is_active = true 
       AND cd.verified_at IS NOT NULL
       AND COALESCE(b.is_active, true) = true
     LIMIT 1`,
    [host.toLowerCase()]
  );
  
  const businessDomain = result.rows[0]?.business_domain;
  
  if (businessDomain) {
    await redis.setex(cacheKey, CUSTOM_DOMAIN_CACHE_TTL, businessDomain);
  }
  
  return businessDomain || null;
}
```

### 4. Verification Flow (Before activation)

**Step 1: Tenant adds domain**
```
POST /api/v1/storefront/custom-domains
{
  "domain": "myboutique.com"
}
```

**Step 2: Platform checks DNS**
```javascript
// Check if CNAME points to proxy.tenvo.store
const dns = await resolveDNS(domain);
if (!dns.cname.includes('tenvo.store')) {
  return { error: 'DNS not configured correctly' };
}
```

**Step 3: Platform provisions SSL**
- Via Cloudflare API or certbot

**Step 4: Domain marked as verified**
```sql
UPDATE business_custom_domains 
SET 
  verified_at = NOW(),
  is_active = true
WHERE domain = 'myboutique.com';
```

### 5. Admin UI (Hub Settings)

**Location:** `app/business/[category]/settings` → new "Custom Domain" tab

**Features:**
- Add domain input
- DNS setup instructions (CNAME record)
- Verification status badge (Pending / Verified / Failed)
- Primary domain toggle (for multiple domains)
- Remove domain button

---

## Database Schema Additions

### 1. Add Prisma Model

**File:** `prisma/schema.prisma`

```prisma
model business_custom_domains {
  id           String     @id @default(dbgenerated("uuid_generate_v4()")) @db.Uuid
  business_id  String     @db.Uuid
  domain       String     @db.VarChar(255)
  is_active    Boolean    @default(true)
  is_primary   Boolean    @default(false)
  verified_at  DateTime?  @db.Timestamptz(6)
  created_at   DateTime   @default(now()) @db.Timestamptz(6)
  updated_at   DateTime   @default(now()) @db.Timestamptz(6)
  
  business     businesses @relation(fields: [business_id], references: [id], onDelete: Cascade)
  
  @@unique([business_id, domain], map: "unique_business_custom_domain")
  @@index([domain], map: "idx_custom_domains_domain")
  @@index([business_id], map: "idx_custom_domains_business")
  @@map("business_custom_domains")
}
```

**Add to `businesses` model:**

```prisma
model businesses {
  // ... existing fields
  custom_domains business_custom_domains[]
}
```

### 2. Migration: Add Constraints

**File:** `prisma/migrations/XXXXXX_custom_domain_constraints/migration.sql`

```sql
-- Ensure case-insensitive uniqueness
CREATE UNIQUE INDEX IF NOT EXISTS idx_business_custom_domains_domain_lower 
ON business_custom_domains(LOWER(domain));

-- Prevent custom domain from colliding with primary business domains
ALTER TABLE business_custom_domains 
ADD CONSTRAINT check_domain_not_business_primary 
CHECK (
  NOT EXISTS (
    SELECT 1 FROM businesses 
    WHERE LOWER(businesses.domain) = LOWER(business_custom_domains.domain)
      AND businesses.id != business_custom_domains.business_id
  )
);

-- Only one primary domain per business
CREATE UNIQUE INDEX IF NOT EXISTS idx_business_custom_domains_primary
ON business_custom_domains(business_id)
WHERE is_primary = true;
```

---

## Implementation Checklist

### Phase 1: Core Infrastructure (Week 1-2)

- [ ] **Add Prisma model** for `business_custom_domains`
- [ ] **Add migration** for constraints (unique domain, collision check)
- [ ] **Implement host-header routing** in `proxy.ts` or `middleware.ts`
- [ ] **Create cache layer** for custom domain lookups (`lib/cache/customDomainCache.ts`)
- [ ] **Test domain resolution** with manual DB entries

### Phase 2: DNS & SSL (Week 3-4)

- [ ] **Choose SSL strategy**: Cloudflare for SaaS vs Let's Encrypt
- [ ] **Implement DNS validation** check before domain activation
- [ ] **Set up SSL provisioning** workflow (API integration or certbot cron)
- [ ] **Add DNS instructions** to admin UI and documentation
- [ ] **Test SSL handshake** for custom domains

### Phase 3: Admin UI (Week 5)

- [ ] **Create Custom Domain settings tab** in hub
- [ ] **Add domain** form with validation (regex, collision check)
- [ ] **Show DNS instructions** with tenant-specific CNAME record
- [ ] **Display verification status** (pending/verified/failed badge)
- [ ] **Primary domain toggle** (for canonical URLs in emails/SEO)
- [ ] **Remove domain** button (with confirmation)

### Phase 4: Server Actions (Week 5)

- [ ] **`addCustomDomainAction`** — validates, inserts DB row, triggers DNS check
- [ ] **`verifyCustomDomainAction`** — manual re-check DNS + SSL
- [ ] **`removeCustomDomainAction`** — soft-delete or hard-delete with purge
- [ ] **`setCustomDomainPrimaryAction`** — mark one domain as primary
- [ ] **DNS verification cron** — background job to re-verify every 24h

### Phase 5: Invalidation & Edge Cases (Week 6)

- [ ] **Update cache invalidation** — `invalidateStorefrontCatalog.js` and other catalog/business purge logic
- [ ] **Add domain to sitemap** generation (if tenant wants custom domain indexed)
- [ ] **Canonical URL resolution** — use primary custom domain in meta tags if set
- [ ] **Email links** — use custom domain in transactional emails if primary
- [ ] **Handle domain removal** — purge from cache, revoke SSL cert (if manual)

### Phase 6: Testing & Documentation (Week 7)

- [ ] **Unit tests** for domain validation logic
- [ ] **Integration tests** for host-header routing
- [ ] **Manual QA** — add real domain, verify DNS, test storefront load
- [ ] **Update docs** — `docs/CUSTOM_DOMAINS.md` with setup guide
- [ ] **Verify script** — `npm run verify:custom-domains`

---

## Verification Scripts

### 1. Database Check

**File:** `scripts/verify-custom-domain-db.mjs`

```javascript
import pool from '../lib/db.js';

async function verifyCustomDomainDb() {
  const client = await pool.connect();
  
  try {
    // Check table exists
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'business_custom_domains'
      );
    `);
    
    if (!tableCheck.rows[0].exists) {
      console.error('❌ business_custom_domains table missing');
      process.exit(1);
    }
    
    // Check constraints
    const constraints = await client.query(`
      SELECT constraint_name 
      FROM information_schema.table_constraints
      WHERE table_name = 'business_custom_domains';
    `);
    
    const constraintNames = constraints.rows.map(r => r.constraint_name);
    console.log('✅ Constraints:', constraintNames);
    
    // Check sample domains
    const domains = await client.query(`
      SELECT cd.domain, b.business_name, cd.is_active, cd.verified_at
      FROM business_custom_domains cd
      JOIN businesses b ON cd.business_id = b.id
      LIMIT 5;
    `);
    
    console.log('✅ Sample domains:', domains.rows);
    
  } finally {
    client.release();
  }
}

verifyCustomDomainDb();
```

### 2. Routing Check

**File:** `scripts/verify-custom-domain-routing.mjs`

```javascript
// Test that host-header routing works locally
// (Requires manual /etc/hosts entry: 127.0.0.1 test-store.local)

async function testCustomDomainRouting() {
  const response = await fetch('http://localhost:3000/', {
    headers: { 'Host': 'test-store.local' }
  });
  
  const text = await response.text();
  
  if (text.includes('test-store') || text.includes('Store Not Found')) {
    console.log('✅ Host-header routing working');
  } else {
    console.error('❌ Host-header routing NOT working');
    process.exit(1);
  }
}

testCustomDomainRouting();
```

---

## Security Considerations

### 1. Domain Squatting Prevention

**Problem:** Tenant A claims `nike.com` before Nike registers on Tenvo.

**Solution:**
- Require DNS verification BEFORE activation
- Only mark `is_active=true` after DNS + SSL verified
- Blocklist: maintain list of protected brands (optional)

### 2. Subdomain Takeover

**Problem:** Tenant removes domain from Tenvo but forgets to remove DNS CNAME.

**Solution:**
- When domain removed, keep `deleted_at` record (soft delete)
- Return 410 Gone for deleted custom domains
- Email tenant when domain removed with DNS cleanup instructions

### 3. SSL Certificate Security

**Problem:** Shared wildcard cert exposes private key to all tenants.

**Solution:**
- Use per-domain certs via Let's Encrypt or Cloudflare
- Never expose private keys to tenants
- Auto-renew 30 days before expiry

### 4. Cache Poisoning

**Problem:** Attacker tricks cache to map `victim.com` → `attacker-business`.

**Solution:**
- Cache key includes exact domain (case-normalized)
- Cache TTL short (5 minutes)
- Invalidate cache on domain changes
- Require DB re-verification periodically

---

## Cost Implications

### SSL Certificates

| Option | Cost | Scalability |
|--------|------|-------------|
| Cloudflare for SaaS | $10/month per zone + $0.10 per cert/month | ✅ Auto-provisioning, unlimited certs |
| Let's Encrypt (manual) | Free | ⚠️ Requires certbot automation, renewal cron |
| Wildcard cert only | ~$100/year | ❌ Only covers `*.tenvo.store`, not custom domains |

**Recommendation:** Cloudflare for SaaS (best UX, minimal ops burden).

### DNS Lookups

- Average 1-2 DNS queries per custom domain verification
- Cacheable for 5-15 minutes
- Negligible cost (~$0.40 per million queries on Route53)

---

## Rollout Plan

### Stage 1: Beta (Selected tenants only)

- Enable for 5-10 pilot businesses
- Manual SSL provisioning
- Monitor DNS TTL propagation issues
- Collect feedback on setup complexity

### Stage 2: Paid Plans Only

- Roll out to Pro/Enterprise tiers
- Automated DNS verification
- Automated SSL via Cloudflare
- Self-service UI in hub

### Stage 3: General Availability

- Available to all paid plans (Starter excluded)
- Plan limits: Starter (0), Pro (1 domain), Enterprise (5 domains)
- Documentation and video tutorials
- Support team trained on DNS troubleshooting

---

## Conclusion

### Current State: 🟡 Foundation Exists, Not Functional

- ✅ Database table exists (`business_custom_domains`)
- ✅ Query logic exists (in `resolveStorefrontBusiness.js`)
- ❌ No routing (proxy doesn't check host header)
- ❌ No SSL provisioning
- ❌ No admin UI
- ❌ No DNS validation

### To Make It Work: ~6-7 weeks of development

1. Add host-header routing (1 week)
2. Implement DNS validation (1 week)
3. Set up SSL provisioning (2 weeks, depends on strategy)
4. Build admin UI (1 week)
5. Testing & edge cases (1 week)
6. Documentation & rollout (1 week)

### Recommended Next Steps

1. **Decide on SSL strategy** (Cloudflare vs Let's Encrypt)
2. **Add Prisma model** + constraints migration
3. **Implement proxy routing** with cache layer
4. **Build admin UI** for domain management
5. **Test end-to-end** with real domain before GA

---

**Report prepared by:** Kiro AI  
**Review status:** Ready for engineering review  
**Priority:** P1 (Feature gap, not blocking current operations)
