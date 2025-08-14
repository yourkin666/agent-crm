import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as dbModule from '@/lib/database';

// 这里不连接真实 MySQL，仅验证方法存在与可调用（通过 spy/mock 简单返回）

describe('lib/database (smoke)', () => {
	beforeEach(() => vi.restoreAllMocks());

	it('healthCheck returns boolean', async () => {
		const mgr = new dbModule.DatabaseManager();
		// 暂时通过 monkey patch 内部 pool 行为
		(mgr as any).pool = {
			getConnection: async () => ({ ping: async () => {}, release: () => {} }),
		};
		const ok = await mgr.healthCheck();
		expect(typeof ok).toBe('boolean');
	});

	it('queryOne and execute mocked', async () => {
		const mgr = new dbModule.DatabaseManager();
		(mgr as any).pool = {
			query: async () => [[{ id: 1 }]],
			execute: async () => [{ affectedRows: 1, insertId: 9 }],
			getConnection: async () => ({ ping: async () => {}, release: () => {} }),
		};
		const row = await mgr.queryOne('select 1');
		expect(row).toEqual({ id: 1 });
		const res = await mgr.execute('insert');
		expect(res.lastInsertRowid).toBe(9);
	});
}); 