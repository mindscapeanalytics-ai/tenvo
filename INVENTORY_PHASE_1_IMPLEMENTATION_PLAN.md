# INVENTORY SYSTEM - PHASE 1 IMPLEMENTATION PLAN

## Critical Fixes (Market-Ready Baseline)

**Goal:** Fix critical gaps to make inventory system production-ready  
**Timeline:** 3-4 days (May 13-16)  
**Team:** Full-stack developers  

---

## TASK 1: Implement Excel Import Functionality ⭐ CRITICAL

### Goal
Replace CSV-only import with native Excel (.xlsx) support while maintaining backwards compatibility.

### Requirements
- ✅ Upload .xlsx files (not just CSV)
- ✅ Parse Excel sheets with proper data types
- ✅ Auto-detect headers
- ✅ Allow column mapping (optional)
- ✅ Preserve data types (dates, numbers, text)
- ✅ Handle multiple sheets
- ✅ Show preview before import
- ✅ Detailed error reporting (row/column)

### Implementation

#### Step 1a: Install Dependencies
```bash
npm install exceljs --save
npm install read-excel-file --save
```

#### Step 1b: Create Excel Import Service
**File:** `lib/services/excelImportService.js`

```javascript
import ExcelJS from 'exceljs';

/**
 * Parse Excel file and extract data
 * @param {File} file - Excel file from upload
 * @returns {Promise<{sheets: Array, headers: Array, preview: Array, errors: Array}>}
 */
export async function parseExcelFile(file) {
  try {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(file.stream());
    
    const results = {
      sheets: [],
      headers: [],
      preview: [],
      errors: [],
      metadata: {
        sheetCount: workbook.worksheets.length,
        fileName: file.name,
        uploadedAt: new Date().toISOString(),
        fileSize: file.size
      }
    };

    // Process first sheet
    const worksheet = workbook.getWorksheet(1);
    if (!worksheet) {
      results.errors.push('Excel file has no worksheets');
      return results;
    }

    // Extract headers from first row
    const headerRow = worksheet.getRow(1);
    const headers = [];
    const headerCells = headerRow.values;
    
    headerCells?.forEach((cell, index) => {
      if (cell !== null && cell !== undefined) {
        headers.push({
          index: index - 1, // Account for 1-based indexing
          name: String(cell).trim(),
          dataType: 'auto'
        });
      }
    });

    results.headers = headers;

    // Extract preview data (first 10 rows)
    const preview = [];
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // Skip header
      if (preview.length >= 10) return; // Limit to 10 rows

      const rowData = {
        _rowIndex: rowNumber,
        _rowId: `row-${rowNumber}`,
        _isValid: true,
        _errors: []
      };

      row.values?.forEach((cell, index) => {
        if (index > 0 && headers[index - 1]) {
          const headerName = headers[index - 1].name;
          
          // Preserve data types
          if (cell === null || cell === undefined) {
            rowData[headerName] = '';
          } else if (typeof cell === 'object' && cell.value !== undefined) {
            // Handle Excel date/time objects
            if (cell.value instanceof Date) {
              rowData[headerName] = cell.value.toISOString().split('T')[0];
            } else {
              rowData[headerName] = cell.value;
            }
          } else {
            rowData[headerName] = cell;
          }
        }
      });

      // Remove empty rows
      const hasData = headers.some(h => rowData[h.name] !== '' && rowData[h.name] !== null);
      if (hasData) {
        preview.push(rowData);
      }
    });

    results.preview = preview;
    results.sheets = workbook.worksheets.map((ws, idx) => ({
      name: ws.name,
      index: idx,
      rowCount: ws.actualRowCount || 0
    }));

    return results;
  } catch (error) {
    console.error('Excel parse error:', error);
    return {
      sheets: [],
      headers: [],
      preview: [],
      errors: [`Failed to parse Excel file: ${error.message}`],
      metadata: { error: error.message }
    };
  }
}

/**
 * Validate imported row
 * @param {Object} row - Data row from Excel
 * @param {Array} requiredFields - Required field names
 * @returns {Object} - {isValid: boolean, errors: Array}
 */
export function validateImportRow(row, requiredFields = ['name']) {
  const errors = [];

  // Check required fields
  requiredFields.forEach(field => {
    if (!row[field] || String(row[field]).trim() === '') {
      errors.push(`Required field missing: ${field}`);
    }
  });

  // Validate price if present
  if (row.price !== undefined && row.price !== '') {
    if (isNaN(parseFloat(row.price))) {
      errors.push(`Invalid price: ${row.price}`);
    } else if (parseFloat(row.price) < 0) {
      errors.push(`Price cannot be negative: ${row.price}`);
    }
  }

  // Validate stock if present
  if (row.stock !== undefined && row.stock !== '') {
    if (isNaN(parseInt(row.stock))) {
      errors.push(`Invalid stock: ${row.stock}`);
    } else if (parseInt(row.stock) < 0) {
      errors.push(`Stock cannot be negative: ${row.stock}`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors: errors.length > 0 ? errors : null
  };
}

/**
 * Check for duplicate SKUs
 * @param {Array} importedRows - Rows to import
 * @param {Array} existingProducts - Existing products in database
 * @returns {Array} - Rows with duplicate warnings
 */
export function detectDuplicates(importedRows, existingProducts = []) {
  const existingSKUs = new Set(existingProducts.map(p => p.sku?.toLowerCase()));
  const importedSKUs = new Map();

  return importedRows.map(row => {
    const sku = row.sku?.toLowerCase();
    const rowErrors = row._errors || [];

    if (sku) {
      if (existingSKUs.has(sku)) {
        rowErrors.push(`⚠️ WARNING: SKU "${sku}" already exists in database (duplicate)`);
        row._isDuplicate = true;
      }
      if (importedSKUs.has(sku)) {
        rowErrors.push(`⚠️ ERROR: SKU "${sku}" appears multiple times in import`);
        row._isValid = false;
      }
      importedSKUs.set(sku, true);
    }

    return { ...row, _errors: rowErrors };
  });
}

/**
 * Transform Excel data to product format
 * @param {Array} rows - Excel rows
 * @param {string} category - Business category
 * @param {string} businessId - Business ID
 * @returns {Array} - Transformed products
 */
export function transformImportedData(rows, category = 'retail-shop', businessId) {
  return rows.map((row, idx) => ({
    // Core fields
    id: undefined, // Will be generated by DB
    business_id: businessId,
    name: row.name?.trim() || '',
    sku: row.sku?.trim() || `SKU-${Date.now()}-${idx}`,
    barcode: row.barcode?.trim() || '',
    category: row.category?.trim() || 'General',
    
    // Pricing
    cost_price: parseFloat(row.cost_price || row.cost || 0),
    price: parseFloat(row.price || 0),
    mrp: parseFloat(row.mrp || row.price || 0),
    
    // Stock
    stock: parseInt(row.stock || 0),
    min_stock: parseInt(row.min_stock || row.minStock || 0),
    max_stock: parseInt(row.max_stock || row.maxStock || 0),
    reorder_point: parseInt(row.reorder_point || row.reorderPoint || 0),
    
    // Metadata
    unit: row.unit?.trim() || 'pcs',
    description: row.description?.trim() || '',
    status: row.status?.toLowerCase() === 'inactive' ? 'inactive' : 'active',
    
    // Domain-specific
    domain_data: extractDomainData(row, category),
    
    // Timestamps
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }));
}

/**
 * Extract domain-specific fields from import row
 */
function extractDomainData(row, category) {
  const domainData = {};

  // Common domain fields
  if (row.brand) domainData.brand = row.brand.trim();
  if (row.hsn_code) domainData.hsn_code = row.hsn_code.trim();
  if (row.sac_code) domainData.sac_code = row.sac_code.trim();
  if (row.batch_number) domainData.batch_number = row.batch_number.trim();
  if (row.serial_number) domainData.serial_number = row.serial_number.trim();
  if (row.location) domainData.location = row.location.trim();

  // Category-specific fields
  if (category === 'textile') {
    if (row.fabric_type) domainData.fabric_type = row.fabric_type.trim();
    if (row.fabric_width) domainData.fabric_width = parseFloat(row.fabric_width);
    if (row.color) domainData.color = row.color.trim();
    if (row.size) domainData.size = row.size.trim();
  }

  if (category === 'pharmacy') {
    if (row.batch_number) domainData.batch_number = row.batch_number.trim();
    if (row.expiry_date) domainData.expiry_date = row.expiry_date;
    if (row.manufacturing_date) domainData.manufacturing_date = row.manufacturing_date;
  }

  return Object.keys(domainData).length > 0 ? domainData : null;
}

/**
 * Check for data integrity
 * @param {Array} rows - Rows to validate
 * @returns {Object} - Validation report
 */
export function checkDataIntegrity(rows) {
  const report = {
    totalRows: rows.length,
    validRows: 0,
    invalidRows: 0,
    warnings: [],
    errors: [],
    summary: {}
  };

  rows.forEach((row, idx) => {
    const validation = validateImportRow(row);
    if (validation.isValid) {
      report.validRows++;
    } else {
      report.invalidRows++;
      report.errors.push({
        rowNumber: row._rowIndex || idx + 2,
        errors: validation.errors
      });
    }
  });

  report.summary = {
    acceptanceRate: ((report.validRows / report.totalRows) * 100).toFixed(2) + '%',
    canImport: report.invalidRows === 0,
    message: report.invalidRows > 0 
      ? `${report.invalidRows} rows have errors and cannot be imported`
      : 'All rows are valid and ready to import'
  };

  return report;
}
```

