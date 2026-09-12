import { NextRequest, NextResponse } from "next/server";

// Proxies /api/system/* to the real IMS API from the server, not the
// browser. A Next.js `rewrites()` passthrough forwards the browser's
// Origin header along with the request, which trips Django's CSRF
// Origin-checking middleware ("does not match any trusted origins").
// A route handler makes its own outbound fetch instead, so the upstream
// only ever sees this server as the caller — and, as a side effect, this
// is also what avoids the browser's CORS restriction in the first place
// (see src/lib/config.ts).
const REAL_API_ORIGIN =
  process.env.API_UPSTREAM_ORIGIN ?? "https://ims-v2.codex.com.np";

async function proxy(request: NextRequest, path: string[]) {
  const { search } = new URL(request.url);
  const targetUrl = `${REAL_API_ORIGIN}/api/system/${path.join("/")}/${search}`;

  const headers = new Headers();
  const authorization = request.headers.get("authorization");
  if (authorization) headers.set("authorization", authorization);
  const contentType = request.headers.get("content-type");
  if (contentType) headers.set("content-type", contentType);

  const init: RequestInit = { method: request.method, headers };
  if (request.method !== "GET" && request.method !== "HEAD") {
    init.body = await request.arrayBuffer();
  }

  const upstreamResponse = await fetch(targetUrl, init);
  const body = await upstreamResponse.arrayBuffer();

  return new NextResponse(body, {
    status: upstreamResponse.status,
    headers: {
      "content-type":
        upstreamResponse.headers.get("content-type") ?? "application/json",
    },
  });
}

type RouteParams = { params: Promise<{ path: string[] }> };

export async function GET(request: NextRequest, { params }: RouteParams) {
  return proxy(request, (await params).path);
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  return proxy(request, (await params).path);
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  return proxy(request, (await params).path);
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  return proxy(request, (await params).path);
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  return proxy(request, (await params).path);
}
