import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as db from '@/lib/database';
import { NextRequest } from 'next/server';

describe('api/customers/[id] handlers', () => {
	beforeEach(() => vi.restoreAllMocks());

	it('GET returns customer or 404', async () => {
		const { GET } = await import('@/app/api/customers/[id]/route');
		const mockCustomer = {
			id: 1,
			name: '张三',
			phone: '13800138000',
			community: '万科',
			business_type: '["whole_rent"]',
			room_type: '["one_bedroom"]',
			room_tags: '["loft"]',
			is_agent: 1,
			created_at: '2024-01-01',
			updated_at: '2024-01-02',
		};

		vi.spyOn(db.dbManager, 'queryOne').mockResolvedValueOnce(mockCustomer as any);
		const req = { headers: new Map() } as unknown as NextRequest;
		const resOk: any = await (GET as any)(req, { params: { id: '1' } });
		const bodyOk = await resOk.json();
		expect(bodyOk.success).toBe(true);
		expect(bodyOk.data.name).toBe('张三');

		vi.spyOn(db.dbManager, 'queryOne').mockResolvedValueOnce(null as any);
		const res404: any = await (GET as any)(req, { params: { id: '999' } });
		const body404 = await res404.json();
		expect(res404.status).toBe(404);
		expect(body404.success).toBe(false);
	});



	it('DELETE should delete customer successfully', async () => {
		const { DELETE } = await import('@/app/api/customers/[id]/route');
		const spyQ1 = vi.spyOn(db.dbManager, 'queryOne');
		const spyExecute = vi.spyOn(db.dbManager, 'execute');
		
		spyQ1.mockResolvedValueOnce({ id: 1, name: '张三' } as any); // exists check
		spyExecute.mockResolvedValueOnce({ changes: 2 } as any); // delete viewing records
		spyExecute.mockResolvedValueOnce({ changes: 1 } as any); // delete customer

		const req = { headers: new Map() } as unknown as NextRequest;
		const res: any = await (DELETE as any)(req, { params: { id: '1' } });
		const body = await res.json();
		expect(body.success).toBe(true);
		expect(body.message).toBe('客户删除成功');
	});

	it('DELETE should return 404 when customer does not exist', async () => {
		const { DELETE } = await import('@/app/api/customers/[id]/route');
		vi.spyOn(db.dbManager, 'queryOne').mockResolvedValueOnce(null as any);

		const req = { headers: new Map() } as unknown as NextRequest;
		const res: any = await (DELETE as any)(req, { params: { id: '999' } });
		const body = await res.json();
		expect(res.status).toBe(404);
		expect(body.success).toBe(false);
		expect(body.error).toBe('客户不存在');
	});

	it('DELETE should handle database errors gracefully', async () => {
		const { DELETE } = await import('@/app/api/customers/[id]/route');
		vi.spyOn(db.dbManager, 'queryOne').mockRejectedValueOnce(new Error('Database connection failed'));

		const req = { headers: new Map() } as unknown as NextRequest;
		const res: any = await (DELETE as any)(req, { params: { id: '1' } });
		const body = await res.json();
		expect(res.status).toBe(500);
		expect(body.success).toBe(false);
		expect(body.error).toBe('删除客户失败失败');
	});
}); 