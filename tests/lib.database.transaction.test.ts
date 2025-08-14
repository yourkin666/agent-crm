import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DatabaseManager } from '@/lib/database';

describe('lib/database transaction', () => {
	beforeEach(() => vi.restoreAllMocks());

	it('commits on success', async () => {
		const mgr = new DatabaseManager();
		const commit = vi.fn(async () => {});
		const rollback = vi.fn(async () => {});
		const begin = vi.fn(async () => {});
		const release = vi.fn(() => {});
		const connection = {
			beginTransaction: begin,
			commit,
			rollback,
			release,
			query: vi.fn(async () => [[{ ok: 1 }]]),
			execute: vi.fn(async () => [{ affectedRows: 1, insertId: 1 }]),
		};
		(mgr as any).pool = { getConnection: async () => connection };

		const result = await mgr.transaction(async (_tx) => {
			return 'ok';
		});

		expect(result).toBe('ok');
		expect(begin).toHaveBeenCalled();
		expect(commit).toHaveBeenCalled();
		expect(rollback).not.toHaveBeenCalled();
		expect(release).toHaveBeenCalled();
	});

	it('rollbacks on error', async () => {
		const mgr = new DatabaseManager();
		const commit = vi.fn(async () => {});
		const rollback = vi.fn(async () => {});
		const begin = vi.fn(async () => {});
		const release = vi.fn(() => {});
		const connection = {
			beginTransaction: begin,
			commit,
			rollback,
			release,
			query: vi.fn(async () => [[{ ok: 1 }]]),
			execute: vi.fn(async () => [{ affectedRows: 1, insertId: 1 }]),
		};
		(mgr as any).pool = { getConnection: async () => connection };

		await expect(mgr.transaction(async () => { throw new Error('boom'); })).rejects.toThrow('boom');
		expect(begin).toHaveBeenCalled();
		expect(rollback).toHaveBeenCalled();
		expect(commit).not.toHaveBeenCalled();
		expect(release).toHaveBeenCalled();
	});
}); 