import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as db from '@/lib/database';
import { NextRequest } from 'next/server';

describe('api/viewing-records/stats GET (smoke)', () => {
	beforeEach(() => vi.restoreAllMocks());

	it('returns stats with mocked db', async () => {
		const mockQueryOne = vi.spyOn(db.dbManager, 'queryOne').mockResolvedValue({
			total_records: 5,
			completed_records: 2,
			pending_records: 1,
			total_commission: 3000,
		} as any);

		const { GET } = await import('@/app/api/viewing-records/stats/route');
		const req = {
			nextUrl: new URL('http://localhost/api/viewing-records/stats'),
			headers: new Map(),
		} as unknown as NextRequest;

		const res: any = await (GET as any)(req);
		const body = await res.json();
		expect(body.success).toBe(true);
		expect(body.data.total_records).toBe(5);
		mockQueryOne.mockRestore();
	});
}); 