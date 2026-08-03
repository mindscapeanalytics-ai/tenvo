# Water Delivery Demo - Realistic Business Seeding

## Overview

The water delivery demo is seeded from **actual Pakistan water plant register entries** (dated January-March 2026), providing realistic data for testing Route Hisab, KPIs, billing, and delivery tracking features.

## Data Source

Based on real register pages showing:
- **60 customers** across 6 major routes
- Account codes with town blocks (P1-927, P2-420, 11B-90, etc.)
- Daily DEL/REC tracking (delivered/received empties)
- Bottle balance management
- Cash collection entries (ranging from PKR 450 to PKR 23,100)
- Mixed customer types: Residential (46), Corporate (7), Commercial (7)
- Multiple product rates (PKR 140-150 per bottle)

## Register Structure Captured

###Page 1 (Date: 3/1/26)
**DHA Phase 5 Routes (P1, P2 Blocks)**
- Residential villas with 1-4 bottles/day
- Corporate office complex (P2-420) with 8 bottles/day
- Cash collections: 2800, 2400, 3000, 1960, 2890 PKR

### Page 2 (Date: 1/3/26)  
**Clifton 11-B & Bahria Town Routes**
- Clifton commercial + residential mix
- Bahria gated community (P26, P27, P91)
- Medical centers in Gulshan 10-B
- Cash collections: 450, 490, 800, 600, 380, 900 PKR

### Page 3 (Date: 1/3/26)
**Financial Summary**
- Route Income: PKR 116,980
- Total Expenses: PKR 14,190
- Daily Net Profit: PKR 102,790

**Expense Breakdown:**
- Plant equipment: PKR 10,200 + 23,100
- Bulk water purchase: PKR 98,100
- Vehicle fuel: PKR 9,990
- Printing/supplies: PKR 2,690 + 2,440 + 440

## Routes & Coverage

### 1. DHA Phase 5 (P1, P2 Blocks)
- **Area:** Defence Housing Authority
- **Type:** Premium residential
- **Customers:** 22
- **Delivery pattern:** Daily (4-8 bottles per stop)
- **Rate:** PKR 145-150/bottle

### 2. DHA Phase 2 (P.2 Block)
- **Area:** Defence Phase 2
- **Type:** Mixed residential
- **Customers:** 7
- **Delivery pattern:** Daily (2-4 bottles)
- **Rate:** PKR 140-150/bottle

### 3. Clifton 11-B
- **Area:** Clifton commercial district
- **Type:** Commercial + residential
- **Customers:** 18
- **Delivery pattern:** Daily (1-4 bottles)
- **Rate:** PKR 140-150/bottle
- **Includes:** Gyms, shops, corporate offices

### 4. Bahria Town (P26, P27, P91)
- **Area:** Gated community
- **Type:** Residential + corporate
- **Customers:** 6
- **Delivery pattern:** Daily (1-9 bottles)
- **Rate:** PKR 145-150/bottle

### 5. Gulshan 10-B Medical
- **Area:** Gulshan-e-Iqbal
- **Type:** Medical centers, milk shops
- **Customers:** 4
- **Delivery pattern:** Daily (2-6 bottles)
- **Rate:** PKR 140/bottle
- **Includes:** Cloud Med Center, Al-Baseer Medical

### 6. Corporate Accounts
- **Type:** Large contracts
- **Customers:** 2
- **Delivery pattern:** Weekly/Monthly billing
- **Rate:** PKR 145/bottle
- **Cash collections:** PKR 10,200 - 23,100

## Customer Types

### Residential (Home & Flat) - 46 customers
- Daily bottles: 1-4
- Rate: PKR 150/bottle
- Payment: Weekly credit
- Bottle balance: 0-4 empties

### Corporate - 7 customers
- Daily bottles: 8-9 (or bulk monthly)
- Rate: PKR 145/bottle
- Payment: Monthly credit
- Phone numbers for invoicing

### Commercial - 7 customers
- Daily bottles: 2-6
- Rate: PKR 140/bottle
- Payment: Weekly credit
- Shops, medical centers, milk shops

## Realistic Features

### Bottle Balance Management
- Each customer tracks bottle balance (empties on deposit)
- DEL (delivered) = REC (received) in refill model
- Balance ranges: 0-9 bottles per customer

### Cash Collection Tracking
- Daily collections from residential customers
- Weekly/monthly billing for commercial/corporate
- Real amounts from register: 450, 800, 2400, 2890, 3000 PKR

### Route Organization
- Grouped by geographic area for rider efficiency
- Account codes match town blocks (P1, P2, 11-B, etc.)
- House numbers captured for delivery verification

## KPIs & Analytics

### Daily Metrics
- Stops per day: ~53
- Bottles delivered: ~140-150/day
- Cash collected: PKR 20,000-25,000/day
- Active routes: 6-8

