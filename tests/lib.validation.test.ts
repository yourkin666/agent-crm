import { describe, it, expect } from 'vitest';
import {
	validatePhoneNumber,
	validateNumberRange,
	validateStringLength,
	validateCustomerData,
	validateViewingRecordData,
} from '@/lib/validation';
import { ApiError } from '@/lib/api-error-handler';

describe('lib/validation', () => {
	it('validatePhoneNumber', () => {
		expect(() => validatePhoneNumber('13800138000')).not.toThrow();
		expect(() => validatePhoneNumber('110')).toThrow(ApiError);
	});

	it('validateNumberRange', () => {
		expect(() => validateNumberRange(5, 1, 10, 'x')).not.toThrow();
		expect(() => validateNumberRange(0, 1, 10, 'x')).toThrow(ApiError);
	});

	it('validateStringLength', () => {
		expect(() => validateStringLength('abc', 5, 'x')).not.toThrow();
		expect(() => validateStringLength('abcdef', 5, 'x')).toThrow(ApiError);
	});

	it('validateCustomerData', () => {
		expect(() => validateCustomerData({
			phone: '13800138000',
			status: 3,
			name: '张三',
			community: '万科',
		})).not.toThrow();

		expect(() => validateCustomerData({ phone: '110' })).toThrow(ApiError);
		expect(() => validateCustomerData({ status: 6 })).toThrow(ApiError);
	});

	it('validateViewingRecordData', () => {
		expect(() => validateViewingRecordData({
			commission: 1000,
			viewing_status: 2,
			viewing_feedback: 0,
			property_name: 'xx',
		})).not.toThrow();

		expect(() => validateViewingRecordData({ commission: -1 })).toThrow(ApiError);
		expect(() => validateViewingRecordData({ viewing_status: 5 })).toThrow(ApiError);
		expect(() => validateViewingRecordData({ viewing_feedback: 2 })).toThrow(ApiError);
	});
}); 