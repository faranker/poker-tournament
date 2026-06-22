import { supabase } from "./lib/supabase";
import type { User } from "@supabase/supabase-js";

export type Plan = "free" | "cash_pro" | "full_pro";

export interface AuthUser {
  id: string;
  email: string;
  username: string | null;
  plan: Plan;
  expiresAt: string | null;
}

/* ── Plan limits ──────────────────────────────────────── */
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

/* ── Internal helpers ─────────────────────────────────── */
type Subscription = { plan: Plan; expiresAt: string | null };

async function fetchSubscription(userId: string): Promise<Subscription> {
  const { data } = await supabase
    .from("subscriptions")
    .select("plan, expires_at")
    .eq("user_id", userId)
    .single();
  if (!data) return { plan: "free", expiresAt: null };
  if (data.expires_at && new Date(data.expires_at) < new Date()) {
    return { plan: "free", expiresAt: null };
  }
  return { plan: (data.plan as Plan) ?? "free", expiresAt: data.expires_at ?? null };
}

async function fetchUsername(userId: string): Promise<string | null> {
  const { data } = await supabase
    .from("profiles")
    .select("username")
    .eq("user_id", userId)
    .single();
  return data?.username ?? null;
}

async function buildAuthUser(u: User): Promise<AuthUser> {
  const [sub, username] = await Promise.all([
    fetchSubscription(u.id),
    fetchUsername(u.id),
  ]);
  return { id: u.id, email: u.email!, username, ...sub };
}

/* ── Auth functions ───────────────────────────────────── */
export async function signUp(
  email: string,
  username: string,
  password: string
): Promise<{ user: AuthUser | null; error: string | null }> {
  const clean = username.toLowerCase().trim();

  /* check username availability */
  const { data: existing } = await supabase
    .from("profiles")
    .select("user_id")
    .eq("username", clean)
    .maybeSingle();
  if (existing) return { user: null, error: "username นี้ถูกใช้แล้ว / Username already taken" };

  const { data, error } = await supabase.auth.signUp({ email: email.trim(), password });
  if (error) return { user: null, error: error.message };
  if (!data.user) return { user: null, error: "Signup failed" };

  await supabase.from("profiles").insert({
    user_id: data.user.id,
    username: clean,
    email: email.trim().toLowerCase(),
  });

  // session = null หมายความว่า Supabase รอ email confirmation ก่อน
  if (!data.session) return { user: null, error: null };

  return {
    user: { id: data.user.id, email: data.user.email!, username: clean, plan: "free", expiresAt: null },
    error: null,
  };
}

export async function signIn(
  emailOrUsername: string,
  password: string
): Promise<{ user: AuthUser | null; error: string | null }> {
  let email = emailOrUsername.trim();

  /* username → look up email */
  if (!email.includes("@")) {
    const { data } = await supabase
      .from("profiles")
      .select("email")
      .eq("username", email.toLowerCase())
      .maybeSingle();
    if (!data) return { user: null, error: "ไม่พบ username นี้ / Username not found" };
    email = data.email;
  }

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { user: null, error: "อีเมล/username หรือรหัสผ่านไม่ถูกต้อง" };
  if (!data.user) return { user: null, error: "Login failed" };

  const user = await buildAuthUser(data.user);
  return { user, error: null };
}

export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
}

export async function getSessionUser(): Promise<AuthUser | null> {
  const { data } = await supabase.auth.getSession();
  const u: User | null = data.session?.user ?? null;
  if (!u) return null;
  return buildAuthUser(u);
}

export async function resetPassword(email: string): Promise<{ error: string | null }> {
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
    redirectTo: `${window.location.origin}${import.meta.env.BASE_URL}`,
  });
  return { error: error?.message ?? null };
}

export async function checkUsername(username: string): Promise<boolean> {
  const { data } = await supabase
    .from("profiles")
    .select("user_id")
    .eq("username", username.toLowerCase().trim())
    .maybeSingle();
  return !data;
}

export async function refreshUser(userId: string): Promise<AuthUser | null> {
  const { data } = await supabase.auth.getSession();
  const u = data.session?.user;
  if (!u || u.id !== userId) return null;
  return buildAuthUser(u);
}

/* ── Export count (per user per month) ───────────────── */
const currentMonth = () => new Date().toISOString().slice(0, 7);

export async function getExportCount(userId: string): Promise<number> {
  const { data } = await supabase
    .from("export_logs")
    .select("count")
    .eq("user_id", userId)
    .eq("month", currentMonth())
    .maybeSingle();
  return data?.count ?? 0;
}

export async function incExportCount(userId: string): Promise<number> {
  const month = currentMonth();
  const current = await getExportCount(userId);
  const next = current + 1;
  await supabase.from("export_logs").upsert(
    { user_id: userId, month, count: next },
    { onConflict: "user_id,month" }
  );
  return next;
}
