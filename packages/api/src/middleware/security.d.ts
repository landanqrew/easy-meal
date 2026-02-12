import type { Context, Next } from 'hono';
export declare function securityHeaders(c: Context, next: Next): Promise<void>;
export declare function requestSizeLimit(maxBytes: number): (c: Context, next: Next) => Promise<(Response & import("hono").TypedResponse<{
    error: string;
}, 413, "json">) | undefined>;
export declare function sanitizeString(input: string): string;
export declare function sanitizeEmail(email: string): string;
export declare function isValidUUID(id: string): boolean;
//# sourceMappingURL=security.d.ts.map