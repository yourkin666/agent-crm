import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as db from '@/lib/database';
import { NextRequest } from 'next/server';

describe('api/viewing-records/[id] handlers (smoke)', () => {
	beforeEach(() => vi.restoreAllMocks());

	it('GET returns record or 404', async () => {
		const { GET } = await import('@/app/api/viewing-records/[id]/route');
		vi.spyOn(db.dbManager, 'queryOne').mockResolvedValueOnce({ id: 9, property_name: 'x', customer_name: '张' } as any);
		const req = { headers: new Map() } as unknown as NextRequest;
		const resOk: any = await (GET as any)(req, { params: { id: '9' } });
		const bodyOk = await resOk.json();
		expect(bodyOk.success).toBe(true);

		vi.spyOn(db.dbManager, 'queryOne').mockResolvedValueOnce(null as any);
		const res404: any = await (GET as any)(req, { params: { id: '999' } });
		const body404 = await res404.json();
		expect(res404.status).toBe(500);
		expect(body404.errorType).toBe('DATABASE_ERROR');
	});

	it('PUT updates record', async () => {
		const { PUT } = await import('@/app/api/viewing-records/[id]/route');
		const spyQ1 = vi.spyOn(db.dbManager, 'queryOne');
		spyQ1.mockResolvedValueOnce({ id: 8 } as any); // exists check
		vi.spyOn(db.dbManager, 'execute').mockResolvedValueOnce({ changes: 1 } as any);
		spyQ1.mockResolvedValueOnce({ id: 8, property_name: 'new' } as any); // after update

		const req = { headers: new Map(), json: async () => ({ property_name: 'new' }) } as unknown as NextRequest;
		const res: any = await (PUT as any)(req, { params: { id: '8' } });
		const body = await res.json();
		expect(body.success).toBe(true);
		expect(body.data.property_name).toBe('new');
	});
}); 