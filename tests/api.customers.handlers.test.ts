import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as db from '@/lib/database';
import { NextRequest } from 'next/server';

function makeReq(url: string): NextRequest {
	return {
		nextUrl: new URL(url),
		headers: new Map(),
	} as unknown as NextRequest;
}

describe('api/customers GET (filters & response)', () => {
	beforeEach(() => vi.restoreAllMocks());

	it('returns paginated data and converts fields', async () => {
		const row = {
			id: 1,
			name: '张三',
			phone: '13800138000',
			community: '万科',
			business_type: '["whole_rent"]',
			room_type: '["one_bedroom"]',
			room_tags: '["loft"]',
			is_agent: 1,
			total_commission: 0,
			viewing_count: 0,
			created_at: '2024-01-01',
			updated_at: '2024-01-02',
		} as any;

		const spyQ = vi.spyOn(db.dbManager, 'queryWithPagination').mockResolvedValue({
			data: [row], total: 1, page: 1, pageSize: 6, totalPages: 1,
		});
		const spyQ1 = vi.spyOn(db.dbManager, 'queryOne').mockResolvedValue({ total_commission: 1000 } as any);

		const { GET } = await import('@/app/api/customers/route');
		const res: any = await (GET as any)(makeReq('http://localhost/api/customers?page=1&pageSize=6'));
		const body = await res.json();

		expect(body.success).toBe(true);
		expect(body.data.total).toBe(1);
		expect(body.data.totalCommission).toBe(1000);
		expect(Array.isArray(body.data.data)).toBe(true);
		expect(body.data.data[0].business_type).toEqual(['whole_rent']);
		expect(body.data.data[0].room_type).toEqual(['one_bedroom']);
		expect(body.data.data[0].room_tags).toEqual(['loft']);
		expect(body.data.data[0].is_agent).toBe(true);

		spyQ.mockRestore();
		spyQ1.mockRestore();
	});

	it('applies complex filters and builds where clause', async () => {
		let capturedBaseQuery = '';
		let capturedParams: any[] = [];
		const spyQ = vi.spyOn(db.dbManager, 'queryWithPagination').mockImplementation(async (bq: any, _cq: any, params: any, _p: any, _ps: any) => {
			capturedBaseQuery = String(bq);
			capturedParams = params;
			return { data: [], total: 0, page: 2, pageSize: 10, totalPages: 0 } as any;
		});
		const spyQ1 = vi.spyOn(db.dbManager, 'queryOne').mockResolvedValue({ total_commission: 0 } as any);

		const q = new URLSearchParams({
			page: '2', pageSize: '10',
			name: '张', phone: '138', community: '万科',
			status: '[1,3]',
			source_channel: '["beike","douyin"]',
			business_type: '["whole_rent","shared_rent"]',
			price_min: '3000', price_max: '5000',
			city: '["上海","北京"]',
			is_agent: '[true,false]',
			move_in_days: '7',
			viewing_today: 'true',
			botId: 'botA',
		});

		const { GET } = await import('@/app/api/customers/route');
		await (GET as any)(makeReq(`http://localhost/api/customers?${q.toString()}`));

		expect(capturedBaseQuery).toContain('FROM qft_ai_customers');
		expect(capturedBaseQuery).toContain('name LIKE ?');
		expect(capturedBaseQuery).toContain('phone LIKE ?');
		expect(capturedBaseQuery).toContain('status IN (');
		expect(capturedBaseQuery).toContain('source_channel IN (');
		expect(capturedBaseQuery).toMatch(/business_type LIKE \?/);
		expect(capturedBaseQuery).toContain('community LIKE ?');
		expect(capturedBaseQuery).toContain('is_agent IN (');
		expect(capturedBaseQuery).toContain('botId = ?');
		expect(capturedBaseQuery).toContain('CAST(SUBSTR');
		expect(capturedBaseQuery).toContain('INSTR(price_range');
		expect(capturedBaseQuery).toContain('SELECT DISTINCT customer_id');


		expect(Array.isArray(capturedParams)).toBe(true);
		expect(capturedParams.length).toBeGreaterThan(0);

		spyQ.mockRestore();
		spyQ1.mockRestore();
	});

	it('applies only price_min or price_max correctly', async () => {
		let capturedBaseQuery = '';
		const spyQ = vi.spyOn(db.dbManager, 'queryWithPagination').mockImplementation(async (bq: any, _cq: any, _params: any) => {
			capturedBaseQuery = String(bq);
			return { data: [], total: 0, page: 1, pageSize: 6, totalPages: 0 } as any;
		});
		vi.spyOn(db.dbManager, 'queryOne').mockResolvedValue({ total_commission: 0 } as any);

		const { GET } = await import('@/app/api/customers/route');
		await (GET as any)(makeReq('http://localhost/api/customers?price_min=3000'));
		expect(capturedBaseQuery).toContain('CAST(SUBSTR');
		await (GET as any)(makeReq('http://localhost/api/customers?price_max=8000'));
		expect(capturedBaseQuery).toContain('CAST(SUBSTR');
		spyQ.mockRestore();
	});
}); 