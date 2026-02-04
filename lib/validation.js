import { z } from 'zod';

// Pakistani-specific validators
export const NTN_REGEX = /^\d{7}-?\d$/;
export const CNIC_REGEX = /^[0-9xX -]{13,15}$/;
export const PHONE_REGEX = /^[+0-9xX -]{10,16}$/;
export const SRN_REGEX = /^[0-9xX -]{10,20}$/;

export const pakistaniValidators = {
  // NTN: 7 digits followed by hyphen and 1 digit (e.g., 1234567-8)
  ntn: z.string().regex(NTN_REGEX, 'Invalid NTN format (should be 1234567-8)').optional().or(z.literal('')),

  // CNIC: 13 digits with optional hyphens (e.g., 12345-1234567-1)
  cnic: z.string().regex(CNIC_REGEX, 'Invalid CNIC format (should be 13 digits)').optional().or(z.literal('')),

  // Pakistani phone: +92 followed by 10 digits
  phone: z.string().regex(PHONE_REGEX, 'Invalid Pakistani phone number (should be +92 3XX XXXXXXX)').optional().or(z.literal('')),

  // SRN: Sales Tax Registration Number
  srn: z.string().regex(SRN_REGEX, 'Invalid SRN format').optional().or(z.literal('')),
};

// Invoice validation schema
export const invoiceSchema = z.object({
  invoiceNumber: z.string().min(1, 'Invoice number is required'),
  date: z.string().min(1, 'Date is required'),
  dueDate: z.string().optional(),
  customerName: z.string().min(1, 'Customer name is required'),
  customerEmail: z.string().email('Invalid email').optional().or(z.literal('')),
  customerPhone: pakistaniValidators.phone,
  customerAddress: z.string().optional(),
  items: z.array(
    z.object({
      name: z.string().min(1, 'Item name is required'),
      description: z.string().optional(),
      quantity: z.number().min(0.01, 'Quantity must be greater than 0'),
      rate: z.number().min(0, 'Rate must be 0 or greater'),
      amount: z.number().optional(),
    })
  ).min(1, 'At least one item is required'),
  subtotal: z.number().min(0),
  taxPercent: z.number().min(0).max(100).optional(),
  tax: z.number().min(0).optional(),
  discountPercent: z.number().min(0).max(100).optional(),
  discount: z.number().min(0).optional(),
  total: z.number().min(0),
  notes: z.string().optional(),
  terms: z.string().optional(),
});

// Enhanced Product validation schema
export const productSchema = z.object({
  name: z.string().min(1, 'Product name is required').max(200, 'Product name too long'),
  sku: z.string().optional(),
  barcode: z.string().optional(),
  description: z.string().max(1000, 'Description too long').optional(),
  category: z.string().optional(),
  brand: z.string().optional(),
  price: z.number().min(0, 'Price must be 0 or greater'),
  costPrice: z.number().min(0, 'Cost price must be 0 or greater').optional(),
  mrp: z.number().min(0, 'MRP must be 0 or greater').optional(),
  stock: z.number().min(0, 'Stock must be 0 or greater'),
  minStock: z.number().min(0, 'Min stock must be 0 or greater').optional(),
  maxStock: z.number().min(0, 'Max stock must be 0 or greater').optional(),
  reorderPoint: z.number().min(0, 'Reorder point must be 0 or greater').optional(),
  reorderQuantity: z.number().min(0, 'Reorder quantity must be 0 or greater').optional(),
  unit: z.string().optional(),
  hsnCode: z.string().optional(),
  sacCode: z.string().optional(),
  taxPercent: z.number().min(0).max(100, 'Tax percentage must be between 0 and 100').optional(),
  imageUrl: z.string().url('Invalid URL format').optional().or(z.literal('')),
  isActive: z.boolean().optional(),
  // Domain-specific fields (optional, validated by domain helpers)
  batches: z.array(z.any()).optional(),
  serialNumbers: z.array(z.any()).optional(),
  variants: z.array(z.any()).optional(),
  expiryDate: z.string().optional(),
  manufacturingDate: z.string().optional(),
}).refine((data) => {
  // MRP should be >= selling price if both exist
  if (data.mrp && data.price && data.mrp < data.price) {
    return false;
  }
  return true;
}, {
  message: 'MRP should be greater than or equal to selling price',
  path: ['mrp'],
}).refine((data) => {
  // Cost price should be <= selling price (warning, not error)
  if (data.costPrice && data.price && data.costPrice > data.price) {
    return true; // Allow but will show warning
  }
  return true;
}, {
  message: 'Cost price is higher than selling price',
  path: ['costPrice'],
}).refine((data) => {
  // Expiry date should be after manufacturing date
  if (data.expiryDate && data.manufacturingDate) {
    const expiry = new Date(data.expiryDate);
    const mfg = new Date(data.manufacturingDate);
    if (expiry <= mfg) {
      return false;
    }
  }
  return true;
}, {
  message: 'Expiry date must be after manufacturing date',
  path: ['expiryDate'],
}).refine((data) => {
  // Max stock should be >= min stock
  if (data.maxStock && data.minStock && data.maxStock < data.minStock) {
    return false;
  }
  return true;
}, {
  message: 'Max stock should be greater than or equal to min stock',
  path: ['maxStock'],
});

