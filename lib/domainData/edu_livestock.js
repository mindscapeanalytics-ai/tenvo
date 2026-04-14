export const eduLivestockDomains = {
    'school-education': {
        icon: 'GraduationCap',
        imageUrl: '/services_hero_image.png',
        productFields: ['Category', 'Cycle', 'Late Fee Policy', 'Subject/Level'],
        taxCategories: ['SST 5%', 'Exempt'],
        units: ['month', 'session', 'student', 'course', 'term'],
        alternateUnits: { 'session': 'month', 'term': 'month' },
        defaultTax: 5,
        fieldConfig: {
            category: { label: 'Fee Category', type: 'select', options: ['Tuition', 'Admission', 'Exam', 'Transport', 'Library', 'Stationery'], required: true },
            cycle: { label: 'Billing Cycle', type: 'select', options: ['Monthly', 'Quarterly', 'Semi-Annual', 'Annual'], required: true },
            latefeepolicy: { label: 'Late Fee (Fixed)', type: 'number', placeholder: 'e.g. 500', required: false },
        },
        customerFields: ['Student Name', 'Roll Number', 'Class/Grade', 'Father Name', 'Phone'],
        inventoryFeatures: [
            'Student Records', 'Fee Management', 'Monthly Challan Generation', 
            'Late Fee Automation', 'Class-wise Reports', 'Collection Reports',
            'Expense Tracking', 'Attendance Sync (Planned)', 'SMS Integration'
        ],
        reports: [
            'Recovery Report', 'Defaulters List', 'Class-wise Summary', 'Income Statement',
            'Student Ledger', 'Expense Summary', 'Admission Analysis'
        ],
        paymentTerms: ['Cash', 'Bank Transfer', 'JazzCash', 'Easypaisa'],
        intelligence: {
            seasonality: 'high',
            peakMonths: ['March', 'April', 'August'], // Admission/School start seasons in PK
            demandVolatility: 0.2,
            minOrderQuantity: 1,
            leadTime: 30,
        },
        setupTemplate: {
            categories: ['Monthly Tuition', 'Admission Setup', 'Transport Services', 'School Supplies'],
            suggestedProducts: [
                { name: 'Monthly Tuition Fee (Grade 1-5)', unit: 'month', category: 'Monthly Tuition', defaultPrice: 5500, description: 'Standard monthly tuition for primary levels' },
                { name: 'Transport Fee (Zone A)', unit: 'month', category: 'Transport Services', defaultPrice: 2500, description: 'School bus service for nearby areas' },
                { name: 'School Admission Kit', unit: 'pcs', category: 'Admission Setup', defaultPrice: 15000, description: 'Admission form, ID card, and starter stationery' }
            ]
        }
    },

    'livestock-cattle': {
        icon: 'Beef',
        imageUrl: '/agriculture_hero_image.png',
        productFields: ['Breed', 'Type', 'Tag Number', 'Age', 'Weight', 'Vaccination'],
        taxCategories: ['Exempt', 'GST 0%'],
        units: ['head', 'kg', 'maund', 'litre', 'bag'],
        alternateUnits: { 'maund': 'kg', 'bag': 'kg' },
        defaultTax: 0,
        fieldConfig: {
            breed: { label: 'Breed', type: 'select', options: ['Sahiwal', 'Cholistani', 'Friesian', 'Cross', 'Beetal', 'Teddy'], required: true },
            type: { label: 'Animal Type', type: 'select', options: ['Dairy Cow', 'Beef Cow', 'Buffalo', 'Goat', 'Sheep'], required: true },
            vaccination: { label: 'Last Vaccination', type: 'date', required: false },
            weight: { label: 'Current Weight (KG)', type: 'number', placeholder: '450', required: true }
        },
        customerFields: ['Butcher/Retailer Name', 'Phone', 'Location'],
        inventoryFeatures: [
            'Animal Lifecycle Tracking', 'Weight Management', 'Vaccination Schedule',
            'Batch-wise Health Monitoring', 'FCR Analysis', 'Milk Yield Tracking',
            'Mortality Tracking', 'Feed Consumption', 'Breeding Logs'
        ],
        reports: [
            'Herd Health Report', 'Milk Yield Summary', 'Weight gain analysis', 'Mortality Analysis',
            'Feed Efficiency', 'Stock Summary', 'Breeding History'
        ],
        paymentTerms: ['Cash', 'Credit 7 Days', 'Mandi Payment'],
        intelligence: {
            seasonality: 'extreme',
            peakMonths: ['Zil-Hajj'], // Eid-ul-Adha peak
            perishability: 'critical',
            shelfLife: 3650, // Long term asset
            demandVolatility: 0.9,
            minOrderQuantity: 1,
            leadTime: 365,
        },
        setupTemplate: {
            categories: ['Dairy Animals', 'Beef Fattening', 'Fresh Milk', 'Animal Feed/Vanda', 'Medicines'],
            suggestedProducts: [
                { name: 'A-Grade Dairy Buffalo', unit: 'head', category: 'Dairy Animals', startingStock: 20, defaultPrice: 285000, description: 'High milk yield buffalo (Nili Ravi)' },
                { name: 'Livestock Feed (Vanda) 50kg', unit: 'bag', category: 'Animal Feed/Vanda', startingStock: 100, defaultPrice: 4200, description: 'High-protein fattening feed' },
                { name: 'Fresh Buffalo Milk', unit: 'litre', category: 'Fresh Milk', startingStock: 0, defaultPrice: 180, description: 'Pure farm fresh milk' }
            ]
        }
    },

    'mobile-repairing': {
        icon: 'Wrench',
        imageUrl: '/services_hero_image.png',
        productFields: ['Service Type', 'Spare Part Needed', 'Warranty Given'],
        taxCategories: ['SST 16%', 'Exempt'],
        units: ['job', 'pcs', 'service'],
        defaultTax: 16,
        fieldConfig: {
            servicetype: { label: 'Service Category', type: 'select', options: ['Hardware', 'Software', 'Glass Only', 'Dead Recovery', 'Unlocking'], required: true },
            warranty: { label: 'Service Warranty', type: 'select', options: ['No Warranty', '1 Week', '1 Month', '3 Months'], required: true }
        },
        customerFields: ['Device Model', 'IMEI/Serial', 'Problem Description', 'Passcode/Pattern'],
        inventoryFeatures: [
            'Job Card Management', 'Status Workflow (Received->Ready)', 'Parts Consumption',
            'Service Warranty Tracking', 'IMEI History', 'Repair Technician Assignment',
            'Software Log', 'Counter Cash Management'
        ],
        reports: [
            'Service Profitability', 'Technician Performance', 'Job Status Summary',
            'Parts Usage Report', 'IMEI History Search', 'Revenue Report'
        ],
        paymentTerms: ['Cash', 'Advance', 'JazzCash/Easypaisa'],
        intelligence: {
            seasonality: 'low',
            demandVolatility: 0.4,
            leadTime: 1,
        },
        setupTemplate: {
            categories: ['Hardware Repair', 'Software Services', 'Display Replacements', 'Spare Parts', 'Accessories'],
            suggestedProducts: [
                { name: 'Display Glass Replacement (Standard)', unit: 'job', category: 'Glass Only', defaultPrice: 2500, description: 'Glass only repair with OCA' },
                { name: 'Charging Port IC Repair', unit: 'job', category: 'Hardware Repair', defaultPrice: 1800, description: 'Motherboard IC level repair' },
                { name: 'iPhone Battery (Original Grade)', unit: 'pcs', category: 'Spare Parts', defaultPrice: 4500, description: 'Replacement battery with 6 months warranty' }
            ]
        }
    }
};
