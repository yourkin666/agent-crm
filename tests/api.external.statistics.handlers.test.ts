import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from '../src/app/api/external/statistics/route';

// Mock database module
vi.mock('../src/lib/database', () => ({
  dbManager: {
    queryOne: vi.fn()
  }
}));

// Mock logger module
vi.mock('../src/lib/logger', () => ({
  createRequestLogger: vi.fn(() => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn()
  }))
}));

// Mock api-error-handler module
vi.mock('../src/lib/api-error-handler', () => ({
  withErrorHandler: vi.fn((handler) => handler)
}));

describe('External Statistics API', () => {
  let mockQuery: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    mockQuery = vi.mocked((await import('../src/lib/database')).dbManager.queryOne);
  });

  const createMockRequest = (url: string): NextRequest => {
    return new NextRequest(new URL(url, 'http://localhost:3000'));
  };

  describe('GET /api/external/statistics', () => {
    it('should return statistics for all data (default)', async () => {
      // Mock database responses
      mockQuery
        .mockResolvedValueOnce({ viewing_count: 50, total_commission: '25000.00' })
        .mockResolvedValueOnce({ completed_unpaid_count: 10, completed_paid_count: 5 });

      const request = createMockRequest('http://localhost:3000/api/external/statistics');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toMatchObject({
        viewing_count: 50,
        completed_unpaid_count: 10,
        completed_paid_count: 5,
        total_commission: 25000.00
      });
      expect(data.data.period).toEqual({});
    });

    it('should return statistics for specified date range', async () => {
      mockQuery
        .mockResolvedValueOnce({ viewing_count: 25, total_commission: '15000.00' })
        .mockResolvedValueOnce({ completed_unpaid_count: 8, completed_paid_count: 3 });

      const request = createMockRequest(
        'http://localhost:3000/api/external/statistics?date_from=2024-01-01&date_to=2024-01-31'
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.period).toEqual({
        date_from: '2024-01-01',
        date_to: '2024-01-31'
      });
    });



    it('should handle zero results', async () => {
      mockQuery
        .mockResolvedValueOnce({ viewing_count: 0, total_commission: null })
        .mockResolvedValueOnce({ completed_unpaid_count: 0, completed_paid_count: 0 });

      const request = createMockRequest('http://localhost:3000/api/external/statistics');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toMatchObject({
        viewing_count: 0,
        completed_unpaid_count: 0,
        completed_paid_count: 0,
        total_commission: 0
      });
    });

    it('should validate date format for date_from', async () => {
      const request = createMockRequest(
        'http://localhost:3000/api/external/statistics?date_from=invalid-date'
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('INVALID_DATE_FORMAT');
    });

    it('should validate date format for date_to', async () => {
      const request = createMockRequest(
        'http://localhost:3000/api/external/statistics?date_to=invalid-date'
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('INVALID_DATE_FORMAT');
    });



    it('should handle database errors gracefully', async () => {
      mockQuery.mockRejectedValueOnce(new Error('Database connection failed'));

      const request = createMockRequest('http://localhost:3000/api/external/statistics');
      
      await expect(GET(request)).rejects.toThrow('Database connection failed');
    });

    it('should handle null commission values', async () => {
      mockQuery
        .mockResolvedValueOnce({ viewing_count: 10, total_commission: null })
        .mockResolvedValueOnce({ completed_unpaid_count: 5, completed_paid_count: 2 });

      const request = createMockRequest('http://localhost:3000/api/external/statistics');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.total_commission).toBe(0);
    });

    it('should handle string commission values', async () => {
      mockQuery
        .mockResolvedValueOnce({ viewing_count: 10, total_commission: '12345.67' })
        .mockResolvedValueOnce({ completed_unpaid_count: 5, completed_paid_count: 2 });

      const request = createMockRequest('http://localhost:3000/api/external/statistics');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.total_commission).toBe(12345.67);
    });
  });
}); 