#### Step 1c: Create Excel Import Component
**File:** `components/ExcelImportModal.jsx`

```javascript
'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  X,
  Download,
  Eye,
  Loader2,
  FileText,
  MapPin
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  parseExcelFile,
  validateImportRow,
  detectDuplicates,
  transformImportedData,
  checkDataIntegrity
} from '@/lib/services/excelImportService';

export function ExcelImportModal({
  isOpen,
  onClose,
  onImport,
  businessId,
  category = 'retail-shop',
  existingProducts = []
}) {
  const [step, setStep] = useState('upload'); // upload, preview, review, confirm
  const [file, setFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [parseResult, setParseResult] = useState(null);
  const [importData, setImportData] = useState([]);
  const [selectedRows, setSelectedRows] = useState(new Set());
  const [dataIntegrityReport, setDataIntegrityReport] = useState(null);

  // Handle file selection
  const handleFileSelect = async (e) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Validate file type
    if (!selectedFile.name.match(/\.xlsx$/i)) {
      toast.error('Please select an Excel file (.xlsx)');
      return;
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB');
      return;
    }

    setFile(selectedFile);
    setIsProcessing(true);
    toast.loading('Parsing Excel file...');

    try {
      const result = await parseExcelFile(selectedFile);
      setParseResult(result);

      if (result.errors.length > 0) {
        toast.error('Failed to parse Excel file');
        console.error('Parse errors:', result.errors);
      } else {
        toast.dismiss();
        toast.success(`Found ${result.preview.length} rows to import`);
        
        // Validate all rows
        const validatedRows = result.preview.map(row => {
          const validation = validateImportRow(row);
          return {
            ...row,
            _isValid: validation.isValid,
            _errors: validation.errors || []
          };
        });

        // Detect duplicates
        const withDuplicates = detectDuplicates(validatedRows, existingProducts);
        
        // Calculate integrity
        const integrity = checkDataIntegrity(withDuplicates);
        setDataIntegrityReport(integrity);

        setImportData(withDuplicates);
        setStep('preview');
      }
    } catch (error) {
      toast.error(`Error: ${error.message}`);
      console.error('File parse error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle row selection
  const toggleRowSelection = (rowId) => {
    const newSelection = new Set(selectedRows);
    if (newSelection.has(rowId)) {
      newSelection.delete(rowId);
    } else {
      newSelection.add(rowId);
    }
    setSelectedRows(newSelection);
  };

  // Handle import
  const handleImport = async () => {
    const rowsToImport = selectedRows.size > 0
      ? importData.filter(row => selectedRows.has(row._rowId))
      : importData.filter(row => row._isValid);

    if (rowsToImport.length === 0) {
      toast.error('No valid rows selected to import');
      return;
    }

    setIsProcessing(true);
    try {
      const transformed = transformImportedData(rowsToImport, category, businessId);
      await onImport?.(transformed);
      toast.success(`Imported ${transformed.length} products successfully`);
      onClose();
    } catch (error) {
      toast.error(`Import failed: ${error.message}`);
      console.error('Import error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  // Download template
  const downloadTemplate = () => {
    const templateContent = `Name,SKU,Category,Price,Cost,Stock,Min Stock,Unit,Description,Status
