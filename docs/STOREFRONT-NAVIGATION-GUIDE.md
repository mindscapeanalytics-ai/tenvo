# Storefront Navigation Guide
## Enterprise Customer Journey & Business Owner Navigation

---

## Overview

Tenvo provides a dual-navigation system:
1. **Business Dashboard** - For business owners to manage their store
2. **Public Storefront** - For customers to browse and purchase products

---

## 🏢 Business Owner Navigation (Dashboard)

### Access URL Pattern
```
/business/[category]?tab=[feature]
```

### Sidebar Navigation Structure

#### 1. ESSENTIALS Section
- **Dashboard** - Overview of business performance
- **Inventory & Stock** - Product management
- **Sales & Invoicing** - Invoice management
- **Customers** - Customer database
- **Vendors & Procurement** - Vendor management
- **Purchase Orders** - Procurement tracking

#### 2. STOREFRONT Section ⭐
- **Point of Sale** - POS terminal for in-person sales
- **Refunds & Returns** - Process customer returns
- **Restaurant** - Restaurant/hospitality features (if applicable)
- **Loyalty & CRM** - Customer loyalty programs
- **Quotations** - Create and manage quotes
- **Sales Manager** - Sales analytics and reports
- **View Public Store** 🆕 - Opens public storefront in new tab
- **Store Settings** 🆕 - Configure storefront appearance and settings

#### 3. FINANCE Section
- **Finance Hub** - Complete financial management
- **Payments** - Payment tracking
- **Tax / GST** - Tax compliance

#### 4. OPERATIONS Section
- **Warehouses** - Multi-location inventory
- **Manufacturing** - Production and BOM
- **Batches & Serials** - Batch tracking
- **Payroll & HR** - Employee management
- **Approvals** - Approval workflows

#### 5. INTELLIGENCE Section
- **Analytics & AI** - AI-powered insights
- **Campaigns & Marketing** - Marketing automation
- **Audit Trail** - Activity logging

#### 6. SYSTEM Section
- **Settings** - System configuration
- **Platform Admin** - Platform-level controls (platform owner only)

---

## 🛒 Customer Navigation (Public Storefront)

### Access URL Pattern
```
/store/[businessDomain]/[page]
```

### Storefront Pages

#### 1. Home Page
```
/store/[businessDomain]
```
- Featured products
- Hero banner with business branding
- Category navigation
- Promotional sections

#### 2. Products Catalog
```
/store/[businessDomain]/products?category=&search=&sort=
```
- **Product Grid** - Responsive grid layout
- **Category Filters** - Sidebar navigation
- **Price Range Filter** - Slider-based filtering
- **Search Bar** - Real-time search with suggestions
- **Sort Options**:
  - Featured
  - Newest Arrivals
  - Price: Low to High
  - Price: High to Low
  - Name: A to Z
  - Most Popular
- **Active Filters Display** - Show and remove applied filters
- **Pagination** - Load more or numbered pagination

#### 3. Product Detail Page
```
/store/[businessDomain]/products/[slug]
```
- **Product Gallery** - Image zoom, thumbnails, fullscreen
- **Product Info**:
  - Name and SKU
  - Price (with compare price for discounts)
  - Rating and reviews
  - Stock status
  - Description
- **Product Variants** - Size, color, etc. selection
- **Add to Cart Section** - Quantity selector, add button
- **Trust Badges** - Free shipping, secure payment, returns
- **Product Reviews** - Customer reviews and ratings
- **Related Products** - Carousel of similar items
- **Recently Viewed** - Session-based history

#### 4. Shopping Cart
```
/store/[businessDomain]/cart
```
- **Cart Items List**:
  - Product image, name, variant
  - Quantity controls (+/-)
  - Price per item
  - Remove item button
- **Promo Code Section** - Apply discount codes
- **Shipping Method Selection**:
  - Standard (Free over PKR 2000)
  - Express (PKR 300)
  - Pickup (Free)
- **Order Summary**:
  - Subtotal
  - Shipping cost
  - Tax (17% GST for Pakistan)
  - Total
- **Continue Shopping** - Back to products
- **Proceed to Checkout** - Next step

#### 5. Checkout (Multi-Step)
```
/store/[businessDomain]/checkout
```

**Step 1: Information**
- Email
- First Name / Last Name
- Phone Number

**Step 2: Shipping**
- Address
- City
- Postal Code
- Country (default: Pakistan)

**Step 3: Payment**
- **Payment Methods**:
  - Credit/Debit Card (Stripe integration)
  - Cash on Delivery (COD)
  - Cryptocurrency (NowPayments - BTC, ETH, USDT, etc.)
