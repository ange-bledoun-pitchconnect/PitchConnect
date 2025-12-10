// ============================================================================
// src/lib/api/errors.ts - Centralised API Error Handling
// ============================================================================

export class ApiError extends Error {
  status: number;
  code?: string;
  details?: Record<string, any>;

  constructor(
    status: number,
    message: string,
    options?: {
      code?: string;
      details?: Record<string, any>;
    }
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = options?.code;
    this.details = options?.details;
  }
}

export class BadRequestError extends ApiError {
  constructor(message: string, details?: Record<string, any>) {
    super(400, message, {
      code: 'BAD_REQUEST',
      details,
    });
    this.name = 'BadRequestError';
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message = 'Unauthorized') {
    super(401, message, { code: 'UNAUTHORIZED' });
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends ApiError {
  constructor(message = 'Forbidden') {
    super(403, message, { code: 'FORBIDDEN' });
    this.name = 'ForbiddenError';
  }
}

export class NotFoundError extends ApiError {
  constructor(message: string) {
    super(404, message, { code: 'NOT_FOUND' });
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends ApiError {
  constructor(message: string, details?: Record<string, any>) {
    super(409, message, {
      code: 'CONFLICT',
      details,
    });
    this.name = 'ConflictError';
  }
}

export class UnprocessableEntityError extends ApiError {
  constructor(message: string, details?: Record<string, any>) {
    super(422, message, {
      code: 'UNPROCESSABLE_ENTITY',
      details,
    });
    this.name = 'UnprocessableEntityError';
  }
}

export class InternalServerError extends ApiError {
  constructor(message = 'Internal server error', details?: Record<string, any>) {
    super(500, message, {
      code: 'INTERNAL_SERVER_ERROR',
      details,
    });
    this.name = 'InternalServerError';
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}