Product Name,SKU-001,Electronics,50000,30000,100,20,pcs,Product description,active`;
    
    const blob = new Blob([templateContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'inventory_template.csv';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Template downloaded');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="w-6 h-6 text-blue-600" />
            Import Products from Excel
          </DialogTitle>
          <DialogDescription>
            Upload an Excel file to bulk import products with full validation
          </DialogDescription>
        </DialogHeader>

        {/* Upload Step */}
        {step === 'upload' && (
          <div className="space-y-4">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600 mb-4">
                Drag and drop your Excel file here or click to select
              </p>
              <input
                type="file"
                accept=".xlsx"
                onChange={handleFileSelect}
                disabled={isProcessing}
                className="hidden"
                id="excel-upload"
              />
              <label htmlFor="excel-upload">
                <Button
                  as="span"
                  disabled={isProcessing}
                  className="cursor-pointer"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    'Select Excel File'
                  )}
                </Button>
              </label>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">File Requirements</CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-2 text-gray-600">
                <p>✓ Excel format (.xlsx)</p>
                <p>✓ First row must be headers</p>
                <p>✓ Required columns: Name, SKU, Price</p>
                <p>✓ Max file size: 10MB</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={downloadTemplate}
                  className="mt-4 w-full"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Template
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Preview Step */}
        {step === 'preview' && parseResult && (
          <Tabs defaultValue="data" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="data">Preview Data</TabsTrigger>
              <TabsTrigger value="integrity">
                <AlertTriangle className="w-4 h-4 mr-2" />
                Validation Report
              </TabsTrigger>
            </TabsList>

            <TabsContent value="data" className="space-y-4 max-h-[400px] overflow-y-auto">
              {importData.map((row, idx) => (
                <Card
                  key={row._rowId}
                  className={`${
                    !row._isValid ? 'bg-red-50 border-red-200' : ''
                  } ${row._isDuplicate ? 'bg-yellow-50 border-yellow-200' : ''}`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="font-semibold text-sm mb-2">
                          Row {row._rowIndex}: {row.name || 'Unnamed Product'}
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                          {Object.entries(row).map(([key, value]) => {
                            if (key.startsWith('_')) return null;
                            return (
                              <div key={key}>
                                <span className="font-medium">{key}:</span> {value}
                              </div>
                            );
                          })}
                        </div>
                        {row._errors && row._errors.length > 0 && (
                          <Alert className="mt-2 bg-red-50 border-red-200">
                            <AlertTriangle className="w-4 h-4" />
                            <AlertDescription>
                              {row._errors.join(', ')}
                            </AlertDescription>
                          </Alert>
                        )}
                      </div>
                      <div className="flex flex-col gap-2">
                        {row._isValid ? (
                          <CheckCircle2 className="w-6 h-6 text-green-600" />
                        ) : (
                          <X className="w-6 h-6 text-red-600" />
                        )}
                        {selectedRows.has(row._rowId) && (
                          <Badge>Selected</Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="integrity" className="space-y-4">
              {dataIntegrityReport && (
                <>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Validation Summary</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <div className="text-sm text-gray-600">Total Rows</div>
                          <div className="text-2xl font-bold">
                            {dataIntegrityReport.totalRows}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-600">Valid</div>
                          <div className="text-2xl font-bold text-green-600">
                            {dataIntegrityReport.validRows}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-600">Invalid</div>
                          <div className="text-2xl font-bold text-red-600">
                            {dataIntegrityReport.invalidRows}
                          </div>
                        </div>
                      </div>
                      <div className="text-sm">
                        <Badge>
                          {dataIntegrityReport.summary.canImport ? 'Ready to Import' : 'Has Errors'}
                        </Badge>
                        <p className="mt-2 text-gray-600">
                          {dataIntegrityReport.summary.message}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}
            </TabsContent>
          </Tabs>
        )}

        <DialogFooter>
          {step === 'upload' && (
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
          )}

          {step === 'preview' && (
            <>
              <Button
                variant="outline"
                onClick={() => {
                  setStep('upload');
                  setFile(null);
                  setParseResult(null);
                  setImportData([]);
                }}
              >
                Back
              </Button>
              <Button
                onClick={handleImport}
                disabled={isProcessing || importData.filter(r => r._isValid).length === 0}
                className="bg-blue-600"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Importing...
                  </>
                ) : (
                  `Import ${importData.filter(r => r._isValid).length} Products`
                )}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

---

## TASK 2: Preserve Batch/Serial Data in Export

### Goal
Ensure batch and serial tracking data is included in exports and can be round-tripped.

### Implementation

**Update File:** `lib/utils/export.js`

Add to `exportProducts` function:

```javascript
// Include batch tracking data if present
if (prod.product_batches && prod.product_batches.length > 0) {
  // Add batch info as JSON string (can be parsed on import)
  baseData['Batch Data (JSON)'] = JSON.stringify(prod.product_batches.map(b => ({
    batch_number: b.batch_number,
    quantity: b.quantity,
    expiry_date: b.expiry_date,
    manufacturing_date: b.manufacturing_date,
    cost_per_unit: b.cost_per_unit,
    status: b.status
  })));
}

