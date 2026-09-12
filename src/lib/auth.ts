import { API_BASE_URL } from "@/lib/config";
import { extractErrorMessage } from "@/lib/api-client";

const ACCESS_TOKEN_KEY = "tipa.accessToken";
const REFRESH_TOKEN_KEY = "tipa.refreshToken";

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface AuthUser {
  id: number;
  email: string;
  username: string;
  business_name: string | null;
}

export interface LoginResult {
  tokens: AuthTokens;
  user: AuthUser;
}

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setTokens(tokens: AuthTokens) {
  window.localStorage.setItem(ACCESS_TOKEN_KEY, tokens.access);
  window.localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refresh);
}

export function clearTokens() {
  window.localStorage.removeItem(ACCESS_TOKEN_KEY);
  window.localStorage.removeItem(REFRESH_TOKEN_KEY);
}

export function isAuthenticated(): boolean {
  return Boolean(getAccessToken());
}

/** POST /api/system/auth/login/ */
export async function login(
  emailOrUsername: string,
  password: string
): Promise<LoginResult> {
  const res = await fetch(`${API_BASE_URL}/api/system/auth/login/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email_or_username: emailOrUsername,
      password,
    }),
  });

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(
      extractErrorMessage(data, "Login failed. Check your credentials.")
    );
  }

  setTokens(data.tokens);
  return data as LoginResult;
}

export interface RegisterInput {
  email: string;
  username: string;
  businessName: string;
  contactNumber?: string;
  address?: string;
  password: string;
  confirmPassword: string;
}

/**
 * POST /api/system/auth/register/ — returns only a success message, not
 * tokens, so the caller still has to redirect to /login afterward.
 */
export async function register(input: RegisterInput): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/api/system/auth/register/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: input.email,
      username: input.username,
      business_name: input.businessName,
      contact_number: input.contactNumber || undefined,
      address: input.address || undefined,
      password: input.password,
      confirm_password: input.confirmPassword,
    }),
  });

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(extractErrorMessage(data, "Registration failed."));
  }
}

/** GET /api/system/auth/logout/ */
export async function logout(): Promise<void> {
  const token = getAccessToken();
  clearTokens();
  if (!token) return;
  try {
    await fetch(`${API_BASE_URL}/api/system/auth/logout/`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch {
    // Best-effort: tokens are already cleared client-side.
  }
}
