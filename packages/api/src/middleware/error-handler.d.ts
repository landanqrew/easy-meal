import type { Context, Next } from 'hono';
export declare function errorHandler(c: Context, next: Next): Promise<(Response & import("hono").TypedResponse<{
    stack?: string | undefined;
    error: string;
}, any, "json">) | undefined>;
export declare function rateLimit(options: {
    windowMs: number;
    max: number;
}): (c: Context, next: Next) => Promise<(Response & import("hono").TypedResponse<{
    error: string;
}, 429, "json">) | undefined>;
//# sourceMappingURL=error-handler.d.ts.map