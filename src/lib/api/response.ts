/**
 * 🌟 PITCHCONNECT - Standardized API Responses
 * Path: /src/lib/api/response.ts
 *
 * Ensures all API responses follow consistent structure
 */

import { NextResponse } from 'next/server';

/**
 * Success Response Structure
 */
export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  meta?: {
    timestamp: string;
    requestId?: string;
    version?: string;
  };
}

/**
 * Create Success Response
 */
export function createSuccessResponse<T>(
  data: T,
  statusCode: number = 200,
  requestId?: string
): NextResponse<ApiSuccessResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
      meta: {
        timestamp: new Date().toISOString(),
        ...(requestId && { requestId }),
      },
    },
    { status: statusCode }
  );
}

/**
 * Success Response Helpers
 */
export const ApiResponse = {
  /**
   * 200 OK
   */
  ok<T>(data: T, requestId?: string) {
    return createSuccessResponse(data, 200, requestId);
  },

  /**
   * 201 Created
   */
  created<T>(data: T, requestId?: string) {
    return createSuccessResponse(data, 201, requestId);
  },

  /**
   * 202 Accepted
   */
  accepted<T>(data: T, requestId?: string) {
    return createSuccessResponse(data, 202, requestId);
  },

  /**
   * 204 No Content
   */
  noContent() {
    return new NextResponse(null, { status: 204 });
  },
};
