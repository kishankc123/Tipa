import { NextRequest, NextResponse } from "next/server";
import {
  CopilotRuntime,
  OpenAIAdapter,
  copilotRuntimeNextJSAppRouterEndpoint,
} from "@copilotkit/runtime";

// CopilotKit runtime for the inventory assistant. It only talks to the LLM;
// every inventory lookup happens in the browser via the `useCopilotAction`
// handlers in src/components/copilot/inventory-assistant.tsx, which call
// src/lib/api.ts (and so apiFetch) with the user's own JWT. The LLM never
// sees credentials and this route never touches the Django API on the
// assistant's behalf.
const REAL_API_ORIGIN =
  process.env.API_UPSTREAM_ORIGIN ?? "https://ims-v2.codex.com.np";

// This route spends LLM credits, so don't leave it open to anonymous
// callers: the client sends the user's JWT (see CopilotProvider) and we
// check it against the same whoami endpoint the app itself uses.
async function hasValidSession(request: NextRequest): Promise<boolean> {
  const authorization = request.headers.get("authorization");
  if (!authorization) return false;
  try {
    const res = await fetch(`${REAL_API_ORIGIN}/api/system/auth/whoami/`, {
      headers: { authorization },
    });
    return res.ok;
  } catch {
    return false;
  }
}

// The provider wraps the whole app (including /login), so CopilotKit sends
// a metadata probe — `{ method: "info" }` — even when signed out. That
// carries no LLM spend and only lists agent names, so let it through
// instead of logging a 401 on the login page. Anything we can't positively
// identify as that probe is treated as protected.
async function isInfoProbe(request: NextRequest): Promise<boolean> {
  try {
    const body = await request.clone().json();
    return body?.method === "info";
  } catch {
    return false;
  }
}

const runtime = new CopilotRuntime();
const serviceAdapter = new OpenAIAdapter({
  // Optional override; falls back to the adapter's default model.
  model: process.env.OPENAI_MODEL || undefined,
});

const { handleRequest } = copilotRuntimeNextJSAppRouterEndpoint({
  runtime,
  serviceAdapter,
  endpoint: "/api/copilotkit",
});

const MISSING_KEY_MESSAGE =
  "OPENAI_API_KEY is not set. Copy .env.local.example to .env.local, add your key, and restart the dev server (Next only reads env files at startup).";
let warnedAboutMissingKey = false;

export async function POST(request: NextRequest) {
  // Checked for every request, including the info probe: without a key the
  // OpenAI client can't be constructed, so the runtime would quietly
  // register zero agents and the browser would only see the cryptic
  // "Agent 'default' not found". Fail with the real cause instead.
  if (!process.env.OPENAI_API_KEY) {
    if (!warnedAboutMissingKey) {
      warnedAboutMissingKey = true;
      console.error(`[copilotkit] ${MISSING_KEY_MESSAGE}`);
    }
    return NextResponse.json({ error: MISSING_KEY_MESSAGE }, { status: 503 });
  }
  if (!(await isInfoProbe(request)) && !(await hasValidSession(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return handleRequest(request);
}
