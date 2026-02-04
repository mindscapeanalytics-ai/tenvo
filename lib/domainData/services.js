export const serviceDomains = {
    'travel': {
        icon: 'Plane',
        imageUrl: '/services_hero_image.png',
        productFields: ['Service Type', 'Destination', 'Duration', 'Validity', 'Commission Rate'],
        taxCategories: ['GST 5%', 'GST 18%', 'WHT 2%'],
        units: ['ticket', 'package', 'person', 'visa'],
        alternateUnits: { 'package': 'person' },
        defaultTax: 18,
        customerFields: ['Passport Number', 'Preferred Destinations', 'Travel History'],
        vendorFields: ['Agency License', 'Service Areas', 'Commission Rate'],
        fieldConfig: {
            servicetype: { label: 'Service Type', type: 'select', options: ['Flight', 'Hotel', 'Visa', 'Tour Package', 'Insurance'], required: true },
            destination: { label: 'Destination', type: 'text', placeholder: 'e.g. Dubai, Turkey, Umrah', required: true },
            duration: { label: 'Duration (Days)', type: 'number', placeholder: 'e.g. 7, 14, 21', required: true },
            validity: { label: 'Validity Date', type: 'date', required: true },
            commissionrate: { label: 'Commission Rate (%)', type: 'number', placeholder: 'e.g. 5, 10', required: true }
        },
        inventoryFeatures: [
            'Booking Management', 'Cancellation Tracking', 'Commission Tracking', 'Multi-Location Inventory',
            'Barcode Scanning', 'Stock Valuation (FIFO/LIFO/Average)', 'Quotation Management',
            'Sales Order Processing', 'Purchase Order Management', 'Challan Management',
            'GST Invoicing', 'E-way Bill', 'E-invoice', 'Stock Adjustment', 'ABC Analysis',
            'Destination-wise Sales', 'Commission Report', 'Cancellation Analysis'
        ],
        reports: [
            'Destination-wise Sales', 'Commission Report', 'Cancellation Analysis', 'Stock Summary',
            'Stock Valuation', 'Stock Movement', 'ABC Analysis', 'Service-wise Reports',
            'Stock Ledger', 'Sales by Product', 'Sales by Customer', 'Agent Performance'
        ],
        paymentTerms: ['Advance', 'Full Payment', 'Installment'],
        stockValuationMethod: 'Average',
        reorderEnabled: false,
        multiLocationEnabled: true,
        serialTrackingEnabled: false,
        batchTrackingEnabled: false,
        expiryTrackingEnabled: false,
        manufacturingEnabled: false,
        intelligence: {
            seasonality: 'high',
            peakMonths: ['June', 'July', 'December'], // Holidays
            perishability: 'critical', // Time-based (Empty seat = lost)
            shelfLife: 1, // 1 day validity
            demandVolatility: 0.8,
            minOrderQuantity: 1,
            leadTime: 0,
        },
        setupTemplate: {
            categories: ['Flight Tickets', 'Hotel Packages', 'Visa Services', 'Travel Insurance', 'Custom Tours'],
            suggestedProducts: [
                { name: 'Economy Class Round Trip (International)', unit: 'ticket', category: 'Flight Tickets', startingStock: 100, defaultPrice: 125000, description: 'Standard international economy flight ticket' },
                { name: '7-Day Holiday Package (Turkey)', unit: 'package', category: 'Hotel Packages', startingStock: 10, defaultPrice: 185000, description: 'Complete 7-day Turkey tour with stay' },
                { name: 'Standard Tourist Visa Processing', unit: 'pcs', category: 'Visa Services', startingStock: 50, defaultPrice: 15000, description: 'Tourist visa application assistance' }
            ]
        }
    },
    'auto-workshop': {
        icon: 'Wrench',
        imageUrl: '/industrial_hero_image.png',
        productFields: ['Service Type', 'Vehicle Plate', 'Engine Number', 'Next Service KM'],
        taxCategories: ['Services Tax 16%', 'Sales Tax 17%'],
        units: ['pcs', 'hour', 'service'],
        alternateUnits: { 'service': 'hour' },
        defaultTax: 16,
        fieldConfig: {
            servicetype: { label: 'Service Type', type: 'select', options: ['Oil Change', 'General Service', 'Tuning', 'Brakes', 'AC', 'Suspension'], required: true },
            vehicleplate: { label: 'Vehicle Plate #', type: 'text', placeholder: 'e.g. LEC-1234', required: true },
            enginenumber: { label: 'Engine Number', type: 'text', placeholder: 'e.g. 1NZ-1234567', required: false },
            nextservicekm: { label: 'Next Service (KM)', type: 'number', placeholder: 'e.g. 45000', required: false }
        },
        customerFields: ['Vehicle Details', 'Service History', 'Insurance Provider'],
        vendorFields: ['Technician Certification', 'Specialization', 'Parts Supplier'],
        inventoryFeatures: [
            'Job Card Management', 'Technician Performance', 'Service History', 'Parts-to-Job Linking',
            'Multi-Location Inventory', 'Barcode Scanning', 'Stock Valuation (FIFO)', 'Reorder Points',
            'Auto Reordering', 'Quotation Management', 'Service Order Processing', 'Purchase Order Management',
            'Vehicle Tracking', 'Next Service Alert', 'Workshop Efficiency', 'Spare Parts Usage'
        ],
        reports: [
            'Workshop Efficiency', 'Spare Parts Usage', 'Technician Performance', 'Service History',
            'Stock Summary', 'Job Card Status', 'Revenue by Service', 'Stock Movement',
            'Sales by Customer', 'Pending Jobs', 'Stock Ledger'
        ],
        paymentTerms: ['Cash', 'Credit Card', 'Insurance Claim', 'Company Credit'],
        stockValuationMethod: 'FIFO',
        reorderEnabled: true,
        multiLocationEnabled: true,
        serialTrackingEnabled: true,
        batchTrackingEnabled: false,
        expiryTrackingEnabled: false,
        manufacturingEnabled: false,
        intelligence: {
            seasonality: 'low',
            peakMonths: [],
            perishability: 'low',
            shelfLife: 365,
            demandVolatility: 0.3,
            minOrderQuantity: 5, // parts
            leadTime: 2,
        },
        setupTemplate: {
            categories: ['Routine Maintenance', 'Engine Parts', 'Brake System', 'Suspension', 'Lubricants & Fluids'],
            suggestedProducts: [
                { name: 'Synthetic Oil Change (4L)', unit: 'service', category: 'Lubricants & Fluids', startingStock: 100, defaultPrice: 8500, description: 'Premium synthetic engine oil change' },
                { name: 'Brake Pad Replacement (Front)', unit: 'pcs', category: 'Brake System', startingStock: 50, defaultPrice: 4500, description: 'Front brake pad installation/replacement' },
                { name: 'Full Vehicle Engine Tuning', unit: 'service', category: 'Routine Maintenance', startingStock: 200, defaultPrice: 3500, description: 'Computerized engine tuning and inspection' }
            ]
        }
    },
    'diagnostic-lab': {
        icon: 'Microscope',
        imageUrl: '/services_hero_image.png',
        productFields: ['Reagent Name', 'Machine Compatibility', 'Storage Temp', 'Expiry Tracking'],
        taxCategories: ['Exempt', 'GST 5%'],
        units: ['kit', 'vial', 'test', 'pack'],
        alternateUnits: { 'kit': 'test' },
        defaultTax: 0,
        customerFields: ['Doctor Referral', 'Insurance Details', 'Medical History'],
        vendorFields: ['Lab Certification', 'Equipment List', 'Turnaround Time'],
        fieldConfig: {
            reagentname: { label: 'Reagent Name', type: 'text', required: true },
            machinecompatibility: { label: 'Machine Compatibility', type: 'select', options: ['Roche', 'Abbott', 'Sysmex', 'Beckman'], required: true },
            storagetemp: { label: 'Storage Temp (°C)', type: 'text', placeholder: 'e.g. 2-8°C, -20°C', required: true },
            expirytracking: { label: 'Expiry Tracking', type: 'checkbox', default: true, required: false }
        },
        inventoryFeatures: [
            'Reagent Expiry Tracking', 'Patient-linked Usage', 'Machine Integration logs', 'FEFO Valuation',
            'Multi-Location Inventory', 'Barcode Scanning', 'Stock Valuation (FEFO)', 'Reorder Points',
            'Auto Reordering', 'Purchase Order Management', 'Test Management', 'Stock Adjustment (Spillage)',
            'Expiry Alerts', 'Reagent Usage Analysis', 'Test Profitability', 'Inventory vs Tests'
        ],
        reports: [
            'Expiry Alerts', 'Reagent Usage Analysis', 'Test Profitability', 'Inventory vs Tests',
            'Stock Summary', 'Batch-wise Status', 'Stock Movement', 'Stock Valuation',
            'Purchase Summary', 'Wastage Report', 'Stock Ledger'
        ],
        paymentTerms: ['Cash', 'Advance', 'Contract Billing'],
        stockValuationMethod: 'FEFO',
        reorderEnabled: true,
        multiLocationEnabled: true,
        serialTrackingEnabled: false,
        batchTrackingEnabled: true,
        expiryTrackingEnabled: true,
        manufacturingEnabled: false,
        intelligence: {
            seasonality: 'high',
            peakMonths: ['December', 'January'], // Flu season
            perishability: 'critical', // Reagents expire
            shelfLife: 90,
            demandVolatility: 0.6,
            minOrderQuantity: 10, // kits
            leadTime: 3,
        },
        setupTemplate: {
            categories: ['Hematology', 'Biochemistry', 'Microbiology', 'Imaging & X-Ray', 'Lab Supplies'],
            suggestedProducts: [
                { name: 'Complete Blood Count (CBC)', unit: 'test', category: 'Hematology', startingStock: 500, defaultPrice: 1200, description: 'Standard CBC test with differential' },
                { name: 'Blood Sugar Fasting (Reagent Kit)', unit: 'pack', category: 'Biochemistry', startingStock: 20, defaultPrice: 8500, description: 'Reagent kit for 100 blood sugar tests' },
                { name: 'COVID-19 Antigen Rapid Test Kit', unit: 'kit', category: 'Microbiology', startingStock: 100, defaultPrice: 1500, description: 'Rapid antigen test for COVID-19 detection' }
            ]
        }
    },
    'restaurant-cafe': {
        icon: 'Soup',
        imageUrl: '/services_hero_image.png',
        productFields: ['Ingredient', 'Category', 'Unit Cost', 'Recipe BOM', 'Prep Time', 'Storage Section'],
        taxCategories: ['Sales Tax 17%', 'Services Tax 16%'],
        units: ['kg', 'litre', 'pcs', 'portion'],
        alternateUnits: { 'portion': 'pcs', 'kg': 'gm' },
        defaultTax: 16,
        fieldConfig: {
            ingredient: { label: 'Primary Ingredient', type: 'text', placeholder: 'e.g. Flour, Chicken', required: true },
            category: { label: 'Ingredient Category', type: 'select', options: ['Proteins', 'Vegetables', 'Dairy', 'Spices', 'Dry Goods'], required: true },
            unitcost: { label: 'Unit Cost', type: 'number', placeholder: 'e.g. 150', required: true },
            recipebom: { label: 'Recipe BOM ID', type: 'text', placeholder: 'e.g. BOM-001', required: false },
            preptime: { label: 'Prep Time (Mins)', type: 'number', placeholder: 'e.g. 15', required: false },
            storagesection: { label: 'Storage Section', type: 'select', options: ['Chiller', 'Freezer', 'Dry Store', 'Ambient'], required: true }
        },
        customerFields: ['Membership Type', 'Dietary Preferences', 'Delivery Address'],
        vendorFields: ['Supplier Type', 'Delivery Schedule', 'Quality Standards'],
        inventoryFeatures: [
            'Recipe BOM (Ingredient-level)', 'Table Management', 'KOT Management', 'Waste Tracking',
            'Multi-Location (Kitchen/Store)', 'Stock Valuation (Average)', 'Reorder Points',
            'Auto Reordering', 'Purchase Order Management', 'Menu Performance', 'Daily Consumption',
            'Raw Material Tracking', 'Prep-list management', 'Food Cost Analysis', 'Menu Profitability'
        ],
        reports: [
            'Daily Consumption', 'Food Cost Analysis', 'Menu Profitability', 'Waste Report',
            'Stock Summary', 'Recipe Usage', 'Ingredient Status', 'Sales by Category',
            'Fast/Slow Moving Menu', 'Purchase Summary', 'Stock Ledger'
        ],
        paymentTerms: ['Cash', 'Card', 'Digital Wallet', 'Staff Account'],
        stockValuationMethod: 'Average',
        reorderEnabled: true,
        multiLocationEnabled: true,
        serialTrackingEnabled: false,
        batchTrackingEnabled: true,
        expiryTrackingEnabled: true,
        manufacturingEnabled: true,
        intelligence: {
            seasonality: 'high',
            peakMonths: ['December', 'January'],
            perishability: 'high',
            shelfLife: 2,
            demandVolatility: 0.9,
            minOrderQuantity: 20,
            leadTime: 1,
        },
        setupTemplate: {
            categories: ['Beverages', 'Main Course', 'Appetizers', 'Desserts', 'Raw Ingredients'],
            suggestedProducts: [
                { name: 'Fresh Vegetable Salad', unit: 'pcs', category: 'Appetizers', startingStock: 50, defaultPrice: 450, description: 'Organic farm-fresh vegetable salad' },
                { name: 'Chicken Biryani (Full)', unit: 'portion', category: 'Main Course', startingStock: 100, defaultPrice: 850, description: 'Traditional Sindhi Style Chicken Biryani' },
                { name: 'Cooking Oil (16L Tin)', unit: 'tin', category: 'Raw Ingredients', startingStock: 10, defaultPrice: 9200, description: 'Premium grade vegetable cooking oil' }
            ]
        }
    },
    'gym-fitness': {
        icon: 'Dumbbell',
        imageUrl: '/services_hero_image.png',
        productFields: ['Membership Type', 'Supplement Name', 'Locker Number', 'Trainer'],
        taxCategories: ['Services Tax 16%', 'Sales Tax 17%'],
        units: ['pcs', 'month', 'pack', 'session'],
        alternateUnits: { 'session': 'hour' },
        defaultTax: 16,
        fieldConfig: {
            membershiptype: { label: 'Membership Type', type: 'select', options: ['Monthly', 'Quarterly', 'Half-Yearly', 'Annually', 'Couple', 'Student'], required: true },
            supplementname: { label: 'Supplement Name', type: 'text', placeholder: 'e.g. Whey Protein, BCAA', required: false },
            lockernumber: { label: 'Locker #', type: 'text', placeholder: 'Assigned locker', required: false },
            trainer: { label: 'Assigned Trainer', type: 'text', placeholder: 'Trainer name', required: false }
        },
        customerFields: ['Membership Plan', 'Health Conditions', 'Emergency Contact'],
        vendorFields: ['Equipment Supplier', 'Maintenance Schedule', 'Warranty Terms'],
        inventoryFeatures: [
            'Membership-linked Locker', 'Trainer Performance', 'Attendance Tracking',
            'Multi-Location Gyms', 'Barcode Scanning', 'Stock Valuation (Average)', 'Reorder Points',
            'Auto Reordering', 'Quotation Management', 'Subscription Billing', 'Asset Maintenance',
            'Staff Management'
        ],
        reports: [
            'Supplement Sales', 'Locker Assignment', 'Renewal Alerts', 'Attendance Report',
            'Stock Summary', 'Revenue by Trainer', 'Membership Analytics', 'Stock Movement',
            'Collection Report', 'Pending Renewals', 'Stock Ledger'
        ],
        paymentTerms: ['Cash', 'Card', 'Monthly Installment', 'Online Subscription'],
        stockValuationMethod: 'Average',
        reorderEnabled: true,
        multiLocationEnabled: true,
        serialTrackingEnabled: true,
        batchTrackingEnabled: true,
        expiryTrackingEnabled: true,
        manufacturingEnabled: false,
        intelligence: {
            seasonality: 'high',
            peakMonths: ['January', 'February'], // New year resolutions
            perishability: 'low',
            shelfLife: 365,
            demandVolatility: 0.5,
            minOrderQuantity: 10, // supplements
            leadTime: 7,
        },
        setupTemplate: {
            categories: ['Membership Plans', 'Personal Training', 'Whey Protein', 'Vitamins & Supps', 'Gym Gear'],
            suggestedProducts: [
                { name: 'Monthly Standard Membership', unit: 'month', category: 'Membership Plans', startingStock: 100, defaultPrice: 5000, description: 'Full access to gym facilities for one month' },
                { name: '10-Session PT Package', unit: 'session', category: 'Personal Training', startingStock: 50, defaultPrice: 25000, description: 'One-on-one personal training sessions' },
                { name: 'Isolate Whey Protein (5lb)', unit: 'pack', category: 'Whey Protein', startingStock: 20, defaultPrice: 18500, description: 'Premium isolate whey protein supplement' }
            ]
        }
    },
    'hotel-guesthouse': {
        icon: 'Bed',
        imageUrl: '/services_hero_image.png',
        productFields: ['Room Number', 'Amenity Type', 'Laundry Item', 'Kitchen Item', 'Consumption Date'],
        taxCategories: ['Services Tax 16%', 'Sales Tax 17%'],
        units: ['pcs', 'night', 'set', 'meal'],
        alternateUnits: { 'set': 'pcs' },
        defaultTax: 16,
        defaultTax: 16,
        fieldConfig: {
            roomnumber: { label: 'Room Number', type: 'text', placeholder: 'e.g. 101, 204', required: true },
            amenitytype: { label: 'Amenity Type', type: 'select', options: ['Toiletries', 'Coffee/Tea', 'Mini Bar', 'Linens'], required: true },
            laundryitem: { label: 'Laundry Item', type: 'text', placeholder: 'e.g. Shirt, Suit', required: false },
            kitchenitem: { label: 'Kitchen/Snack Item', type: 'text', placeholder: 'e.g. Soda, Chips', required: false },
            consumptiondate: { label: 'Consumption Date', type: 'date', required: true }
        },
        customerFields: ['ID Type', 'Booking Preferences', 'Corporate Account'],
        vendorFields: ['Supplier Category', 'Delivery Terms', 'Quality Standards'],
        inventoryFeatures: [
            'Laundry Inventory', 'Kitchen-to-Room Billing', 'Housekeeping Supplies', 'Asset Tracking',
            'Multi-Location (Floor/Store)', 'Barcode Scanning', 'Stock Valuation (Average)', 'Reorder Points',
            'Auto Reordering', 'Purchase Order Management', 'Room Service Management', 'Stock Adjustment (Usage)',
            'Amenity Consumption', 'Inventory vs Bookings', 'Occupancy Analysis', 'Resource Management'
        ],
        reports: [
            'Amenity Consumption', 'Inventory vs Bookings', 'Occupancy Analysis', 'Laundry Report',
            'Stock Summary', 'Kitchen Usage', 'Room-wise Consumption', 'Stock Movement',
            'Purchase Summary', 'Wastage Report', 'Stock Ledger'
        ],
        paymentTerms: ['Cash', 'Card', 'Company Account', 'Advance Deposit'],
        stockValuationMethod: 'Average',
        reorderEnabled: true,
        multiLocationEnabled: true,
        serialTrackingEnabled: true,
        batchTrackingEnabled: true,
        expiryTrackingEnabled: true,
        manufacturingEnabled: false,
        intelligence: {
            seasonality: 'high',
            peakMonths: ['June', 'July', 'December'],
            perishability: 'critical', // Room night logic
            shelfLife: 1,
            demandVolatility: 0.7,
            minOrderQuantity: 10,
            leadTime: 3,
        },
        setupTemplate: {
            categories: ['Standard Rooms', 'Deluxe Suites', 'Dining Services', 'Laundry Services', 'Amenity Kits'],
            suggestedProducts: [
                { name: 'Standard Single Room (Nightly)', unit: 'night', category: 'Standard Rooms', startingStock: 20, defaultPrice: 8500, description: 'Standard room with AC and Wi-Fi' },
                { name: 'Luxury Suite (Executive)', unit: 'night', category: 'Deluxe Suites', startingStock: 5, defaultPrice: 25000, description: 'Luxury executive suite with premium view' },
                { name: 'Complimentary Amenity Kit', unit: 'set', category: 'Amenity Kits', startingStock: 100, defaultPrice: 0, description: 'Premium toiletries and essentials kit' }
            ]
        }
    },
    'event-management': {
        icon: 'PartyPopper',
        imageUrl: '/services_hero_image.png',
        productFields: ['Equipment Type', 'Event Date', 'Rental Duration', 'Condition', 'Marquee Type', 'SAC Code'],
        taxCategories: ['Services Tax 16%'],
        units: ['pcs', 'set', 'day', 'event'],
        alternateUnits: { 'set': 'pcs' },
        defaultTax: 16,
        defaultTax: 16,
        fieldConfig: {
            equipmenttype: { label: 'Equipment Type', type: 'select', options: ['Sound System', 'Lighting', 'Furniture', 'Decoration', 'Generator', 'Marquee/Tent'], required: true },
            eventdate: { label: 'Event Date', type: 'date', required: true },
            rentalduration: { label: 'Rental Duration (Days)', type: 'number', placeholder: 'e.g. 1, 3', required: true },
            condition: { label: 'Equipment Condition', type: 'select', options: ['Excellent', 'Good', 'Fair', 'Needs Repair'], required: false },
            marqueetype: { label: 'Marquee Type', type: 'select', options: ['German Marquee', 'Tented Marquee', 'Royal Tent', 'No Marquee'], required: false }
        },
        customerFields: ['Event Type', 'Budget Range', 'Preferred Venues'],
        vendorFields: ['Vendor Type', 'Service Area', 'Portfolio'],
        inventoryFeatures: [
            'Catering Equipment Rental', 'Marquee Booking Tracker', 'Venue Inventory', 'Asset Condition Tracking',
            'Multi-Location Warehouses', 'Barcode Scanning', 'Stock Valuation (Average)', 'Reorder Points',
            'Auto Reordering', 'Quotation Management', 'Booking Lifecycle', 'Damage Recovery',
            'Equipment Status', 'Availability Calendar', 'Project Costing', 'Vendor Coordination'
        ],
        reports: [
            'Equipment Status', 'Availability Calendar', 'Project Costing', 'Damage Report',
            'Stock Summary', 'Rental Revenue', 'Vendor Performance', 'Stock Movement',
            'Booking History', 'Resource Allocation', 'Stock Ledger'
        ],
        paymentTerms: ['Advance 25%', 'Before Event 50%', 'Post Event Balance'],
        stockValuationMethod: 'Average',
        reorderEnabled: true,
        multiLocationEnabled: true,
        serialTrackingEnabled: true,
        batchTrackingEnabled: false,
        expiryTrackingEnabled: false,
        manufacturingEnabled: false,
        intelligence: {
            seasonality: 'high',
            peakMonths: ['November', 'December', 'January'], // Weddings
            perishability: 'low',
            shelfLife: 1825,
            demandVolatility: 0.9,
            minOrderQuantity: 1, // Event
            leadTime: 14,
        },
        setupTemplate: {
            categories: ['Venue Booking', 'Catering Supplies', 'AV & Sound', 'Floral Decoration', 'Staff Services'],
            suggestedProducts: [
                { name: 'Banquet Hall Booking (Full Day)', unit: 'event', category: 'Venue Booking', startingStock: 1, defaultPrice: 150000, description: 'Full day booking of premium banquet hall' },
                { name: 'Standard Wedding Decor Theme', unit: 'set', category: 'Floral Decoration', startingStock: 10, defaultPrice: 45000, description: 'Complete floral decoration for wedding stage' },
                { name: 'Line Array Sound System', unit: 'set', category: 'AV & Sound', startingStock: 5, defaultPrice: 25000, description: 'Professional line array sound for events' }
            ]
        }
    },
    'rent-a-car': {
        icon: 'CarFront',
        imageUrl: '/services_hero_image.png',
        productFields: ['Vehicle Model', 'Engine Number', 'Chassis Number', 'Odometer Reading', 'Maintenance Alert'],
        taxCategories: ['Services Tax 16%'],
        units: ['day', 'km', 'hour'],
        alternateUnits: { 'day': 'hour' },
        defaultTax: 16,
        defaultTax: 16,
        fieldConfig: {
            vehiclemodel: { label: 'Vehicle Model', type: 'text', placeholder: 'e.g. Honda Civic, Toyota Corolla', required: true },
            enginenumber: { label: 'Engine Number', type: 'text', placeholder: 'e.g. 1NZ-1234567', required: false },
            chassisnumber: { label: 'Chassis Number', type: 'text', placeholder: 'e.g. NZE121-1234567', required: false },
            odometerreading: { label: 'Odometer Reading (KM)', type: 'number', placeholder: 'e.g. 45000', required: true },
            maintenancealert: { label: 'Maintenance Alert', type: 'checkbox', default: false, required: false }
        },
        customerFields: ['License Number', 'Insurance Details', 'Rental History'],
        vendorFields: ['Vehicle Supplier', 'Maintenance Provider', 'Insurance Partner'],
        inventoryFeatures: [
            'Odometer Maintenance Alerts', 'Booking Calendar', 'Vehicle Status tracking', 'Fuel Logs',
            'Multi-Location Branches', 'Barcode Scanning', 'Stock Valuation (n/a)', 'E-way Bill Support',
            'Documentation tracking', 'Insurance Alert', 'Driver Inventory (Money)', 'Fine Tracking',
            'Usage Analysis', 'Fleet Management', 'Maintenance History', 'Next Service Alert'
        ],
        reports: [
            'Fleet Status', 'Maintenance History', 'Next Service Alert', 'Fuel Analysis',
            'Vehicle Utilization', 'Revenue by Vehicle', 'Fine History', 'Stock Movement',
            'Booking Analytics', 'Driver Performance', 'Stock Ledger'
        ],
        paymentTerms: ['Cash', 'Credit Card', 'Security Deposit', 'Monthly Corporate'],
        stockValuationMethod: 'Average',
        reorderEnabled: false,
        multiLocationEnabled: true,
        serialTrackingEnabled: true,
        batchTrackingEnabled: false,
        expiryTrackingEnabled: false,
        manufacturingEnabled: false,
        intelligence: {
            seasonality: 'high',
            peakMonths: ['June', 'July', 'December'], // Holidays
            perishability: 'medium', // Maintenance focused
            shelfLife: 1825, // Car life
            demandVolatility: 0.7,
            minOrderQuantity: 1,
            leadTime: 0,
        },
        setupTemplate: {
            categories: ['Sedan Rental', 'SUV Rental', 'Luxury Vehicles', 'Chauffeur Services', 'Monthly Contracts'],
            suggestedProducts: [
                { name: 'Daily Sedan Rental (with Fuel)', unit: 'day', category: 'Sedan Rental', startingStock: 10, defaultPrice: 8500, description: '1.3L Sedan daily rental with fuel' },
                { name: 'SUV Land Cruiser (Weekly)', unit: 'day', category: 'SUV Rental', startingStock: 2, defaultPrice: 45000, description: 'Luxury 4x4 SUV weekly rental' },
                { name: 'Executive Chauffeur (8 Hours)', unit: 'hour', category: 'Chauffeur Services', startingStock: 20, defaultPrice: 2500, description: 'Professional chauffeur for 8 hours' }
            ]
        }
    },
    'school-library': {
        icon: 'GraduationCap',
        imageUrl: '/specialized_hero_image.png',
        productFields: ['Standard', 'Subject', 'Publisher', 'Author', 'ISBN/Book ID', 'Stationery Type'],
        taxCategories: ['Exempt', 'Sales Tax 17%'],
        units: ['pcs', 'set', 'copy'],
        alternateUnits: { 'set': 'pcs' },
        defaultTax: 0,
        fieldConfig: {
            standard: { label: 'Class/Grade', type: 'select', options: ['Playgroup', 'Nursery', 'KG', 'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5', 'Class 6', 'Class 7', 'Class 8', 'Matric', 'O-Levels', 'A-Levels'], required: true },
            subject: { label: 'Subject', type: 'text', placeholder: 'e.g. Mathematics, Urdu', required: true },
            publisher: { label: 'Publisher', type: 'text', placeholder: 'e.g. Oxford, Paramount', required: false },
            author: { label: 'Author', type: 'text', placeholder: 'Book author', required: false },
            isbnbookid: { label: 'ISBN/Book ID', type: 'text', placeholder: 'Unique identifier', required: true },
            stationerytype: { label: 'Stationery Type', type: 'select', options: ['Notebooks', 'Writing Tools', 'Art Supplies', 'Geometry', 'Packs'], required: false }
        },
        customerFields: ['Student ID', 'Grade/Class', 'Parent Contact'],
        vendorFields: ['Publisher', 'Distributor', 'Discount Terms'],
        inventoryFeatures: [
            'Fee-linked Invoicing', 'Stationery Inventory', 'Library Management', 'Student Balances',
            'Multi-Location (Store/Library)', 'Barcode Scanning', 'Stock Valuation (Average)', 'Reorder Points',
            'Auto Reordering', 'Quotation Management', 'Sales Order (Uniform/Books)', 'Asset Tracking',
            'Book Issuance', 'Fine Management', 'Uniform Inventory', 'Resource Allocation'
        ],
        reports: [
            'Book Issuance Status', 'Fine Management', 'Uniform Inventory', 'Resource Allocation',
            'Stock Summary', 'Stationery Sales', 'Student Dues', 'Library Status',
            'Stock Movement', 'Purchase Summary', 'Stock Ledger'
        ],
        paymentTerms: ['Cash', 'Bank Voucher', 'On Account'],
        stockValuationMethod: 'Average',
        reorderEnabled: true,
        multiLocationEnabled: true,
        serialTrackingEnabled: true,
        batchTrackingEnabled: false,
        expiryTrackingEnabled: false,
        manufacturingEnabled: false,
        intelligence: {
            seasonality: 'high',
            peakMonths: ['March', 'April', 'August'], // Start of term
            perishability: 'low',
            shelfLife: 3650,
            demandVolatility: 0.9, // Term start spike
            minOrderQuantity: 100, // books/uniforms
            leadTime: 30,
        },
        setupTemplate: {
            categories: ['National Curriculum Books', 'International Curriculum', 'Uniforms', 'Stationery Packs', 'Resource Material'],
            suggestedProducts: [
                { name: 'Class 9th Textbook Set', unit: 'set', category: 'National Curriculum Books', startingStock: 100, defaultPrice: 4500, description: 'Complete set of textbooks for Class 9th' },
                { name: 'Standard School Uniform (L)', unit: 'pcs', category: 'Uniforms', startingStock: 200, defaultPrice: 2800, description: 'Premium quality grey school uniform' },
                { name: 'Geometry Box (Premium)', unit: 'pcs', category: 'Stationery Packs', startingStock: 500, defaultPrice: 450, description: 'Complete geometry instrument box' }
            ]
        }
    },
    'clinics-healthcare': {
        icon: 'UserPlus',
        imageUrl: '/services_hero_image.png',
        productFields: ['Consultation Fee', 'Speciality', 'Doctor Name', 'Availability'],
        taxCategories: ['Exempt', 'GST 5%'],
        units: ['session', 'consultation', 'pcs'],
        alternateUnits: {},
        defaultTax: 0,
        customerFields: ['Patient ID', 'Insurance Provider', 'Medical History'],
        vendorFields: ['Pharma Distributor', 'Equipment Supplier', 'Service Provider'],
        fieldConfig: {
            consultationfee: { label: 'Consultation Fee', type: 'number', required: true },
            speciality: { label: 'Speciality', type: 'select', options: ['GP', 'Cardiology', 'Pediatrics', 'Dentistry', 'Dermatology'], required: true },
            doctorname: { label: 'Doctor Name', type: 'text', required: true },
            availability: { label: 'Availability', type: 'text', placeholder: 'e.g. Mon-Fri 5-9 PM', required: false }
        },
        inventoryFeatures: [
            'Patient History', 'Doctor Scheduling', 'Prescription Integration', 'Medical Supplies Tracking',
            'Queue Management', 'Billing for Services/Meds', 'Insurance Coordination'
        ],
        reports: [
            'Daily Consultations', 'Revenue by Doctor', 'Patient Visit History', 'Medication Usage',
            'Stock Summary'
        ],
        paymentTerms: ['Cash', 'Card', 'Insurance'],
        stockValuationMethod: 'Average',
        reorderEnabled: true,
        multiLocationEnabled: true,
        intelligence: {
            seasonality: 'low',
            peakMonths: [],
            perishability: 'low',
            shelfLife: 365,
            demandVolatility: 0.3,
            minOrderQuantity: 1,
            leadTime: 0,
        },
        setupTemplate: {
            categories: ['General Consultation', 'Specialist Visit', 'Laboratory Tests', 'Vaccination', 'Check-ups'],
            suggestedProducts: [
                { name: 'Initial Medical Check-up', unit: 'visit', category: 'Check-ups', startingStock: 100, defaultPrice: 1500, description: 'Initial general medical screening' },
                { name: 'CBC Blood Test', unit: 'pcs', category: 'Laboratory Tests', startingStock: 50, defaultPrice: 1200, description: 'Complete blood count lab test' },
                { name: 'General Physician Consultation', unit: 'visit', category: 'General Consultation', startingStock: 50, defaultPrice: 2000, description: 'Standard physician consultation fee' }
            ]
        }
    },
    'logistics-transport': {
        icon: 'Truck',
        imageUrl: '/services_hero_image.png',
        productFields: ['Vehicle Number', 'Route ID', 'Driver Name', 'Cargo Type', 'Fuel Card', 'Weight Limit'],
        taxCategories: ['Services Tax 16%', 'WHT 2%'],
        units: ['km', 'load', 'day', 'ton'],
        alternateUnits: { 'load': 'ton' },
        defaultTax: 16,
        fieldConfig: {
            vehiclenumber: { label: 'Vehicle Number', type: 'text', placeholder: 'e.g. TRK-1234', required: true },
            routeid: { label: 'Route ID', type: 'text', placeholder: 'e.g. RT-LAH-KAR', required: true },
            drivername: { label: 'Driver Name', type: 'text', placeholder: 'Assigned driver', required: false },
            cargotype: { label: 'Cargo Type', type: 'select', options: ['General', 'Perishable', 'Fragile', 'Hazardous', 'Liquid'], required: true },
            fuelcard: { label: 'Fuel Card #', type: 'text', placeholder: 'Registration ID', required: false },
            weightlimit: { label: 'Weight Limit (Tons)', type: 'number', placeholder: 'e.g. 20', required: true }
        },
        customerFields: ['Business Type', 'Route Preferences', 'Volume Requirements'],
        vendorFields: ['Vehicle Supplier', 'Fuel Provider', 'Maintenance Partner'],
        inventoryFeatures: [
            'Fleet Maintenance Logs', 'Driver Commission Tracking', 'Fuel Consumption Analysis',
            'Bilty/Trip Management', 'RTO/Expense tracking', 'Multi-Location Hubs', 'Tyre Life Tracking'
        ],
        reports: [
            'Trip Profitability', 'Fuel Efficiency Report', 'Fleet Status', 'Driver Performance',
            'Stock Summary (Spares)', 'Maintenance History'
        ],
        paymentTerms: ['Advance', 'Contract Billing', 'COD'],
        stockValuationMethod: 'Average',
        reorderEnabled: true,
        multiLocationEnabled: true,
        intelligence: {
            seasonality: 'medium',
            peakMonths: ['September', 'October'], // Crop movement
            perishability: 'low',
            shelfLife: 1825,
            demandVolatility: 0.5,
            minOrderQuantity: 1,
            leadTime: 2,
        },
        setupTemplate: {
            categories: ['Local Delivery', 'Inter-city Transport', 'Warehousing', 'Fleet Maintenance'],
            suggestedProducts: [
                { name: 'Full Truck Load (FTL)', unit: 'load', category: 'Inter-city Transport', startingStock: 50, defaultPrice: 45000, description: 'Inter-city transport for high volume cargo' },
                { name: 'Last Mile Delivery', unit: 'visit', category: 'Local Delivery', startingStock: 200, defaultPrice: 850, description: 'Local door-to-door small parcel delivery' },
                { name: 'Container Storage (Weekly)', unit: 'day', category: 'Warehousing', startingStock: 20, defaultPrice: 15000, description: 'Secure container storage in main hub' }
            ]
        }
    },
};
