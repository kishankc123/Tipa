// Empty string means "same origin" — requests go through the Next.js
// rewrite proxy in next.config.ts, which avoids the real API's missing
// CORS headers. Set NEXT_PUBLIC_API_BASE_URL to call it directly instead
// (e.g. from a context that isn't a browser, where CORS doesn't apply).
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";