- **Security Indicators** - SSL, secure payment badges

**Step 4: Review**
- Order summary
- Item list with quantities
- Shipping address
- Payment method
- **Place Order** button

#### 6. Order Confirmation
- Order number display
- Success animation
- Email confirmation notice
- **Actions**:
  - View Order Details
  - Continue Shopping

#### 7. Customer Account (Optional)
```
/store/[businessDomain]/account
```
- Order history
- Saved addresses
- Wishlist
- Profile settings

---

## 🔗 Navigation Flow Diagram

### Business Owner Journey
```
Login
  ↓
Dashboard (Overview)
  ↓
[Sidebar Navigation]
  ├── Manage Inventory → Add/Edit Products
  ├── View Public Store → Opens /store/[domain]
  ├── Store Settings → Configure appearance
  ├── Process Orders → View customer orders
  └── Analytics → Review performance
```

### Customer Journey
```
Discovery
  ↓
/store/[domain]/products (Browse Catalog)
  ↓
[Filters/Search] → Find Products
  ↓
/store/[domain]/products/[slug] (View Product)
  ↓
[Add to Cart] → Variant Selection
  ↓
/store/[domain]/cart (Review Cart)
  ↓
[Apply Promo] → [Select Shipping]
  ↓
/store/[domain]/checkout (Checkout)
  ↓
Step 1: Contact Info
  ↓
Step 2: Shipping Address
  ↓
Step 3: Payment Method
  ↓
Step 4: Review & Place Order
  ↓
Order Confirmation
  ↓
Email Confirmation (Resend)
```

---

## 🎨 UI/UX Standards

### Business Dashboard
- **Layout**: Sidebar (collapsible) + Main Content
- **Navigation**: Grouped sections with icons
- **Responsive**: Mobile drawer for sidebar
- **Access Control**: Role-based and subscription-based

### Public Storefront
- **Layout**: Sticky header + Main Content + Footer
- **Navigation**: Top bar (contact info) + Main header (logo, search, cart) + Category nav
- **Responsive**: Mobile-first design
- **Floating Elements**:
  - Cart drawer (slide from right)
  - Live chat widget (bottom right)
  - Back to top button

---

## 🔐 Security & Access

### Business Dashboard
- Authentication required
- Role-based permissions (RBAC)
- Subscription-based feature access
- Audit logging

### Public Storefront
- No authentication required for browsing
- Optional customer accounts
- Secure checkout (Stripe/NowPayments)
- HTTPS enforcement

---

## 📱 Mobile Experience

### Business Dashboard
- Collapsible sidebar with overlay
- Touch-friendly buttons
- Responsive tables and forms

### Public Storefront
- Mobile-optimized product grid
- Swipeable product gallery
- Bottom navigation bar
- Mobile checkout optimization

---

## 🔧 Configuration

### Environment Variables
```bash
# Stripe (for payments)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# NowPayments (for crypto)
NOWPAYMENTS_API_KEY=...
NOWPAYMENTS_IPN_SECRET=...

# Resend (for emails)
RESEND_API_KEY=re_...

# App URL
NEXT_PUBLIC_APP_URL=https://tenvo.app
```

### Stripe Price IDs (for subscriptions)
```bash
STRIPE_PRICE_STARTER_MONTHLY_PKR=price_...
STRIPE_PRICE_GROWTH_MONTHLY_PKR=price_...
STRIPE_PRICE_PROFESSIONAL_MONTHLY_PKR=price_...
STRIPE_PRICE_BUSINESS_MONTHLY_PKR=price_...
```

---

## 📊 Analytics & Tracking

### Business Owner Insights
- Store page views
- Product impressions
- Add to cart events
- Checkout abandonment
- Conversion rates

### Customer Behavior
- Most viewed products
- Search queries
- Filter usage
- Cart abandonment points

---

## 🚀 Future Enhancements

### Planned Features
1. **QR Code Checkout** - Scan to view store
2. **Social Login** - Google, Facebook sign-in
3. **Abandoned Cart Recovery** - Email reminders
4. **Wishlist Sharing** - Share with friends
5. **Live Inventory** - Real-time stock updates
6. **Multi-language Support** - Urdu, English, Arabic
7. **Dark Mode** - Theme toggle

---

## 📝 Notes

- All navigation uses Next.js App Router
- Storefront is server-rendered for SEO
- Cart state persists via localStorage + server sync
- Email confirmations sent via Resend
- Payment processing via Stripe (cards) and NowPayments (crypto)