### 10-Day Historical Data
- Total stops: 503
- Total bottles: 1,469
- Total revenue: PKR 216,830
- Cash collected: PKR 52,318
- Average per stop: PKR 431

### Financial Model (from register)
- Gross revenue: ~PKR 117,000/day
- Operating expenses: ~PKR 14,200/day
- Net profit: ~PKR 102,800/day
- Profit margin: ~88%

## Database Schema

### Customers Table
```sql
- account_no (domain_data)
- town_code
- house_no
- delivery_route
- daily_bottles
- product_rate
- bottle_balance
- customer_type (Home & Flat, Corporate, Commercial)
```

### Water Delivery Stops
```sql
- delivery_date
- customer_id
- house_no_snapshot
- route_label
- account_no_snapshot
- town_code_snapshot
- cash_collected
- status (confirmed)
```

### Water Delivery Lines
```sql
- stop_id
- product_id (19L refill)
- quantity (DEL)
- received_quantity (REC)
- unit_price_snapshot
```

## Testing Routes Hisab

### Daily Route Sheet
1. Navigate to: `/business/water-delivery` → Route Hisab tab
2. View today's deliveries grouped by route
3. Track DEL/REC for each stop
4. Record cash collections

### Weekly/Monthly Billing
1. Select customer and billing period
2. Generate bill with breakdown by day
3. Print 58mm thermal bill (EN/Urdu)
4. Send WhatsApp reminder with bill details

### Dashboard KPIs
1. View 10-day delivery trends
2. Track cash collection vs. credit
3. Monitor bottle float (empties on deposit)
4. Analyze route efficiency

## Scripts

### Seed Demo Data
```bash
node scripts/seed-water-delivery-demo.mjs
```
Creates 60 customers, 503 delivery stops (today + 10 days historical)

### Verify Wiring
```bash
node scripts/verify-water-delivery-demo.mjs
```
Validates customers, stops, lines, routes, KPIs, settings

## Settings Configuration

### Water Hisab Products
```json
{
  "waterHisab": {
    "productIds": [
      "<19L-refill-id>",
      "<5L-bottle-id>",
      "<1.5L-case-id>",
      "<deposit-id>",
      "<dispenser-id>"
    ],
    "defaultProductId": "<19L-refill-id>"
  }
}
```

### Storefront Configuration
```json
{
  "storefront": {
    "waterDelivery": {
      "hisabProductIds": [
        "<19L-refill-id>",
        "<5L-bottle-id>",
        "<1.5L-case-id>"
      ]
    }
  }
}
```

## Real-World Patterns

### Payment Cycles
- Residential: Weekly billing (7 days)
- Commercial: Weekly billing (7 days)
- Corporate: Monthly billing (30 days)

### Delivery Frequency
- Daily customers: 85% delivery rate (some skips)
- Weekly customers: Bulk delivery once/week
- Custom customers: On-demand only

### Product Mix
- Primary: 19L refill bottles (95% of volume)
- Secondary: 5L bottles, 1.5L cases
- Ancillary: Deposits, dispensers (one-time)

### Cash Flow
- Daily cash: ~20% of revenue
- Weekly collections: ~60% of revenue
- Monthly corporate: ~20% of revenue

## Domain Knowledge Integration

### Route Planning
- Group customers by postal code + area
- Optimize for rider efficiency
- Track bottle float per route

### Seasonality
- Peak: Summer heat, Ramadan
- Plant supply adjustments
- Deposit float management

### Compliance (Pakistan)
- PSQCA plant license tracking
- Deposit accounting (separate from GST sales)
- JazzCash/Easypaisa for digital collections

## Troubleshooting

### Foreign Key Constraints
Script handles cleanup order:
1. water_delivery_lines
2. water_delivery_stops
3. invoice_payments → invoice_items → invoices
4. customers

### Column Name Mismatches
- Use `created_at` not `createdAt`
- Use `updated_at` not `updatedAt`
- Postgres snake_case convention

### Missing Products
Script continues if products not found but warns.
Ensure demo-water has 19L refill product seeded first.

## Feature Wiring Checklist

- [x] Customer seeding with domain_data
- [x] Route-based organization
- [x] Delivery stops with cash tracking
- [x] Delivery lines with DEL/REC
- [x] Historical data (10 days)
- [x] KPI calculations
- [x] Settings configuration
- [x] Route Hisab integration
- [x] Thermal bill support
- [x] WhatsApp reminders
- [x] Dashboard analytics
- [x] Bottle balance tracking
- [x] Multi-route optimization
- [x] Corporate account handling

## References

- Register photos: Original handwritten entries
- Domain: `water-delivery` (canonical key)
- Aliases: `water`, `water-shop`, `water-supply`, `bottled-water`
- Hub tab: `route-hisab`
- Thermal: 58mm bills (EN/Urdu)
- Actions: `lib/actions/standard/waterHisab.js`
- Components: `components/water/WaterRouteHisab.jsx`
- Helpers: `lib/storefront/waterShopHisab.js`
