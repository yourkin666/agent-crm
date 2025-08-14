import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as db from '@/lib/database';
import { NextRequest } from 'next/server';

describe('api/external/viewing-records/[userId] GET (smoke)', () => {
	beforeEach(() => vi.restoreAllMocks());

	it('returns paginated records', async () => {
		vi.spyOn(db.dbManager, 'queryOne').mockResolvedValue({ total: 0 } as any);
		vi.spyOn(db.dbManager, 'query').mockResolvedValue([] as any);

		const { GET } = await import('@/app/api/external/viewing-records/[userId]/route');
		const req = { headers: new Map(), nextUrl: new URL('http://localhost/api/external/viewing-records/u?page=1&pageSize=10') } as unknown as NextRequest;
		const res: any = await (GET as any)(req, { params: { userId: 'u' } });
		const body = await res.json();
		expect(res.status).toBe(200);
		expect(body.success).toBe(true);
		expect(body.data.total).toBe(0);
	});
}); 