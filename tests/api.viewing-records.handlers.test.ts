import { describe, it, expect, vi, beforeEach } from 'vitest';
import { withErrorHandler } from '@/lib/api-error-handler';
import * as db from '@/lib/database';
import { NextRequest } from 'next/server';

// 由于 Next.js Route Handler 中大量依赖 dbManager，这里通过 spy 模拟其行为，专注验证包装器与基本流程可调用

describe('api/viewing-records route handlers (smoke)', () => {
	beforeEach(() => {
		vi.restoreAllMocks();
	});

	it('GET handler should return success shape with mocked db', async () => {
		const mockQueryOne = vi.spyOn(db.dbManager, 'queryOne').mockResolvedValue({ total: 0 } as any);
		const mockQuery = vi.spyOn(db.dbManager, 'query').mockResolvedValue([] as any);

		const { GET } = await import('@/app/api/viewing-records/route');

		const req = {
			nextUrl: new URL('http://localhost/api/viewing-records?page=1&pageSize=10'),
			headers: new Map(),
		} as unknown as NextRequest;

		const res: any = await (GET as any)(req);
		const body = await res.json();
		expect(body.success).toBe(true);
		expect(body.data.total).toBe(0);
		expect(Array.isArray(body.data.data)).toBe(true);

		mockQuery.mockRestore();
		mockQueryOne.mockRestore();
	});

	it('POST handler should validate and insert with mocked db', async () => {
		const mockQueryOne = vi.spyOn(db.dbManager, 'queryOne').mockResolvedValue({ id: 1, name: '张三', phone: '13800138000' } as any);
		const mockExecute = vi.spyOn(db.dbManager, 'execute').mockResolvedValue({ changes: 1, lastInsertRowid: 123 } as any);

		const { POST } = await import('@/app/api/viewing-records/route');

		const req = {
			json: async () => ({
				customer_id: 1,
				property_name: '测试楼盘',
				viewing_status: 2,
				commission: 1000,
				business_type: 'whole_rent',
				viewer_name: 'internal',
			}),
			headers: new Map(),
		} as unknown as NextRequest;

		const res: any = await (POST as any)(req);
		const body = await res.json();
		expect(res.status).toBe(201);
		expect(body.success).toBe(true);
		expect(body.data.id).toBe(123);

		mockExecute.mockRestore();
		mockQueryOne.mockRestore();
	});
}); 