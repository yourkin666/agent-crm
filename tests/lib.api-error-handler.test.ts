import { describe, it, expect } from 'vitest';
import { NextResponse } from 'next/server';
import {
	ApiError,
	ApiErrorType,
	createErrorResponse,
	createSuccessResponse,
	withErrorHandler,
	createValidationError,
	createNotFoundError,
	createDuplicateError,
	createDatabaseError,
} from '@/lib/api-error-handler';

function getJson(res: NextResponse) {
	return res.json();
}

describe('lib/api-error-handler', () => {
	it('ApiError basic', () => {
		const err = new ApiError(ApiErrorType.NOT_FOUND, '不存在', 404, { a: 1 });
		expect(err.type).toBe(ApiErrorType.NOT_FOUND);
		expect(err.statusCode).toBe(404);
		expect(err.details).toEqual({ a: 1 });
	});

	it('createErrorResponse from ApiError', async () => {
		const res = createErrorResponse(new ApiError(ApiErrorType.VALIDATION_ERROR, '校验失败', 400, { field: 'x' }));
		const body = await getJson(res);
		expect(res.status).toBe(400);
		expect(body.success).toBe(false);
		expect(body.errorType).toBe(ApiErrorType.VALIDATION_ERROR);
		expect(body.details).toEqual({ field: 'x' });
	});

	it('createErrorResponse from native Error', async () => {
		const res = createErrorResponse(new Error('boom'), 500, { x: 1 });
		const body = await getJson(res);
		expect(res.status).toBe(500);
		expect(body.error).toBe('boom');
		expect(body.errorType).toBe(ApiErrorType.INTERNAL_ERROR);
		expect(body.details).toEqual({ x: 1 });
	});

	it('createSuccessResponse', async () => {
		const res = createSuccessResponse({ ok: 1 }, '成功', 201);
		const body = await getJson(res);
		expect(res.status).toBe(201);
		expect(body.success).toBe(true);
		expect(body.message).toBe('成功');
		expect(body.data).toEqual({ ok: 1 });
	});

	it('withErrorHandler returns success or maps errors', async () => {
		const handlerOk = withErrorHandler(async () => createSuccessResponse({ a: 1 }));
		const resOk = (await handlerOk({} as any)) as NextResponse;
		const bodyOk = await getJson(resOk);
		expect(bodyOk.success).toBe(true);

		const handlerApiErr = withErrorHandler(async () => { throw createValidationError('bad'); });
		const resApi = (await handlerApiErr({} as any)) as NextResponse;
		const bodyApi = await getJson(resApi);
		expect(resApi.status).toBe(400);
		expect(bodyApi.errorType).toBe(ApiErrorType.VALIDATION_ERROR);

		const handlerNative = withErrorHandler(async () => { throw new Error('UNIQUE constraint failed foo'); });
		const resNative = (await handlerNative({} as any)) as NextResponse;
		const bodyNative = await getJson(resNative);
		expect(resNative.status).toBe(400);
		expect(bodyNative.errorType).toBe(ApiErrorType.DUPLICATE_RESOURCE);
	});

	it('helper error creators', () => {
		expect(createValidationError('x').type).toBe(ApiErrorType.VALIDATION_ERROR);
		expect(createNotFoundError('资源').type).toBe(ApiErrorType.NOT_FOUND);
		expect(createDuplicateError('资源').type).toBe(ApiErrorType.DUPLICATE_RESOURCE);
		expect(createDatabaseError('操作').type).toBe(ApiErrorType.DATABASE_ERROR);
	});
}); 