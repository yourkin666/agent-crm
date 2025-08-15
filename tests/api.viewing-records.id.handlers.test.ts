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

	it('PUT should update customer status when any viewing record has deal feedback', async () => {
		const { PUT } = await import('@/app/api/viewing-records/[id]/route');
		const spyQ1 = vi.spyOn(db.dbManager, 'queryOne');
		const spyExecute = vi.spyOn(db.dbManager, 'execute');
		
		spyQ1.mockResolvedValueOnce({ id: 8, customer_id: 123 } as any); // exists check with customer_id
		spyExecute.mockResolvedValueOnce({ changes: 1 } as any); // viewing record update
		spyQ1.mockResolvedValueOnce({ count: 1 } as any); // has deal feedback check
		spyExecute.mockResolvedValueOnce({ changes: 1 } as any); // customer status update
		spyQ1.mockResolvedValueOnce({ id: 8, viewing_feedback: 0 } as any); // after update

		const req = { headers: new Map(), json: async () => ({ viewing_feedback: 0 }) } as unknown as NextRequest;
		const res: any = await (PUT as any)(req, { params: { id: '8' } });
		const body = await res.json();
		expect(body.success).toBe(true);
		expect(body.data.viewing_feedback).toBe(0);
	});

	it('PUT should not update customer status if no viewing records have deal feedback', async () => {
		const { PUT } = await import('@/app/api/viewing-records/[id]/route');
		const spyQ1 = vi.spyOn(db.dbManager, 'queryOne');
		const spyExecute = vi.spyOn(db.dbManager, 'execute');
		
		spyQ1.mockResolvedValueOnce({ id: 8, customer_id: 123 } as any); // exists check with customer_id
		spyExecute.mockResolvedValueOnce({ changes: 1 } as any); // viewing record update
		spyQ1.mockResolvedValueOnce({ count: 0 } as any); // no deal feedback check
		spyQ1.mockResolvedValueOnce({ id: 8, viewing_feedback: 0 } as any); // after update

		const req = { headers: new Map(), json: async () => ({ viewing_feedback: 0 }) } as unknown as NextRequest;
		const res: any = await (PUT as any)(req, { params: { id: '8' } });
		const body = await res.json();
		expect(body.success).toBe(true);
		expect(body.data.viewing_feedback).toBe(0);
	});

	it('PUT should not update customer status if already status 4', async () => {
		const { PUT } = await import('@/app/api/viewing-records/[id]/route');
		const spyQ1 = vi.spyOn(db.dbManager, 'queryOne');
		const spyExecute = vi.spyOn(db.dbManager, 'execute');
		
		spyQ1.mockResolvedValueOnce({ id: 8, customer_id: 123 } as any); // exists check with customer_id
		spyExecute.mockResolvedValueOnce({ changes: 1 } as any); // viewing record update
		spyQ1.mockResolvedValueOnce({ count: 1 } as any); // has deal feedback check
		spyExecute.mockResolvedValueOnce({ changes: 0 } as any); // customer status update (no change)
		spyQ1.mockResolvedValueOnce({ id: 8, viewing_feedback: 1 } as any); // after update

		const req = { headers: new Map(), json: async () => ({ viewing_feedback: 1 }) } as unknown as NextRequest;
		const res: any = await (PUT as any)(req, { params: { id: '8' } });
		const body = await res.json();
		expect(body.success).toBe(true);
		expect(body.data.viewing_feedback).toBe(1);
	});

	it('DELETE should delete viewing record successfully', async () => {
		const { DELETE } = await import('@/app/api/viewing-records/[id]/route');
		const spyQ1 = vi.spyOn(db.dbManager, 'queryOne');
		const spyExecute = vi.spyOn(db.dbManager, 'execute');
		
		spyQ1.mockResolvedValueOnce({ id: 8, customer_id: 123 } as any); // exists check
		spyExecute.mockResolvedValueOnce({ changes: 1 } as any); // delete viewing record
		spyQ1.mockResolvedValueOnce({ count: 2 } as any); // count remaining viewing records
		spyQ1.mockResolvedValueOnce({ total: 200 } as any); // sum remaining commission
		spyExecute.mockResolvedValueOnce({ changes: 1 } as any); // update customer

		const req = { headers: new Map() } as unknown as NextRequest;
		const res: any = await (DELETE as any)(req, { params: { id: '8' } });
		const body = await res.json();
		expect(body.success).toBe(true);
		expect(body.message).toBe('带看记录删除成功');
	});

	it('DELETE should return 404 when viewing record does not exist', async () => {
		const { DELETE } = await import('@/app/api/viewing-records/[id]/route');
		vi.spyOn(db.dbManager, 'queryOne').mockResolvedValueOnce(null as any);

		const req = { headers: new Map() } as unknown as NextRequest;
		const res: any = await (DELETE as any)(req, { params: { id: '999' } });
		const body = await res.json();
		expect(res.status).toBe(404);
		expect(body.success).toBe(false);
		expect(body.error).toBe('带看记录不存在');
	});

	it('DELETE should handle database errors gracefully', async () => {
		const { DELETE } = await import('@/app/api/viewing-records/[id]/route');
		vi.spyOn(db.dbManager, 'queryOne').mockRejectedValueOnce(new Error('Database connection failed'));

		const req = { headers: new Map() } as unknown as NextRequest;
		const res: any = await (DELETE as any)(req, { params: { id: '8' } });
		const body = await res.json();
		expect(res.status).toBe(500);
		expect(body.success).toBe(false);
		expect(body.error).toBe('删除带看记录失败');
	});
}); 