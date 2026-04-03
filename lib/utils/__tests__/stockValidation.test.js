/**
 * Unit Tests for Stock Validation Utilities
 * 
 * Tests the overselling prevention functionality including:
 * - Multi-location stock aggregation
 * - Reserved quantity consideration
 * - Input validation
 * - Error handling
 * - Edge cases
 */

import { describe, test, expect, beforeEach, vi } from 'vitest';
import { 
  checkAvailableStock, 
  checkAvailableStockAtLocation,
  getStockSummary 
} from '../stockValidation';

// Mock Supabase client
vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn()
}));

describe('Stock Validation Utilities', () => {
  let mockSupabase;
  let createClient;

  beforeEach(async () => {
    // Reset mocks before each test
    vi.clearAllMocks();

    // Import the mocked createClient
    const supabaseModule = await import('@/lib/supabase/client');
    createClient = supabaseModule.createClient;

    // Create mock Supabase client with proper chaining
    // The chain is: from().select().eq().eq() - the last eq() should return the promise
    mockSupabase = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(), // Returns this for chaining
      order: vi.fn(), // This will be set per test
      maybeSingle: vi.fn() // This will be set per test
    };

    createClient.mockReturnValue(mockSupabase);
  });

  describe('checkAvailableStock', () => {
    const productId = 'product-123';
    const businessId = 'business-456';

    test('should return available=true when sufficient stock exists across locations', async () => {
      // Mock data: 3 locations with total available = 150
      const mockData = [
        {
          id: 'loc-1',
          warehouse_id: 'wh-1',
          quantity: 100,
          reserved_quantity: 20,
          available_quantity: 80,
          warehouses: { id: 'wh-1', name: 'Main Warehouse', location: 'City A' }
        },
        {
          id: 'loc-2',
          warehouse_id: 'wh-2',
          quantity: 50,
          reserved_quantity: 10,
          available_quantity: 40,
          warehouses: { id: 'wh-2', name: 'Branch Warehouse', location: 'City B' }
        },
        {
          id: 'loc-3',
          warehouse_id: 'wh-3',
          quantity: 40,
          reserved_quantity: 10,
          available_quantity: 30,
          warehouses: { id: 'wh-3', name: 'Outlet', location: 'City C' }
        }
      ];

      // Mock the chain: from().select().eq().eq()
      // The second .eq() call should return the promise
      mockSupabase.eq
        .mockReturnValueOnce(mockSupabase) // First .eq() returns this for chaining
        .mockResolvedValueOnce({ data: mockData, error: null }); // Second .eq() returns promise

      const result = await checkAvailableStock(productId, businessId, 100);

      expect(result.success).toBe(true);
      expect(result.available).toBe(true);
      expect(result.totalAvailable).toBe(150);
      expect(result.totalReserved).toBe(40);
      expect(result.requestedQuantity).toBe(100);
      expect(result.shortage).toBe(0);
      expect(result.locationBreakdown).toHaveLength(3);
      expect(result.message).toContain('Stock available');
    });

    test('should return available=false when insufficient stock across all locations', async () => {
      // Mock data: Total available = 50, but requesting 100
      mockSupabase.eq
        .mockReturnValueOnce(mockSupabase)
        .mockResolvedValueOnce({
          data: [
            {
              id: 'loc-1',
              warehouse_id: 'wh-1',
              quantity: 60,
              reserved_quantity: 10,
              available_quantity: 50,
              warehouses: { id: 'wh-1', name: 'Main Warehouse', location: 'City A' }
            }
          ],
          error: null
        });

      const result = await checkAvailableStock(productId, businessId, 100);

      expect(result.success).toBe(true);
      expect(result.available).toBe(false);
      expect(result.totalAvailable).toBe(50);
      expect(result.requestedQuantity).toBe(100);
      expect(result.shortage).toBe(50);
      expect(result.message).toContain('Insufficient stock');
      expect(result.message).toContain('Available: 50');
      expect(result.message).toContain('Requested: 100');
      expect(result.message).toContain('Short by: 50');
    });

    test('should handle product with no location records', async () => {
      mockSupabase.eq
        .mockReturnValueOnce(mockSupabase)
        .mockResolvedValueOnce({
          data: [],
          error: null
        });

      const result = await checkAvailableStock(productId, businessId, 10);

      expect(result.success).toBe(true);
      expect(result.available).toBe(false);
      expect(result.totalAvailable).toBe(0);
      expect(result.totalReserved).toBe(0);
      expect(result.locationBreakdown).toHaveLength(0);
      expect(result.message).toBe('No stock available at any location');
    });

    test('should correctly calculate available quantity considering reserved stock', async () => {
      // Location has 100 total, 30 reserved, so 70 available
      mockSupabase.eq
        .mockReturnValueOnce(mockSupabase)
        .mockResolvedValueOnce({
          data: [
            {
              id: 'loc-1',
              warehouse_id: 'wh-1',
              quantity: 100,
              reserved_quantity: 30,
              available_quantity: 70,
              warehouses: { id: 'wh-1', name: 'Warehouse', location: 'City' }
            }
          ],
          error: null
        });

      const result = await checkAvailableStock(productId, businessId, 80);

      expect(result.success).toBe(true);
      expect(result.available).toBe(false);
      expect(result.totalAvailable).toBe(70);
      expect(result.totalReserved).toBe(30);
      expect(result.shortage).toBe(10);
    });

    test('should return error for missing productId', async () => {
      const result = await checkAvailableStock(null, businessId, 10);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Product ID and Business ID are required');
    });

    test('should return error for missing businessId', async () => {
      const result = await checkAvailableStock(productId, null, 10);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Product ID and Business ID are required');
    });

    test('should return error for invalid requestedQuantity (zero)', async () => {
      const result = await checkAvailableStock(productId, businessId, 0);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Requested quantity must be a positive number');
    });

    test('should return error for invalid requestedQuantity (negative)', async () => {
      const result = await checkAvailableStock(productId, businessId, -10);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Requested quantity must be a positive number');
    });

    test('should return error for invalid requestedQuantity (non-number)', async () => {
      const result = await checkAvailableStock(productId, businessId, 'invalid');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Requested quantity must be a positive number');
    });

    test('should handle database query errors gracefully', async () => {
      mockSupabase.eq
        .mockReturnValueOnce(mockSupabase)
        .mockResolvedValueOnce({
          data: null,
          error: { message: 'Connection timeout' }
        });

      const result = await checkAvailableStock(productId, businessId, 10);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Database error');
      expect(result.error).toContain('Connection timeout');
    });

    test('should handle exact match (available equals requested)', async () => {
      mockSupabase.eq
        .mockReturnValueOnce(mockSupabase)
        .mockResolvedValueOnce({
          data: [
            {
              id: 'loc-1',
              warehouse_id: 'wh-1',
              quantity: 50,
              reserved_quantity: 0,
              available_quantity: 50,
              warehouses: { id: 'wh-1', name: 'Warehouse', location: 'City' }
            }
          ],
          error: null
        });

      const result = await checkAvailableStock(productId, businessId, 50);

      expect(result.success).toBe(true);
      expect(result.available).toBe(true);
      expect(result.totalAvailable).toBe(50);
      expect(result.shortage).toBe(0);
    });

    test('should aggregate stock from multiple locations correctly', async () => {
      mockSupabase.eq
        .mockReturnValueOnce(mockSupabase)
        .mockResolvedValueOnce({
          data: [
            {
              id: 'loc-1',
              warehouse_id: 'wh-1',
              quantity: 25,
              reserved_quantity: 5,
              available_quantity: 20,
              warehouses: { id: 'wh-1', name: 'WH1', location: 'A' }
            },
            {
              id: 'loc-2',
              warehouse_id: 'wh-2',
              quantity: 35,
              reserved_quantity: 5,
              available_quantity: 30,
              warehouses: { id: 'wh-2', name: 'WH2', location: 'B' }
            },
            {
              id: 'loc-3',
              warehouse_id: 'wh-3',
              quantity: 55,
              reserved_quantity: 5,
              available_quantity: 50,
              warehouses: { id: 'wh-3', name: 'WH3', location: 'C' }
            }
          ],
          error: null
        });

      const result = await checkAvailableStock(productId, businessId, 90);

      expect(result.success).toBe(true);
      expect(result.available).toBe(true);
      expect(result.totalAvailable).toBe(100); // 20 + 30 + 50
      expect(result.totalReserved).toBe(15); // 5 + 5 + 5
      expect(result.locationBreakdown).toHaveLength(3);
    });
  });

  describe('checkAvailableStockAtLocation', () => {
    const productId = 'product-123';
    const businessId = 'business-456';
    const warehouseId = 'warehouse-789';

    test('should return available=true when sufficient stock at specific location', async () => {
      mockSupabase.maybeSingle.mockResolvedValue({
        data: {
          id: 'loc-1',
          warehouse_id: warehouseId,
          quantity: 100,
          reserved_quantity: 20,
          available_quantity: 80,
          warehouses: { id: warehouseId, name: 'Main Warehouse', location: 'City A' }
        },
        error: null
      });

      const result = await checkAvailableStockAtLocation(productId, businessId, warehouseId, 50);

      expect(result.success).toBe(true);
      expect(result.available).toBe(true);
      expect(result.availableQuantity).toBe(80);
      expect(result.reservedQuantity).toBe(20);
      expect(result.requestedQuantity).toBe(50);
      expect(result.shortage).toBe(0);
      expect(result.warehouseName).toBe('Main Warehouse');
    });

    test('should return available=false when insufficient stock at location', async () => {
      mockSupabase.maybeSingle.mockResolvedValue({
        data: {
          id: 'loc-1',
          warehouse_id: warehouseId,
          quantity: 30,
          reserved_quantity: 10,
          available_quantity: 20,
          warehouses: { id: warehouseId, name: 'Branch', location: 'City B' }
        },
        error: null
      });

      const result = await checkAvailableStockAtLocation(productId, businessId, warehouseId, 50);

      expect(result.success).toBe(true);
      expect(result.available).toBe(false);
      expect(result.availableQuantity).toBe(20);
      expect(result.shortage).toBe(30);
      expect(result.message).toContain('Insufficient stock');
      expect(result.message).toContain('Branch');
    });

    test('should handle no stock at location', async () => {
      mockSupabase.maybeSingle.mockResolvedValue({
        data: null,
        error: null
      });

      const result = await checkAvailableStockAtLocation(productId, businessId, warehouseId, 10);

      expect(result.success).toBe(true);
      expect(result.available).toBe(false);
      expect(result.availableQuantity).toBe(0);
      expect(result.message).toBe('No stock at this location');
    });

    test('should return error for missing warehouseId', async () => {
      const result = await checkAvailableStockAtLocation(productId, businessId, null, 10);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Warehouse ID are required');
    });
  });

  describe('getStockSummary', () => {
    const productId = 'product-123';
    const businessId = 'business-456';

    test('should return comprehensive stock summary across all locations', async () => {
      mockSupabase.order.mockResolvedValue({
        data: [
          {
            id: 'loc-1',
            warehouse_id: 'wh-1',
            quantity: 100,
            reserved_quantity: 20,
            available_quantity: 80,
            min_stock: 10,
            max_stock: 200,
            warehouses: { id: 'wh-1', name: 'Main', location: 'A', is_primary: true }
          },
          {
            id: 'loc-2',
            warehouse_id: 'wh-2',
            quantity: 50,
            reserved_quantity: 10,
            available_quantity: 40,
            min_stock: 5,
            max_stock: 100,
            warehouses: { id: 'wh-2', name: 'Branch', location: 'B', is_primary: false }
          }
        ],
        error: null
      });

      const result = await getStockSummary(productId, businessId);

      expect(result.success).toBe(true);
      expect(result.totalQuantity).toBe(150);
      expect(result.totalReserved).toBe(30);
      expect(result.totalAvailable).toBe(120);
      expect(result.locationCount).toBe(2);
      expect(result.locations).toHaveLength(2);
      expect(result.locations[0].isPrimary).toBe(true);
      expect(result.locations[0].isLowStock).toBe(false);
    });

    test('should identify low stock locations', async () => {
      mockSupabase.order.mockResolvedValue({
        data: [
          {
            id: 'loc-1',
            warehouse_id: 'wh-1',
            quantity: 8,
            reserved_quantity: 0,
            available_quantity: 8,
            min_stock: 10,
            max_stock: 100,
            warehouses: { id: 'wh-1', name: 'Warehouse', location: 'City', is_primary: true }
          }
        ],
        error: null
      });

      const result = await getStockSummary(productId, businessId);

      expect(result.success).toBe(true);
      expect(result.locations[0].isLowStock).toBe(true);
    });

    test('should handle product with no locations', async () => {
      mockSupabase.order.mockResolvedValue({
        data: [],
        error: null
      });

      const result = await getStockSummary(productId, businessId);

      expect(result.success).toBe(true);
      expect(result.totalQuantity).toBe(0);
      expect(result.totalAvailable).toBe(0);
      expect(result.locationCount).toBe(0);
      expect(result.locations).toHaveLength(0);
    });

    test('should return error for missing parameters', async () => {
      const result = await getStockSummary(null, businessId);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Product ID and Business ID are required');
    });
  });
});
