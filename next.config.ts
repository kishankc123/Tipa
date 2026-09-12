import type { NextConfig } from "next";

// Requests to the real IMS API (https://ims-v2.codex.com.np) are proxied
// through src/app/api/system/[...path]/route.ts rather than a `rewrites()`
// passthrough — see that file for why (CORS + Django's CSRF Origin check).
const nextConfig: NextConfig = {};

export default nextConfig;
