# Financial Hub System Flow (Domain-Aware, Plan-Aware, Tenant-Safe)

## 1) Client Journey (Top-Level)
1. Marketing/Landing entry point (industry-specific CTAs)
2. Account registration (`/register`) with domain + business identity
3. Plan selection (Basic/Standard/Premium/Enterprise)
4. Business workspace provisioning (tenant + owner membership + COA seed)
5. First-use setup (domain template, regional defaults, sample products)
6. Daily operations via role-aware, plan-aware dashboard
7. Team expansion (invite members, assign roles, enforce seat limits)
8. Plan upgrades/downgrades from Settings > Billing

## 2) Core Architecture Rules
- Tenant isolation: every operation is scoped by `business_id`
- Access checks: session auth + business membership + role permission
- Commercial checks: plan feature flags + plan limits (seats, warehouses, etc.)
- Domain behavior: domain knowledge defines defaults, workflows, and relevance
- UI safety: hidden/locked tabs mirror backend authorization (never UI-only trust)

## 3) Registration and Provisioning
- `createBusiness` validates:
  - domain handle uniqueness
  - supported domain category
  - selected plan tier
- `createBusiness` provisions:
  - `businesses` row with selected `plan_tier`
  - seats/product/warehouse caps from plan config
  - owner membership in `business_users`
  - chart of accounts seed

## 4) Team and Access Model
- Team members live in `business_users`
- Owner/Admin can:
  - add existing users by email
  - assign roles (except owner)
  - deactivate members
- Seat limit is enforced by plan at member-add time

## 5) Plan Model
- Plan catalog in `lib/config/plans.js`
- Enforced in backend via:
  - `checkPlanFeature(businessId, featureKey)`
  - `checkPlanLimit(businessId, limitKey, currentCount)`
- Billing/plan switch endpoint updates:
  - `plan_tier`
  - `plan_seats`
  - `max_products`
  - `max_warehouses`

## 6) Domain-Aware Scope
- Domain source of truth: `lib/domainKnowledge.js`
- Current coverage: 55 domains
- New domains added:
  - `salon-spa`
  - `dental-clinic`
  - `veterinary-clinic`

## 7) UX Principles for “Professional Compact Attractive UI/UX”
- Keep first-run onboarding to 3 steps:
  - identity
  - domain
  - plan + launch
- Show contextual recommendations (e.g., hospitality => premium)
- Keep actions obvious: one primary action per step
- Keep safety explicit: locked features show upgrade path

## 8) Competitive Positioning (Original Implementation)
- Fast onboarding + vertical templates
- POS + inventory + finance + operations under one tenant-safe model
- Domain-specific relevance instead of one-size-fits-all tabs
- Strong RBAC + commercial guardrails for team scale
