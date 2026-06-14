import { NextResponse } from "next/server";

export type ApiErrorCode =
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "BAD_REQUEST"
  | "CONFLICT"
  | "INTERNAL_ERROR"
  | "TOKEN_EXPIRED"
  | "TOKEN_INVALID"
  | "RATE_LIMITED";

export interface ApiError {
  error: {
    code: ApiErrorCode;
    message: string;
    details?: unknown;
  };
}

export function apiError(
  code: ApiErrorCode,
  message: string,
  status: number,
  details?: unknown
): NextResponse<ApiError> {
  return NextResponse.json(
    { error: { code, message, details } },
    { status }
  );
}

export function unauthorized(message = "Authentication required") {
  return apiError("UNAUTHORIZED", message, 401);
}

export function forbidden(message = "Insufficient permissions") {
  return apiError("FORBIDDEN", message, 403);
}

export function notFound(message = "Resource not found") {
  return apiError("NOT_FOUND", message, 404);
}

export function badRequest(message: string, details?: unknown) {
  return apiError("BAD_REQUEST", message, 400, details);
}

export function internalError(message = "Internal server error") {
  return apiError("INTERNAL_ERROR", message, 500);
}
