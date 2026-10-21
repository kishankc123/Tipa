"use client";

import { CopilotKit } from "@copilotkit/react-core";

import { getAccessToken } from "@/lib/auth";

// Resolved by CopilotKit on every request (not once at mount), so a token
// from a login that happens after this provider mounts is still picked up.
function authHeaders(): Record<string, string> {
  const token = getAccessToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function CopilotProvider({ children }: { children: React.ReactNode }) {
  return (
    <CopilotKit
      runtimeUrl="/api/copilotkit"
      headers={authHeaders}
      // Our route is a single POST endpoint; skips the GET /info probe (404).
      useSingleEndpoint
      // The floating dev inspector would sit on top of the dashboard.
      enableInspector={false}
    >
      {children}
    </CopilotKit>
  );
}
