# Requirements Document: Pakistani Market 2026 Enhancements

## Introduction

This document specifies requirements for enhancing TENVO's Pakistani market capabilities to meet 2026 best practices and regulatory compliance. The system currently has basic Pakistani support (payment gateways, tax structures, limited Urdu translations) but lacks critical 2026 requirements including FBR IRIS integration, Raast payment system, comprehensive Urdu support, WhatsApp Business integration, and AI-powered compliance features. These enhancements will expand Pakistani features from the retail-shop domain to all relevant business domains (pharmacy, grocery, textile, etc.) while maintaining backward compatibility.

## Glossary

- **TENVO_System**: The multi-tenant ERP system being enhanced
- **FBR**: Federal Board of Revenue (Pakistan's tax authority)
- **IRIS**: Integrated Real-time Invoice System (FBR's mandatory e-invoicing platform)
- **Raast**: Pakistan's instant payment system operated by State Bank of Pakistan
- **NTN**: National Tax Number (Pakistan tax registration identifier)
- **SRN**: Sales Tax Registration Number
- **WHT**: Withholding Tax
- **QR_Code**: Quick Response code for invoice verification and payments
- **Digital_Signature**: Cryptographic signature for invoice authentication
- **WhatsApp_Business_API**: Official WhatsApp API for business communications
- **Mobile_First_UI**: User interface optimized for mobile devices (75% of Pakistani transactions)
- **Seasonal_Pricing_Engine**: Automated pricing system for Ramadan, Eid, and other Pakistani seasons
- **AI_Tax_Calculator**: Intelligent tax calculation engine with FBR compliance rules
- **Pakistani_Domain**: Business domain with Pakistani market features enabled
- **Invoice_Submission**: Real-time transmission of invoice data to FBR IRIS
- **Payment_Gateway**: Third-party payment processing service
- **Urdu_Translation**: Right-to-left language support for Urdu interface

## Requirements

### Requirement 1: FBR IRIS Integration

**User Story:** As a Pakistani business owner, I want my invoices automatically submitted to FBR IRIS with QR codes and digital signatures, so that I comply with 2026 mandatory e-invoicing regulations.

#### Acceptance Criteria

1. WHEN a sales invoice is finalized, THE TENVO_System SHALL submit invoice data to FBR IRIS within 5 seconds
2. WHEN FBR IRIS confirms receipt, THE TENVO_System SHALL generate a QR_Code containing the IRIS verification token
3. WHEN FBR IRIS confirms receipt, THE TENVO_System SHALL apply a Digital_Signature to the invoice using the business NTN certificate
4. IF FBR IRIS submission fails, THEN THE TENVO_System SHALL queue the invoice for retry and alert the user within 10 seconds
5. THE TENVO_System SHALL store the IRIS submission timestamp, verification token, and response status for each invoice
6. WHEN an invoice is printed or emailed, THE TENVO_System SHALL include the QR_Code and Digital_Signature
7. THE TENVO_System SHALL support FBR IRIS API authentication using NTN credentials and API keys
8. WHEN FBR IRIS returns validation errors, THE TENVO_System SHALL display specific error messages in English and Urdu
9. THE TENVO_System SHALL maintain an audit log of all IRIS submissions with timestamps and response codes
10. FOR ALL invoices submitted to IRIS, THE TENVO_System SHALL verify the invoice format matches FBR schema version 2.1 before submission

### Requirement 2: Raast Payment System Integration

**User Story:** As a Pakistani business owner, I want to accept Raast instant payments with QR codes, so that customers can pay instantly using any Pakistani bank app.

#### Acceptance Criteria

1. WHEN generating an invoice, THE TENVO_System SHALL create a Raast QR_Code containing payment amount, merchant ID, and invoice reference
2. WHEN a customer scans the Raast QR_Code, THE Payment_Gateway SHALL process the payment through State Bank of Pakistan Raast network
3. WHEN Raast payment is confirmed, THE TENVO_System SHALL update invoice status to paid within 3 seconds
4. THE TENVO_System SHALL support Raast payment webhooks for real-time payment notifications
5. WHEN Raast payment fails, THE TENVO_System SHALL log the failure reason and notify the user
6. THE TENVO_System SHALL display Raast as a payment option in all Pakistani_Domain invoices
7. THE TENVO_System SHALL store Raast transaction ID, timestamp, and payer bank details for reconciliation
8. WHEN generating payment receipts, THE TENVO_System SHALL include Raast transaction reference number
9. THE TENVO_System SHALL support Raast refunds through the payment gateway API
10. FOR ALL Raast transactions, THE TENVO_System SHALL validate merchant credentials before generating QR codes

### Requirement 3: Enhanced Mobile Experience

**User Story:** As a Pakistani business owner using mobile devices, I want a mobile-first interface for all critical functions, so that I can manage my business efficiently on smartphones and tablets.

#### Acceptance Criteria

1. THE Mobile_First_UI SHALL render all invoice creation screens optimized for screens 320px width and above
2. THE Mobile_First_UI SHALL support touch gestures for product selection, quantity adjustment, and navigation
3. WHEN accessing the system on mobile devices, THE TENVO_System SHALL load critical screens within 2 seconds on 3G connections
4. THE Mobile_First_UI SHALL display large touch targets (minimum 44x44 pixels) for all interactive elements
5. WHEN entering data on mobile, THE Mobile_First_UI SHALL show appropriate keyboard types (numeric for amounts, phone for contact numbers)
6. THE Mobile_First_UI SHALL support offline invoice creation with automatic sync when connection is restored
7. WHEN viewing reports on mobile, THE Mobile_First_UI SHALL use responsive tables with horizontal scrolling
8. THE Mobile_First_UI SHALL support mobile camera for barcode scanning and document capture
9. WHEN printing from mobile, THE TENVO_System SHALL generate mobile-optimized PDF receipts
10. THE Mobile_First_UI SHALL maintain consistent navigation patterns across all Pakistani_Domain screens

### Requirement 4: WhatsApp Business Integration

**User Story:** As a Pakistani business owner, I want to send order confirmations and payment reminders via WhatsApp, so that I can communicate with customers through their preferred channel.

#### Acceptance Criteria

1. WHEN an invoice is created, THE TENVO_System SHALL send order confirmation to customer WhatsApp number via WhatsApp_Business_API
2. WHEN payment is overdue by 3 days, THE TENVO_System SHALL send payment reminder message via WhatsApp_Business_API
3. THE TENVO_System SHALL support WhatsApp message templates approved by Meta for transactional messages
4. WHEN customer replies to WhatsApp message, THE TENVO_System SHALL log the conversation in customer communication history
5. THE TENVO_System SHALL include invoice PDF and payment link in WhatsApp order confirmations
6. WHEN WhatsApp message delivery fails, THE TENVO_System SHALL log failure reason and attempt SMS fallback
7. THE TENVO_System SHALL support WhatsApp opt-in/opt-out preferences for each customer
8. WHEN sending WhatsApp messages, THE TENVO_System SHALL use Urdu language if customer language preference is Urdu
9. THE TENVO_System SHALL track WhatsApp message delivery status (sent, delivered, read) for each notification
10. THE TENVO_System SHALL rate-limit WhatsApp messages to comply with Meta Business API limits (80 messages per second)

### Requirement 5: Comprehensive Urdu Language Support

**User Story:** As an Urdu-speaking Pakistani business owner, I want the entire system interface in Urdu with proper right-to-left layout, so that I can use the system in my native language.

#### Acceptance Criteria

1. THE TENVO_System SHALL provide Urdu_Translation for all user interface elements including menus, buttons, labels, and messages
2. WHEN Urdu language is selected, THE TENVO_System SHALL render all text in right-to-left (RTL) layout
3. THE TENVO_System SHALL support Urdu input for product names, customer names, and business descriptions
4. WHEN printing invoices in Urdu, THE TENVO_System SHALL use Urdu number formatting (۱۲۳۴۵۶۷۸۹۰)
5. THE TENVO_System SHALL translate all error messages, validation messages, and help text to Urdu
6. WHEN displaying dates in Urdu, THE TENVO_System SHALL use Urdu month names and date formats
7. THE TENVO_System SHALL support bilingual invoices with English and Urdu side-by-side
8. WHEN generating reports in Urdu, THE TENVO_System SHALL use Urdu column headers and labels
9. THE TENVO_System SHALL maintain Urdu translations for all Pakistani brands, categories, and product attributes
10. THE TENVO_System SHALL support language switching without requiring page reload

### Requirement 6: AI-Powered Tax Calculation

**User Story:** As a Pakistani business owner, I want intelligent tax calculation that automatically applies correct FBR rates and handles complex scenarios, so that I avoid tax compliance errors.

#### Acceptance Criteria

1. WHEN adding products to invoice, THE AI_Tax_Calculator SHALL automatically determine applicable tax category based on product type and business domain
2. THE AI_Tax_Calculator SHALL apply correct federal sales tax rate (17% or 18%) based on product classification
3. WHEN customer has NTN, THE AI_Tax_Calculator SHALL determine if withholding tax (WHT) applies and calculate correct rate
4. THE AI_Tax_Calculator SHALL apply provincial tax rates based on business location (Punjab 16%, Sindh 13%, KP 15%, Balochistan 15%)
5. WHEN product is tax-exempt, THE AI_Tax_Calculator SHALL verify exemption eligibility against FBR rules and document exemption reason
6. THE AI_Tax_Calculator SHALL detect tax rate changes from FBR and alert users to update product tax categories
7. WHEN generating tax reports, THE AI_Tax_Calculator SHALL categorize transactions by tax type for FBR filing
8. THE AI_Tax_Calculator SHALL validate NTN format and check against FBR database for registered taxpayers
9. IF tax calculation produces ambiguous result, THEN THE AI_Tax_Calculator SHALL flag invoice for manual review with explanation
10. THE AI_Tax_Calculator SHALL learn from user corrections to improve future tax category suggestions

### Requirement 7: Seasonal Pricing Automation

**User Story:** As a Pakistani retailer, I want automatic price adjustments during Ramadan and Eid seasons, so that I can offer seasonal discounts without manual price changes.

#### Acceptance Criteria

1. THE Seasonal_Pricing_Engine SHALL detect current Pakistani season (Ramadan, Eid ul-Fitr, Eid ul-Adha, Independence Day, Winter, Summer) based on Islamic and Gregorian calendars
2. WHEN Ramadan begins, THE Seasonal_Pricing_Engine SHALL apply configured discount percentages to designated product categories
3. THE Seasonal_Pricing_Engine SHALL support different discount rates per season (Ramadan 10%, Eid 15%, Winter 20%)
4. WHEN creating invoice during seasonal period, THE TENVO_System SHALL display original price and seasonal discount separately
5. THE Seasonal_Pricing_Engine SHALL allow business owners to configure which categories participate in seasonal pricing
6. WHEN season ends, THE Seasonal_Pricing_Engine SHALL automatically revert prices to regular rates
7. THE Seasonal_Pricing_Engine SHALL send notification 7 days before season starts to review seasonal pricing configuration
8. WHEN generating sales reports, THE TENVO_System SHALL show seasonal vs regular sales comparison
9. THE Seasonal_Pricing_Engine SHALL support custom seasonal periods for business-specific promotions
10. THE Seasonal_Pricing_Engine SHALL calculate Islamic calendar dates accurately using Hijri calendar conversion

### Requirement 8: Expanded Domain Coverage

**User Story:** As a Pakistani business owner in pharmacy, grocery, or textile domains, I want the same Pakistani features available in retail-shop, so that I can use FBR compliance and local payment methods in my industry.

#### Acceptance Criteria

1. THE TENVO_System SHALL enable Pakistani payment gateways (JazzCash, Easypaisa, Raast, PayFast, COD) in pharmacy domain
2. THE TENVO_System SHALL enable Pakistani payment gateways in grocery domain
3. THE TENVO_System SHALL enable Pakistani payment gateways in textile-wholesale domain
4. THE TENVO_System SHALL enable Pakistani payment gateways in fmcg domain
5. THE TENVO_System SHALL enable Pakistani payment gateways in ecommerce domain
6. THE TENVO_System SHALL enable Pakistani payment gateways in garments domain
7. THE TENVO_System SHALL enable Pakistani payment gateways in mobile domain
8. THE TENVO_System SHALL enable Pakistani payment gateways in electronics-goods domain
9. THE TENVO_System SHALL enable Pakistani payment gateways in bakery-confectionery domain
10. THE TENVO_System SHALL enable Pakistani payment gateways in boutique-fashion domain
11. THE TENVO_System SHALL apply FBR tax compliance features to all Pakistani_Domain types
12. WHEN creating products in Pakistani_Domain, THE TENVO_System SHALL offer Pakistani brands relevant to that domain
13. THE TENVO_System SHALL support Urdu_Translation for domain-specific terminology (pharmacy terms, textile terms, etc.)
14. WHEN generating invoices in Pakistani_Domain, THE TENVO_System SHALL include NTN, SRN, and FBR compliance fields
15. THE TENVO_System SHALL support seasonal pricing in all Pakistani_Domain types where applicable

### Requirement 9: Enhanced Payment Gateway Features

**User Story:** As a Pakistani business owner, I want detailed payment gateway integration with fee calculation and reconciliation, so that I can track payment costs and match transactions accurately.

#### Acceptance Criteria

1. WHEN customer selects JazzCash payment, THE TENVO_System SHALL calculate and display merchant fee (2.5%) before payment
2. WHEN customer selects Easypaisa payment, THE TENVO_System SHALL calculate and display merchant fee (2.5%) before payment
3. WHEN customer selects PayFast card payment, THE TENVO_System SHALL calculate and display merchant fee (2.5%) before payment
4. WHEN customer selects PayFast bank transfer, THE TENVO_System SHALL calculate and display merchant fee (1.5%) before payment
5. THE TENVO_System SHALL store payment gateway transaction ID, fee amount, and net settlement amount for each transaction
6. WHEN generating payment reports, THE TENVO_System SHALL show gross amount, gateway fees, and net amount per payment method
7. THE TENVO_System SHALL support payment gateway reconciliation by matching transaction IDs with gateway settlement reports
8. WHEN payment gateway webhook is received, THE TENVO_System SHALL verify webhook signature before processing payment confirmation
9. IF payment gateway is unavailable, THEN THE TENVO_System SHALL display fallback payment methods (bank transfer, COD)
10. THE TENVO_System SHALL support payment gateway sandbox mode for testing before production deployment

### Requirement 10: QR Code Generation and Verification

**User Story:** As a Pakistani business owner, I want QR codes on invoices for FBR verification and Raast payments, so that customers and tax authorities can verify invoice authenticity.

#### Acceptance Criteria

1. WHEN invoice is finalized, THE TENVO_System SHALL generate FBR verification QR_Code containing invoice number, NTN, date, amount, and IRIS token
2. WHEN invoice is finalized, THE TENVO_System SHALL generate Raast payment QR_Code containing merchant ID, amount, and invoice reference
3. THE TENVO_System SHALL display both QR codes on printed and PDF invoices
4. WHEN QR_Code is scanned by FBR mobile app, THE TENVO_System SHALL provide invoice verification endpoint returning invoice details
5. THE TENVO_System SHALL use QR code format compatible with FBR IRIS mobile verification app
6. THE TENVO_System SHALL use QR code format compatible with Raast payment apps (all Pakistani banks)
7. WHEN generating QR_Code, THE TENVO_System SHALL ensure QR code size is minimum 2cm x 2cm for reliable scanning
8. THE TENVO_System SHALL support QR code regeneration if invoice is amended after initial generation
9. WHEN invoice is voided, THE TENVO_System SHALL mark QR_Code as invalid in verification endpoint
10. THE TENVO_System SHALL log all QR_Code verification requests with timestamp and scanner IP address

### Requirement 11: Digital Signature Implementation

**User Story:** As a Pakistani business owner, I want digital signatures on invoices using my NTN certificate, so that invoices are legally valid and tamper-proof for FBR compliance.

#### Acceptance Criteria

1. THE TENVO_System SHALL support uploading NTN digital certificate in PKCS#12 format
2. WHEN invoice is finalized, THE TENVO_System SHALL sign invoice data using private key from NTN certificate
3. THE TENVO_System SHALL embed Digital_Signature in invoice PDF as per FBR specifications
4. THE TENVO_System SHALL display certificate holder name and NTN on signed invoices
5. WHEN invoice PDF is opened, THE TENVO_System SHALL allow signature verification using public key
6. THE TENVO_System SHALL validate certificate expiry date before signing invoices
7. IF certificate is expired, THEN THE TENVO_System SHALL prevent invoice finalization and alert user to renew certificate
8. THE TENVO_System SHALL support certificate password protection with secure storage
9. WHEN certificate is revoked, THE TENVO_System SHALL detect revocation and prevent further signing
10. THE TENVO_System SHALL maintain signature audit log with timestamp, certificate serial number, and signed document hash

### Requirement 12: Urdu Receipt Printing

**User Story:** As a Pakistani retailer, I want to print receipts in Urdu with proper formatting, so that Urdu-speaking customers can read receipts easily.

#### Acceptance Criteria

1. WHEN printing receipt in Urdu, THE TENVO_System SHALL use Urdu fonts (Noto Nastaliq Urdu or Jameel Noori Nastaleeq)
2. THE TENVO_System SHALL render Urdu text in right-to-left direction on printed receipts
3. WHEN printing amounts in Urdu, THE TENVO_System SHALL use Urdu-Indic numerals (۱۲۳۴۵۶۷۸۹۰)
4. THE TENVO_System SHALL translate product names to Urdu if Urdu translation is available
5. THE TENVO_System SHALL print business name, address, and contact in Urdu if configured
6. WHEN printing tax details in Urdu, THE TENVO_System SHALL use Urdu terms (سیلز ٹیکس for Sales Tax)
7. THE TENVO_System SHALL support thermal printer compatibility for Urdu text rendering
8. WHEN printing bilingual receipts, THE TENVO_System SHALL show English on left and Urdu on right
9. THE TENVO_System SHALL maintain proper Urdu text alignment and spacing on 80mm thermal paper
10. THE TENVO_System SHALL support Urdu receipt preview before printing

### Requirement 13: Pakistani Brand Database Expansion

**User Story:** As a Pakistani business owner, I want comprehensive Pakistani brand databases for all product categories, so that I can quickly select local brands without manual entry.

#### Acceptance Criteria

1. THE TENVO_System SHALL provide Pakistani clothing brands (Khaadi, Gul Ahmed, Sana Safinaz, Maria B, Nishat, Alkaram, Bonanza, Outfitters, ChenOne, Junaid Jamshed, Limelight)
2. THE TENVO_System SHALL provide Pakistani footwear brands (Bata, Service, Borjan, Stylo, Metro)
3. THE TENVO_System SHALL provide Pakistani electronics brands (Orient, Haier, Dawlance, Pel, Gree)
4. THE TENVO_System SHALL provide Pakistani food brands (Shan, National, Mehran, Rafhan, Mitchell's, Shezan)
5. THE TENVO_System SHALL provide Pakistani personal care brands (Safeguard, Lux, Dove, Pantene, Lifebuoy)
6. THE TENVO_System SHALL provide Pakistani pharmaceutical brands (Getz Pharma, Searle, Abbott, GSK, Novartis Pakistan)
7. THE TENVO_System SHALL provide Pakistani textile mills (Gul Ahmed, Nishat Mills, Sapphire, Al-Karam)
8. THE TENVO_System SHALL allow business owners to add custom Pakistani brands to domain-specific lists
9. WHEN selecting brand, THE TENVO_System SHALL show brands relevant to product category
10. THE TENVO_System SHALL maintain Urdu translations for all Pakistani brand names

### Requirement 14: Market Location Database

**User Story:** As a Pakistani wholesaler, I want to tag suppliers and customers by market location (Anarkali, Liberty, Tariq Road), so that I can analyze sales by market area.

#### Acceptance Criteria

1. THE TENVO_System SHALL provide Pakistani market locations for Lahore (Anarkali Bazaar, Liberty Market, Fortress Stadium, Hall Road)
2. THE TENVO_System SHALL provide Pakistani market locations for Karachi (Tariq Road, Saddar, Hyderi Market, Bolton Market)
3. THE TENVO_System SHALL provide Pakistani market locations for Islamabad (Jinnah Super, Blue Area, F-6 Markaz, Aabpara Market)
4. THE TENVO_System SHALL provide Pakistani market locations for Faisalabad (Jama Cloth Market, Aminpur Bazaar, D Ground)
5. THE TENVO_System SHALL provide Pakistani market locations for Rawalpindi (Raja Bazaar, Saddar, Commercial Market)
6. WHEN adding customer or supplier, THE TENVO_System SHALL allow selecting market location from dropdown
7. THE TENVO_System SHALL support custom market location entry for areas not in predefined list
8. WHEN generating sales reports, THE TENVO_System SHALL group sales by market location
9. THE TENVO_System SHALL display market location in Urdu if Urdu language is selected
10. THE TENVO_System SHALL allow filtering customers and suppliers by market location

### Requirement 15: Enhanced Tax Reporting

**User Story:** As a Pakistani business owner, I want automated FBR tax reports in the correct format, so that I can file tax returns accurately and on time.

#### Acceptance Criteria

1. THE TENVO_System SHALL generate monthly sales tax report showing total sales, taxable sales, tax collected, and tax payable
2. THE TENVO_System SHALL generate provincial tax report separated by province (Punjab, Sindh, KP, Balochistan)
3. THE TENVO_System SHALL generate withholding tax report showing WHT deducted by transaction type
4. THE TENVO_System SHALL generate annual income tax report with revenue, expenses, and taxable income
5. WHEN generating tax reports, THE TENVO_System SHALL use FBR-specified report formats and column headers
6. THE TENVO_System SHALL export tax reports in Excel format compatible with FBR filing software
7. THE TENVO_System SHALL calculate tax filing deadlines based on FBR calendar and send reminders 7 days before deadline
8. WHEN tax rate changes, THE TENVO_System SHALL show comparative reports (old rate vs new rate periods)
9. THE TENVO_System SHALL support tax report generation for custom date ranges
10. THE TENVO_System SHALL include NTN, SRN, and business details in all tax report headers

### Requirement 16: Offline Mode Support

**User Story:** As a Pakistani business owner with unreliable internet, I want to create invoices offline and sync when connection returns, so that I can continue business operations during internet outages.

#### Acceptance Criteria

1. WHEN internet connection is lost, THE TENVO_System SHALL enable offline mode and display offline indicator
2. WHILE in offline mode, THE TENVO_System SHALL allow creating invoices with local storage
3. WHILE in offline mode, THE TENVO_System SHALL allow viewing existing products, customers, and inventory data
4. WHEN internet connection is restored, THE TENVO_System SHALL automatically sync offline invoices to server within 30 seconds
5. WHILE in offline mode, THE TENVO_System SHALL queue FBR IRIS submissions for transmission when online
6. THE TENVO_System SHALL detect sync conflicts (same invoice edited offline and online) and prompt user to resolve
7. WHILE in offline mode, THE TENVO_System SHALL show last sync timestamp and number of pending sync items
8. WHEN syncing offline data, THE TENVO_System SHALL preserve invoice timestamps from offline creation time
9. THE TENVO_System SHALL support offline mode for mobile and desktop applications
10. WHILE in offline mode, THE TENVO_System SHALL disable features requiring real-time data (payment gateway, IRIS submission, WhatsApp)

### Requirement 17: Multi-Currency Support for Imports

**User Story:** As a Pakistani importer, I want to record purchases in foreign currency (USD, EUR, CNY) with automatic PKR conversion, so that I can track import costs accurately.

#### Acceptance Criteria

1. THE TENVO_System SHALL support purchase orders in USD, EUR, GBP, AED, and CNY currencies
2. WHEN creating purchase order in foreign currency, THE TENVO_System SHALL fetch current exchange rate from State Bank of Pakistan
3. THE TENVO_System SHALL convert foreign currency amounts to PKR using exchange rate at transaction date
4. WHEN exchange rate changes, THE TENVO_System SHALL show exchange gain/loss on open purchase orders
5. THE TENVO_System SHALL store both foreign currency amount and PKR equivalent for each transaction
6. WHEN generating financial reports, THE TENVO_System SHALL show amounts in PKR with foreign currency reference
7. THE TENVO_System SHALL support manual exchange rate entry if automatic rate fetch fails
8. WHEN calculating import taxes, THE TENVO_System SHALL use PKR converted amount as tax base
9. THE TENVO_System SHALL maintain exchange rate history for audit and reporting
10. THE TENVO_System SHALL display exchange rate source and timestamp on purchase orders

### Requirement 18: SMS Notification Fallback

**User Story:** As a Pakistani business owner, I want SMS notifications as fallback when WhatsApp fails, so that customers always receive order confirmations.

#### Acceptance Criteria

1. WHEN WhatsApp message delivery fails, THE TENVO_System SHALL send SMS notification to customer mobile number within 10 seconds
2. THE TENVO_System SHALL use Pakistani SMS gateway providers (Jazz, Telenor, Zong, Ufone)
3. WHEN sending SMS, THE TENVO_System SHALL use concise message format to minimize SMS costs
4. THE TENVO_System SHALL include invoice number, amount, and payment link in SMS notifications
5. THE TENVO_System SHALL support Urdu SMS messages using Unicode encoding
6. WHEN SMS delivery fails, THE TENVO_System SHALL log failure reason and mark notification as failed
7. THE TENVO_System SHALL track SMS delivery status (sent, delivered, failed) for each notification
8. THE TENVO_System SHALL allow business owners to configure SMS vs WhatsApp preference per customer
9. THE TENVO_System SHALL calculate SMS costs and display in notification reports
10. THE TENVO_System SHALL rate-limit SMS sending to prevent accidental bulk SMS charges

### Requirement 19: Customer Loyalty Program

**User Story:** As a Pakistani retailer, I want a loyalty points program for repeat customers, so that I can reward customer loyalty and increase repeat business.

#### Acceptance Criteria

1. THE TENVO_System SHALL award loyalty points based on purchase amount (1 point per 100 PKR spent)
2. WHEN customer accumulates points, THE TENVO_System SHALL display point balance on invoice
3. THE TENVO_System SHALL allow customers to redeem points for discounts (100 points = 100 PKR discount)
4. WHEN points are redeemed, THE TENVO_System SHALL deduct points from customer balance and apply discount to invoice
5. THE TENVO_System SHALL support configurable point earning rates per product category
6. THE TENVO_System SHALL support point expiry after configured period (default 12 months)
7. WHEN points are about to expire, THE TENVO_System SHALL send reminder via WhatsApp or SMS 30 days before expiry
8. THE TENVO_System SHALL generate loyalty program reports showing points issued, redeemed, and expired
9. THE TENVO_System SHALL support loyalty tiers (Silver, Gold, Platinum) with different earning rates
10. THE TENVO_System SHALL display loyalty program details in Urdu for Urdu-speaking customers

### Requirement 20: Inventory Forecasting for Seasonal Demand

**User Story:** As a Pakistani retailer, I want inventory forecasting that considers Pakistani seasons (Ramadan, Eid), so that I can stock adequate inventory for peak demand periods.

#### Acceptance Criteria

1. THE TENVO_System SHALL analyze historical sales data to identify seasonal demand patterns for Ramadan and Eid periods
2. WHEN Ramadan approaches (30 days before), THE TENVO_System SHALL forecast demand increase and suggest reorder quantities
3. WHEN Eid approaches (15 days before), THE TENVO_System SHALL forecast demand increase and suggest reorder quantities
4. THE TENVO_System SHALL consider year-over-year growth when forecasting seasonal demand
5. WHEN generating purchase suggestions, THE TENVO_System SHALL prioritize products with high seasonal demand
6. THE TENVO_System SHALL alert users to low stock levels for seasonal products 45 days before season starts
7. THE TENVO_System SHALL show forecast accuracy by comparing predicted vs actual sales after season ends
8. WHEN forecasting demand, THE TENVO_System SHALL account for Islamic calendar date variations (Ramadan shifts 10-11 days earlier each year)
9. THE TENVO_System SHALL support manual forecast adjustments for business-specific factors
10. THE TENVO_System SHALL generate seasonal inventory reports showing stock levels vs forecasted demand

