import { describe, it, expect } from 'vitest';
import {
	formatPhoneNumber,
	formatCurrency,
	formatDate,
	formatDateTime,
	formatMoney,
	parseRoomTags,
	formatRoomTagsByString,
	formatRequirementByString,
	validatePhone,
	validatePriceRange,
	parsePriceRange,
	formatCreator,
	safeParseJSON,
	generateId,
	deepClone,
	isEmpty,
	parseBusinessTypes,
	parseRoomTypes,
	formatBusinessTypes,
	formatRoomTypesDisplay,
	formatPriceRange as formatPriceRangeText,
} from '@/utils/helpers';

describe('utils/helpers', () => {
	it('formatPhoneNumber', () => {
		expect(formatPhoneNumber('13800138000')).toBe('138****8000');
		expect(formatPhoneNumber('')).toBe('');
		expect(formatPhoneNumber('123')).toBe('123');
	});

	it('formatCurrency', () => {
		expect(formatCurrency(0)).toBe('¥0');
		expect(formatCurrency(1234.5)).toBe('¥1,234.50');
	});

	it('formatDate & formatDateTime', () => {
		const d = new Date('2024-01-02T03:04:05Z');
		expect(formatDate(d)).toMatch(/^2024-01-0?2/);
		expect(formatDateTime(d)).toMatch(/^2024-01-0?2/);
	});

	it('formatMoney', () => {
		expect(formatMoney(0)).toBe('0元');
		expect(formatMoney(12345)).toBe('12,345元');
	});

	it('parseRoomTags & formatRoomTagsByString', () => {
		expect(parseRoomTags(null)).toEqual([]);
		expect(parseRoomTags('["loft","flat"]')).toEqual(['loft', 'flat']);
		expect(parseRoomTags('bad json')).toEqual([]);
		expect(formatRoomTagsByString(['loft', 'flat'])).toContain('loft');
	});

	it('formatRequirementByString', () => {
		const text = formatRequirementByString('whole_rent', 'one_bedroom', ['loft']);
		expect(text).toContain('整租');
		expect(text).toContain('一居室');
	});

	it('validatePhone & price range', () => {
		expect(validatePhone('13800138000')).toBe(true);
		expect(validatePhone('110')).toBe(false);
		expect(validatePriceRange('5000-8000')).toBe(true);
		expect(validatePriceRange('5000-')).toBe(false);
		expect(parsePriceRange('5000-8000')).toEqual({ min: 5000, max: 8000 });
	});

	it('formatCreator', () => {
		expect(formatCreator('张三', true)).toBe('[人工] 张三');
		expect(formatCreator('系统', false)).toBe('[agent] 系统');
	});

	it('safeParseJSON', () => {
		expect(safeParseJSON(null, { a: 1 })).toEqual({ a: 1 });
		expect(safeParseJSON('{"x":1}', { a: 1 })).toEqual({ x: 1 });
		expect(safeParseJSON('bad', { a: 1 })).toEqual({ a: 1 });
	});

	it('generateId uniqueness', () => {
		const a = generateId();
		const b = generateId();
		expect(a).not.toBe(b);
		expect(a).toMatch(/^[a-z0-9]+$/i);
	});

	it('deepClone & isEmpty', () => {
		const obj = { a: 1, b: { c: 2 }, d: [1, 2] };
		const cloned = deepClone(obj);
		expect(cloned).toEqual(obj);
		(cloned.b as any).c = 3;
		expect(obj.b.c).toBe(2);
		expect(isEmpty('')).toBe(true);
		expect(isEmpty('a')).toBe(false);
		expect(isEmpty([])).toBe(true);
		expect(isEmpty({})).toBe(true);
	});

	it('parseBusinessTypes/parseRoomTypes & formatters', () => {
		expect(parseBusinessTypes(null)).toEqual([]);
		expect(parseBusinessTypes('["whole_rent","shared_rent"]')).toEqual(['whole_rent', 'shared_rent']);
		expect(parseBusinessTypes('whole_rent')).toEqual(['whole_rent']);
		expect(parseRoomTypes('["one_bedroom","two_bedroom"]')).toEqual(['one_bedroom', 'two_bedroom']);
		expect(formatBusinessTypes(['whole_rent'] as any)).toContain('整租');
		expect(formatRoomTypesDisplay(['one_bedroom'] as any)).toContain('一居室');
	});

	it('formatPriceRange text', () => {
		expect(formatPriceRangeText()).toBe('');
		expect(formatPriceRangeText(3000, 5000)).toBe('3,000-5,000元');
		expect(formatPriceRangeText(3000)).toBe('3,000元起');
		expect(formatPriceRangeText(undefined, 5000)).toBe('5,000元以下');
	});
}); 