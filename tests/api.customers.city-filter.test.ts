import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as db from '@/lib/database';
import { NextRequest } from 'next/server';

function makeReq(url: string): NextRequest {
	return {
		nextUrl: new URL(url),
		headers: new Map(),
	} as unknown as NextRequest;
}

describe('城市筛选功能测试', () => {
	beforeEach(() => vi.restoreAllMocks());

	it('单城市筛选应该正确构建SQL条件', async () => {
		let capturedBaseQuery = '';
		let capturedParams: any[] = [];
		
		const spyQ = vi.spyOn(db.dbManager, 'queryWithPagination').mockImplementation(async (bq: any, _cq: any, params: any, _p: any, _ps: any) => {
			capturedBaseQuery = String(bq);
			capturedParams = params;
			return { data: [], total: 0, page: 1, pageSize: 10, totalPages: 0 } as any;
		});
		const spyQ1 = vi.spyOn(db.dbManager, 'queryOne').mockResolvedValue({ total_commission: 0 } as any);

		const { GET } = await import('@/app/api/customers/route');
		await (GET as any)(makeReq('http://localhost/api/customers?city=北京'));

		// 检查SQL是否包含城市筛选条件（支持多种格式）
		expect(capturedBaseQuery).toContain('EXISTS (SELECT 1 FROM qft_ai_viewing_records vr WHERE vr.customer_id = qft_ai_customers.id AND (vr.cityName LIKE ? OR vr.cityName LIKE ? OR vr.cityName = ?))');
		
		// 检查参数是否正确（支持原名称、原名称+市、精确匹配）
		expect(capturedParams).toContain('%北京%');
		expect(capturedParams).toContain('北京市');
		expect(capturedParams).toContain('北京');

		spyQ.mockRestore();
		spyQ1.mockRestore();
	});

	it('多城市筛选应该正确构建SQL条件', async () => {
		let capturedBaseQuery = '';
		let capturedParams: any[] = [];
		
		const spyQ = vi.spyOn(db.dbManager, 'queryWithPagination').mockImplementation(async (bq: any, _cq: any, params: any, _p: any, _ps: any) => {
			capturedBaseQuery = String(bq);
			capturedParams = params;
			return { data: [], total: 0, page: 1, pageSize: 10, totalPages: 0 } as any;
		});
		const spyQ1 = vi.spyOn(db.dbManager, 'queryOne').mockResolvedValue({ total_commission: 0 } as any);

		const { GET } = await import('@/app/api/customers/route');
		await (GET as any)(makeReq('http://localhost/api/customers?city=["北京","上海","广州"]'));

		// 检查SQL是否包含多城市筛选条件（支持多种格式）
		expect(capturedBaseQuery).toContain('EXISTS (SELECT 1 FROM qft_ai_viewing_records vr WHERE vr.customer_id = qft_ai_customers.id AND ((vr.cityName LIKE ? OR vr.cityName LIKE ? OR vr.cityName = ?) OR (vr.cityName LIKE ? OR vr.cityName LIKE ? OR vr.cityName = ?) OR (vr.cityName LIKE ? OR vr.cityName LIKE ? OR vr.cityName = ?)))');
		
		// 检查参数是否正确（每个城市支持三种格式）
		expect(capturedParams).toContain('%北京%');
		expect(capturedParams).toContain('北京市');
		expect(capturedParams).toContain('北京');
		expect(capturedParams).toContain('%上海%');
		expect(capturedParams).toContain('上海市');
		expect(capturedParams).toContain('上海');
		expect(capturedParams).toContain('%广州%');
		expect(capturedParams).toContain('广州市');
		expect(capturedParams).toContain('广州');

		spyQ.mockRestore();
		spyQ1.mockRestore();
	});

	it('空城市数组应该跳过筛选条件', async () => {
		let capturedBaseQuery = '';
		let capturedParams: any[] = [];
		
		const spyQ = vi.spyOn(db.dbManager, 'queryWithPagination').mockImplementation(async (bq: any, _cq: any, params: any, _p: any, _ps: any) => {
			capturedBaseQuery = String(bq);
			capturedParams = params;
			return { data: [], total: 0, page: 1, pageSize: 10, totalPages: 0 } as any;
		});
		const spyQ1 = vi.spyOn(db.dbManager, 'queryOne').mockResolvedValue({ total_commission: 0 } as any);

		const { GET } = await import('@/app/api/customers/route');
		await (GET as any)(makeReq('http://localhost/api/customers?city=[]'));

		// 检查SQL不应该包含城市筛选条件
		expect(capturedBaseQuery).not.toContain('EXISTS (SELECT 1 FROM qft_ai_viewing_records vr WHERE vr.customer_id = qft_ai_customers.id AND');
		
		// 检查参数中不应该有城市相关的参数
		const cityParams = capturedParams.filter(param => typeof param === 'string' && param.includes('%'));
		expect(cityParams.length).toBe(0);

		spyQ.mockRestore();
		spyQ1.mockRestore();
	});

	it('逗号分隔的城市参数应该正确解析', async () => {
		let capturedBaseQuery = '';
		let capturedParams: any[] = [];
		
		const spyQ = vi.spyOn(db.dbManager, 'queryWithPagination').mockImplementation(async (bq: any, _cq: any, params: any, _p: any, _ps: any) => {
			capturedBaseQuery = String(bq);
			capturedParams = params;
			return { data: [], total: 0, page: 1, pageSize: 10, totalPages: 0 } as any;
		});
		const spyQ1 = vi.spyOn(db.dbManager, 'queryOne').mockResolvedValue({ total_commission: 0 } as any);

		const { GET } = await import('@/app/api/customers/route');
		await (GET as any)(makeReq('http://localhost/api/customers?city=北京,上海'));

		// 检查SQL是否包含多城市筛选条件（支持多种格式）
		expect(capturedBaseQuery).toContain('EXISTS (SELECT 1 FROM qft_ai_viewing_records vr WHERE vr.customer_id = qft_ai_customers.id AND ((vr.cityName LIKE ? OR vr.cityName LIKE ? OR vr.cityName = ?) OR (vr.cityName LIKE ? OR vr.cityName LIKE ? OR vr.cityName = ?)))');
		
		// 检查参数是否正确（每个城市支持三种格式）
		expect(capturedParams).toContain('%北京%');
		expect(capturedParams).toContain('北京市');
		expect(capturedParams).toContain('北京');
		expect(capturedParams).toContain('%上海%');
		expect(capturedParams).toContain('上海市');
		expect(capturedParams).toContain('上海');

		spyQ.mockRestore();
		spyQ1.mockRestore();
	});
}); 