// Include serial tracking data if present
if (prod.product_serials && prod.product_serials.length > 0) {
  baseData['Serial Data (JSON)'] = JSON.stringify(prod.product_serials.map(s => ({
    serial_number: s.serial_number,
    warranty_expiry: s.warranty_expiry,
    status: s.status
  })));
}

// Add location info
if (prod.warehouse_locations) {
  baseData['Location'] = prod.warehouse_locations[0]?.name || '';
  baseData['Stock by Location (JSON)'] = JSON.stringify(prod.warehouse_locations.map(l => ({
    warehouse: l.name,
    quantity: l.quantity
  })));
}
```

---

## TASK 3: Implement Round-Trip Validation

### Goal
Guarantee that exported data can be re-imported without loss.

**Create Test File:** `.kiro/specs/excel-round-trip.test.js`

```javascript
import { exportProducts } from '@/lib/utils/export';
import { transformImportedData } from '@/lib/services/excelImportService';
import { describe, it, expect } from 'vitest';

describe('Excel Round-Trip Validation', () => {
  it('should preserve all product fields after export and import', async () => {
    const originalProducts = [
      {
        id: '123',
        name: 'Test Product',
        sku: 'TST-001',
        price: 1000,
        cost_price: 600,
        stock: 50,
        category: 'Electronics',
        domain_data: { brand: 'Samsung' }
      }
    ];

    // Export
    const exported = await exportProducts(originalProducts, 'excel');
    expect(exported).toBeDefined();

    // Simulate re-import
    const reimported = transformImportedData(exported, 'retail-shop', 'business-123');
    
    // Validate core fields preserved
    expect(reimported[0].name).toBe(originalProducts[0].name);
    expect(reimported[0].sku).toBe(originalProducts[0].sku);
    expect(reimported[0].price).toBe(originalProducts[0].price);
    expect(reimported[0].stock).toBe(originalProducts[0].stock);
  });

  it('should preserve batch tracking data', async () => {
    const productsWithBatch = [
      {
        id: '456',
        name: 'Pharma Product',
        sku: 'PHARM-001',
        price: 50,
        product_batches: [
          {
            batch_number: 'BATCH-2024-001',
            quantity: 100,
            expiry_date: '2025-12-31',
            cost_per_unit: 30
          }
        ]
      }
    ];

    const exported = await exportProducts(productsWithBatch, 'excel');
    
    // Check batch data is in export
    expect(exported).toContain('Batch Data (JSON)');
  });

  it('should preserve serial tracking data', async () => {
    const productsWithSerial = [
      {
        id: '789',
        name: 'Electronics Device',
        sku: 'ELEC-001',
        price: 5000,
        product_serials: [
          {
            serial_number: 'SN-001-2024',
            warranty_expiry: '2026-05-12',
            status: 'active'
          }
        ]
      }
    ];

    const exported = await exportProducts(productsWithSerial, 'excel');
    
    // Check serial data is in export
    expect(exported).toContain('Serial Data (JSON)');
  });
});
```

---

## TASK 4: Enhanced Validation on Import

### Goal
Comprehensive validation to catch data quality issues early.

**Update File:** `lib/services/excelImportService.js`

Add new validation function:

```javascript
/**
 * Comprehensive product validation
 */
