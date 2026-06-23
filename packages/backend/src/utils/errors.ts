export class ApiError extends Error {
  statusCode: number;
  code?: string;
  details?: unknown;

  constructor(statusCode: number, message: string, code?: string, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

export const badRequest = (msg: string, code?: string, details?: unknown) =>
  new ApiError(400, msg, code, details);
export const unauthorized = (msg = 'Unauthorized', code?: string) => new ApiError(401, msg, code);
export const forbidden = (msg = 'Forbidden', code?: string) => new ApiError(403, msg, code);
export const notFound = (msg = 'Not found', code?: string) => new ApiError(404, msg, code);
export const conflict = (msg: string, code?: string) => new ApiError(409, msg, code);
export const tooMany = (msg = 'Too many requests', code = 'RATE_LIMITED') =>
  new ApiError(429, msg, code);