// Customer validation schema with Pakistani fields
export const customerSchema = z.object({
  name: z.string().min(1, 'Customer name is required').max(100, 'Name too long'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: pakistaniValidators.phone,
  address: z.string().max(500, 'Address too long').optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  pincode: z.string().regex(/^\d{5}$/, 'Invalid postal code').optional().or(z.literal('')),
  ntn: pakistaniValidators.ntn,
  cnic: pakistaniValidators.cnic,
  srn: pakistaniValidators.srn,
  credit_limit: z.number().min(0).optional(),
  opening_balance: z.number().optional(),
  filer_status: z.string().optional(),
  gstin: z.string().optional(),
});

// Vendor validation schema
export const vendorSchema = z.object({
  name: z.string().min(1, 'Vendor name is required').max(100, 'Name too long'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: pakistaniValidators.phone,
  address: z.string().max(500, 'Address too long').optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  ntn: pakistaniValidators.ntn,
  srn: pakistaniValidators.srn,
  payment_terms: z.string().optional(),
  credit_limit: z.number().min(0, 'Credit limit must be 0 or greater').optional(),
});

// Business validation schema
export const businessSchema = z.object({
  name: z.string().min(1, 'Business name is required').max(200, 'Name too long'),
  type: z.string().min(1, 'Business type is required'),
  location: z.string().optional(),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: pakistaniValidators.phone,
  ntn: pakistaniValidators.ntn,
  srn: pakistaniValidators.srn,
  gstin: z.string().optional(),
  address: z.string().max(500, 'Address too long').optional(),
});

// Form validation helper with detailed error messages
export function validateForm(schema, data) {
  try {
    schema.parse(data);
    return { isValid: true, errors: {}, warnings: {} };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = {};
      const warnings = {};

      error.errors.forEach((err) => {
        const path = err.path.join('.');
        const message = err.message;

        // Categorize as warning or error based on message content
        if (message.includes('higher than') || message.includes('lower than')) {
          warnings[path] = message;
        } else {
          errors[path] = message;
        }
      });

      return {
        isValid: Object.keys(errors).length === 0,
        errors,
        warnings
      };
    }
    return { isValid: false, errors: { general: 'Validation failed' }, warnings: {} };
  }
}

// Field-level validation helper
export function validateField(schema, fieldName, value, allData = {}) {
  try {
    const testData = { ...allData, [fieldName]: value };
    schema.parse(testData);
    return { isValid: true, error: null };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const fieldError = error.errors.find(err => err.path[0] === fieldName);
      if (fieldError) {
        return { isValid: false, error: fieldError.message };
      }
    }
    return { isValid: true, error: null };
  }
}

// Utility to check if a string is a valid Pakistani phone number
export function isValidPakistaniPhone(phone) {
  return /^(\+92|0)?3\d{9}$/.test(phone);
}

// Utility to format Pakistani phone number
export function formatPakistaniPhone(phone) {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10 && cleaned.startsWith('3')) {
    return `+92 ${cleaned.slice(0, 3)} ${cleaned.slice(3, 10)}`;
  }
  if (cleaned.length === 12 && cleaned.startsWith('92')) {
    return `+${cleaned.slice(0, 2)} ${cleaned.slice(2, 5)} ${cleaned.slice(5, 12)}`;
  }
  return phone;
}

// Utility to check if a string is a valid NTN
export function isValidNTN(ntn) {
  return /^\d{7}-\d$/.test(ntn);
}

// Utility to check if a string is a valid CNIC
export function isValidCNIC(cnic) {
  return /^(\d{5}-?\d{7}-?\d{1}|\d{13})$/.test(cnic);
}