export function validateProductImport(product, existingProducts = []) {
  const errors = [];
  const warnings = [];

  // CRITICAL: Required fields
  if (!product.name || String(product.name).trim() === '') {
    errors.push('Product name is required');
  }

  if (!product.price || isNaN(parseFloat(product.price))) {
    errors.push('Valid price is required');
  }

  if (!product.sku || String(product.sku).trim() === '') {
    errors.push('SKU is required');
  }

  // HIGH: Data quality
  const price = parseFloat(product.price || 0);
  if (price < 0) {
    errors.push('Price cannot be negative');
  }

  if (price === 0 && !product.is_service) {
    warnings.push('⚠️ Price is zero - is this intentional?');
  }

  const stock = parseInt(product.stock || 0);
  if (stock < 0) {
    errors.push('Stock cannot be negative');
  }

  // MEDIUM: Uniqueness
  const skuExists = existingProducts.some(
    p => p.sku?.toLowerCase() === product.sku?.toLowerCase()
  );
  if (skuExists) {
    warnings.push(`⚠️ SKU "${product.sku}" already exists - will update existing product`);
  }

  // MEDIUM: Format validation
  if (product.barcode && !validateBarcode(product.barcode)) {
    warnings.push(`⚠️ Invalid barcode format: ${product.barcode}`);
  }

  if (product.expiry_date && !isValidDate(product.expiry_date)) {
    errors.push(`Invalid expiry date format: ${product.expiry_date}`);
  }

  // LOW: Category validation
  const validCategories = ['Electronics', 'Clothing', 'Food', 'Books', 'General'];
  if (product.category && !validCategories.includes(product.category)) {
    warnings.push(`⚠️ Unknown category: ${product.category}`);
  }

  return {
    isValid: errors.length === 0,
    errors: errors.length > 0 ? errors : null,
    warnings: warnings.length > 0 ? warnings : null,
    shouldSkip: errors.length > 0,
    canUpdate: warnings.length > 0 && errors.length === 0
  };
}

