const API = import.meta.env.VITE_API_URL as string;

/* ── Token storage ────────────────────────────────────── */
const TOKEN_KEY = "poker_token";
const getToken  = () => localStorage.getItem(TOKEN_KEY);
const setToken  = (t: string) => localStorage.setItem(TOKEN_KEY, t);
const clearToken = () => localStorage.removeItem(TOKEN_KEY);

async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const res = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data as T;
}

/* ── Types ────────────────────────────────────────────── */
export type Plan = "free" | "cash_pro" | "full_pro";

export interface AuthUser {
  id: string;
  email: string;
  username: string | null;
  plan: Plan;
  expiresAt: string | null;
}

/* ── Plan config ──────────────────────────────────────── */
export const FREE_MAX_PLAYERS = 6;
export const FREE_MAX_EXPORTS = 3;

export const PLAN_LABELS: Record<Plan, string> = {
  free:      "Free Trial",
  cash_pro:  "Cash Pro · 49฿/mo",
  full_pro:  "Full Pro · 99฿/mo",
};

export const PLAN_COLORS: Record<Plan, string> = {
  free:      "#7878a8",
  cash_pro:  "#3b82f6",
  full_pro:  "#d4af37",
};

/* ── Auth functions ───────────────────────────────────── */
export async function signUp(
  email: string,
  username: string,
  password: string
): Promise<{ user: AuthUser | null; error: string | null }> {
  try {
    const { token, user } = await apiFetch<{ token: string; user: AuthUser }>(
      "/auth/register",
      { method: "POST", body: JSON.stringify({ email, username, password }) }
    );
    setToken(token);
    return { user, error: null };
  } catch (e) {
    return { user: null, error: (e as Error).message };
  }
}

export async function signIn(
  identifier: string,
  password: string
): Promise<{ user: AuthUser | null; error: string | null }> {
  try {
    const { token, user } = await apiFetch<{ token: string; user: AuthUser }>(
      "/auth/login",
      { method: "POST", body: JSON.stringify({ identifier, password }) }
    );
    setToken(token);
    return { user, error: null };
  } catch (e) {
    return { user: null, error: (e as Error).message };
  }
}

export async function signOut(): Promise<void> {
  clearToken();
}

export async function getSessionUser(): Promise<AuthUser | null> {
  if (!getToken()) return null;
  try {
    const { user } = await apiFetch<{ user: AuthUser }>("/auth/me");
    return user;
  } catch {
    clearToken();
    return null;
  }
}

export async function resetPassword(email: string): Promise<{ error: string | null }> {
  try {
    await apiFetch("/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
    return { error: null };
  } catch (e) {
    return { error: (e as Error).message };
  }
}

export async function checkUsername(username: string): Promise<boolean> {
  try {
    const { available } = await apiFetch<{ available: boolean }>(
      "/auth/check-username",
      { method: "POST", body: JSON.stringify({ username }) }
    );
    return available;
  } catch {
    return false;
  }
}

export async function refreshUser(userId: string): Promise<AuthUser | null> {
  if (!getToken()) return null;
  try {
    const { user } = await apiFetch<{ user: AuthUser }>("/auth/me");
    if (user.id !== userId) return null;
    return user;
  } catch {
    return null;
  }
}

/* ── Export count (per user per month) ───────────────── */
export async function getExportCount(_userId: string): Promise<number> {
  try {
    const { count } = await apiFetch<{ count: number }>("/exports/count");
    return count;
  } catch {
    return 0;
  }
}

export async function incExportCount(_userId: string): Promise<number> {
  try {
    await apiFetch("/exports", { method: "POST", body: JSON.stringify({ mode: "export" }) });
    return await getExportCount(_userId);
  } catch {
    return 0;
  }
}
