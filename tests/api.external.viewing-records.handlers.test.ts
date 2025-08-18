import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// 简单 mock fetch，返回 code=200 但 data 为空，避免外部依赖
const mockFetch = vi.fn(async () => ({ ok: true, json: async () => ({ code: 200, message: 'ok', data: [], timestamp: Date.now() }) } as any));

// Mock 数据库模块
const mockDbManager = {
  queryOne: vi.fn(),
  execute: vi.fn(),
  query: vi.fn(),
};

vi.mock('@/lib/database', () => ({
  dbManager: mockDbManager,
}));

describe('api/external/viewing-records POST (smoke)', () => {
	beforeEach(() => {
		vi.restoreAllMocks();
		(globalThis as any).fetch = mockFetch;
		// 重置数据库mock
		mockDbManager.queryOne.mockReset();
		mockDbManager.execute.mockReset();
		mockDbManager.query.mockReset();
	});

	it('updates existing customer & existing viewing record', async () => {
		// existing customer
		mockDbManager.queryOne
			.mockResolvedValueOnce({ id: 1, name: '老', phone: null } as any) // 查客户
			.mockResolvedValueOnce({ id: 2, customer_id: 1 } as any); // 查重复带看记录
		mockDbManager.execute.mockResolvedValue({ changes: 1, lastInsertRowid: 2 } as any);

		const { POST } = await import('@/app/api/external/viewing-records/route');
		const req = {
			json: async () => ({ userId: 'u', property_name: '万科', customer_name: '张', property_address: 'A路1号' }),
			headers: new Map(),
		} as unknown as NextRequest;
		const res: any = await (POST as any)(req);
		const body = await res.json();
		expect(res.status).toBe(201);
		expect(body.success).toBe(true);
		expect(mockDbManager.execute).toHaveBeenCalled();
	});

	it('creates customer & new viewing record when not exists', async () => {
		mockDbManager.queryOne
			.mockResolvedValueOnce(null as any) // 查客户
			.mockResolvedValueOnce(null as any); // 查重复带看记录
		mockDbManager.execute
			.mockResolvedValueOnce({ changes: 1, lastInsertRowid: 11 } as any)
			.mockResolvedValueOnce({ changes: 1, lastInsertRowid: 22 } as any)
			.mockResolvedValueOnce({ changes: 1 } as any); // 更新统计

		const { POST } = await import('@/app/api/external/viewing-records/route');
		const req = {
			json: async () => ({ userId: 'u2', property_name: '绿地', customer_name: '李' }),
			headers: new Map(),
		} as unknown as NextRequest;
		const res: any = await (POST as any)(req);
		const body = await res.json();
		expect(res.status).toBe(201);
		expect(body.success).toBe(true);
		expect(mockDbManager.execute).toHaveBeenCalled();
	});
}); 