function validateBarcode(barcode) {
  // Simple barcode validation (can be enhanced)
  return /^[\d\-\s]*$/.test(barcode) && barcode.length >= 8;
}

function isValidDate(dateString) {
  return !isNaN(Date.parse(dateString));
}
```

---

## TASK 5: Better Error Reporting

### Goal
Provide detailed, actionable error messages during import.

**Create Component:** `components/ImportErrorPanel.jsx`

```javascript
'use client';

import { AlertTriangle, CheckCircle2, AlertCircle, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export function ImportErrorPanel({ errors, warnings, onIgnoreWarnings }) {
  if (!errors && !warnings) return null;

  return (
    <div className="space-y-4">
      {/* Errors */}
      {errors && errors.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2 text-red-900">
              <AlertTriangle className="w-5 h-5" />
              Import Errors ({errors.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {errors.map((error, idx) => (
              <div key={idx} className="flex items-start gap-3 p-2 bg-white rounded border border-red-100">
                <X className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-red-900">
                  <div className="font-medium">{error.rowNumber}: {error.field}</div>
                  <div className="text-red-700">{error.message}</div>
                  {error.suggestion && (
                    <div className="text-red-600 text-xs mt-1">
                      💡 Suggestion: {error.suggestion}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Warnings */}
      {warnings && warnings.length > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2 text-yellow-900">
              <AlertCircle className="w-5 h-5" />
              Warnings ({warnings.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {warnings.map((warning, idx) => (
              <div key={idx} className="flex items-start gap-3 p-2 bg-white rounded border border-yellow-100">
                <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-yellow-900">
                  <div className="font-medium">{warning.rowNumber}: {warning.field}</div>
                  <div className="text-yellow-700">{warning.message}</div>
                </div>
              </div>
            ))}
            <Button
              size="sm"
              variant="outline"
              onClick={onIgnoreWarnings}
              className="mt-2"
            >
              Proceed with Warnings
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
```

---

## Summary of Phase 1 Deliverables

✅ **Excel Import Service** - Parse Excel files with proper validation  
✅ **Excel Import Component** - User-friendly import interface  
✅ **Batch/Serial Export** - Include tracking data in exports  
✅ **Round-Trip Validation** - Guarantee data preservation  
✅ **Enhanced Validation** - Catch quality issues early  
✅ **Better Error Reporting** - Actionable error messages  
✅ **Duplicate Detection** - Prevent SKU conflicts  

**Estimated Implementation Time: 16-20 hours**  
**Target Completion: May 15, 2026**

---

## Installation Steps

```bash
# Install dependencies
npm install exceljs read-excel-file --save

# Create new files
# - lib/services/excelImportService.js
# - components/ExcelImportModal.jsx
# - components/ImportErrorPanel.jsx
# - .kiro/specs/excel-round-trip.test.js

# Update existing files
# - lib/utils/export.js (add batch/serial export)
# - components/BulkOperationsPanel.jsx (integrate ExcelImportModal)
# - components/InventoryManager.jsx (add Excel import button)

# Run tests
npm run test -- excel-round-trip.test.js

# Build
npm run build
```

---

**Next:** Continue with Phase 2 UX Consolidation (create ProductEntryHub component)

