import { API_BASE_URL } from "@/lib/config";
import { clearTokens, getAccessToken } from "@/lib/auth";

export class ApiError extends Error {
  status: number;
  body: unknown;

  constructor(status: number, message: string, body: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

export function extractErrorMessage(body: unknown, fallback: string): string {
  if (body && typeof body === "object") {
    const record = body as Record<string, unknown>;
    if (typeof record.detail === "string") return record.detail;
    if (typeof record.message === "string") return record.message;
    // DRF validation errors: { field: ["message"] }
    const firstArray = Object.values(record).find(
      (v) => Array.isArray(v) && typeof v[0] === "string"
    ) as string[] | undefined;
    if (firstArray) return firstArray[0];
  }
  return fallback;
}

/**
 * Thin fetch wrapper for the real IMS API: prepends the base URL, attaches
 * the JWT access token, and normalizes error handling. On a 401 it clears
 * stored tokens and redirects to /login, since this API has no refresh
 * endpoint to fall back to.
 */
export async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getAccessToken();
  const isFormData = options.body instanceof FormData;
  const headers: Record<string, string> = {
    ...(isFormData ? {} : { "Content-Type": "application/json" }),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...((options.headers as Record<string, string>) ?? {}),
  };

  const res = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });

  if (res.status === 401) {
    clearTokens();
    if (typeof window !== "undefined") {
      // Plain module function, not a component — no useRouter available here.
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.href = "/login";
    }
    throw new ApiError(401, "Session expired. Please log in again.", null);
  }

  if (res.status === 204) {
    return undefined as T;
  }

  const body = await res.json().catch(() => null);

  if (!res.ok) {
    throw new ApiError(res.status, extractErrorMessage(body, "Request failed"), body);
  }

  return body as T;
}
