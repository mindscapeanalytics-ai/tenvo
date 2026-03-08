# Dashboard KPI & Insight Gap Analysis (Step 1)

Date: 2026-03-05
Scope: Main business dashboard (`/business/[category]?tab=dashboard`) and dashboard main header area.

## 1) KPI/Insight Patterns Observed in Provided Best-Practice Screenshots

### A. Operational Snapshot KPIs
- Total orders / transactions
- Total returns
- Total purchases
- Revenue / sales amount
- Active customers / visitors
- Pending requests / pending work
- Overdue payments / collections risk

### B. Inventory Control KPIs
- Low-stock / stockout risk alerts
- Inventory value (stock value)
- In-stock units
- 30-day demand (avg orders)
- Unit price/value mix
- Predicted months (or days) until stockout
- Stock check recency (days since last cycle count)
- Inventory accuracy %
- Warehouse utilization %

### C. Service & Execution KPIs
- Open/pending tasks queue
- Schedule / recent activity feed
- Team online/availability indicators
- Throughput and status counts (complete/processing/hold/cancel)

### D. Performance & Trend Insights
- Period-over-period delta on each KPI
- Revenue and margin trend charts
- Returns rate by month
- Top products/customers/channels blocks
- Time-range controls (7d / 30d / monthly)

## 2) Current Dashboard Coverage in Financial Hub

Based on current implementation in:
- `app/business/[category]/components/tabs/DomainDashboard.tsx`
- `app/business/[category]/components/islands/portlets/RemindersPortlet.client.tsx`
- `app/business/[category]/components/islands/AnalyticsDashboard.client.tsx`

### Already Present
- Revenue KPI
- Orders KPI
- Expenses KPI
- Active customers KPI
- Low stock / overdue / pending reminders
- Recent activity feed
- Analytics chart area
- Domain efficiency meter
- Predictive insights text cards

### Missing or Underrepresented (Relevant to Inventory-first dashboard)
- Inventory value KPI (explicit card)
- In-stock units KPI (explicit card)
- Return rate KPI
- Pending returns KPI
- Avg order value KPI
- Inventory coverage / days to stockout proxy
- Stock check recency KPI
- Inventory accuracy KPI (even as modeled score)
- Warehouse utilization KPI (modeled from available data)
- Compact, high-information dashboard header strip (summary + critical KPIs)

## 3) Priority Implementation for Step 2 (Now)

### Header + KPI First Pass
1. Upgrade dashboard main header with compact summary tiles (shadcn card style).
2. Add missing inventory-relevant KPI cards using currently available data:
   - Inventory value
   - In-stock units
   - Return rate
   - Pending returns
   - Avg order value
   - Coverage days (proxy)
   - Stock check recency (derived)
   - Inventory accuracy (derived)
   - Warehouse utilization (derived)
3. Keep layout compact and dense, inspired by provided references.

## 4) Data Reality Notes
- Some screenshot KPIs require data not currently modeled (e.g., explicit return records, exact cycle-count logs, warehouse capacity metadata).
- For first pass, derived/proxy metrics are used where source fields are unavailable.
- In next phase, these should be replaced with authoritative backend fields and historical tables.

## 5) Step 3 Follow-up (After this pass)
- Component style unification with shared card primitives and tighter spacing.
- Standardized KPI metadata schema (title, trend, status, target, source confidence).
- Optional per-domain KPI presets (retail/manufacturing/service).