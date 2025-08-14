import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as db from '@/lib/database';
import { NextRequest } from 'next/server';

describe('api/external/customers POST (smoke)', () => {
	beforeEach(() => vi.restoreAllMocks());

	it('updates existing customer when userId exists', async () => {
		vi.spyOn(db.dbManager, 'queryOne').mockResolvedValue({ id: 7, name: 'old' } as any);
		const exec = vi.spyOn(db.dbManager, 'execute').mockResolvedValue({ changes: 1, lastInsertRowid: 0 } as any);

		const { POST } = await import('@/app/api/external/customers/route');
		const req = {
			json: async () => ({ userId: 'u1', name: '新' }),
			headers: new Map(),
		} as unknown as NextRequest;

		const res: any = await (POST as any)(req);
		const body = await res.json();
		expect(res.status).toBe(200);
		expect(body.success).toBe(true);
		expect(body.data.id).toBe(7);
		expect(exec).toHaveBeenCalled();
	});

	it('creates new customer when userId not exists', async () => {
		vi.spyOn(db.dbManager, 'queryOne').mockResolvedValue(null as any);
		const exec = vi.spyOn(db.dbManager, 'execute').mockResolvedValue({ changes: 1, lastInsertRowid: 66 } as any);

		const { POST } = await import('@/app/api/external/customers/route');
		const req = {
			json: async () => ({ userId: 'u2', name: '新2' }),
			headers: new Map(),
		} as unknown as NextRequest;

		const res: any = await (POST as any)(req);
		const body = await res.json();
		expect(res.status).toBe(201);
		expect(body.success).toBe(true);
		expect(body.data.id).toBe(66);
		expect(exec).toHaveBeenCalled();
	});
}); 