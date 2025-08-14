import { describe, it, expect } from 'vitest';
import { logger, createModuleLogger, createRequestLogger, getChineseTimestamp, logDatabaseOperation, logApiRequest } from '@/lib/logger';

describe('lib/logger', () => {
	it('basic logging functions should not throw', () => {
		expect(() => logger.info({ x: 1 }, 'test')).not.toThrow();
		const mod = createModuleLogger('x');
		expect(() => mod.debug('ok')).not.toThrow();
		const req = createRequestLogger('rid');
		expect(() => req.warn('warn')).not.toThrow();
	});

	it('getChineseTimestamp returns formatted string', () => {
		const ts = getChineseTimestamp(new Date('2024-01-02T03:04:05.006Z'));
		expect(ts).toMatch(/年.*月.*日/);
	});

	it('log helpers should not throw', () => {
		expect(() => logDatabaseOperation('query', 'tbl', 10)).not.toThrow();
		expect(() => logApiRequest('GET', '/api/x', 200, 5)).not.toThrow();
	});
}); 