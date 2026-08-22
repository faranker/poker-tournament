const { query } = require("../db");

const PLAN_NAMES  = { cash_pro: "Cash Pro", full_pro: "Full Pro" };
const PLAN_MONTHS = { monthly: 1, yearly: 12 };

/**
 * Approves an already-fetched payment_requests row: upserts the user's
 * subscription and marks the row approved. Shared by three call sites —
 * the manual admin `/payments/approve/:id`, the Telegram inline-button
 * handler, and the SCB-deposit auto-approve webhook — which previously had
 * two independently written (and already diverged) copies of this logic.
 *
 * 2026-08-23 fix: this used to always compute expiry from `now()`,
 * discarding any remaining time on the current subscription — a real user
 * with ~800 days left renewed for 30 more and ended up with only 30,
 * instead of ~830. Renewal must EXTEND from the existing `expires_at` when
 * it's still in the future (this is what telegram-webhook.js's original
 * inline copy did, before the two copies were consolidated here — that
 * consolidation picked the wrong one of the two diverged behaviors).
 */
async function approvePaymentRequest(pr, { matchedTransactionKey = null } = {}) {
  const months = PLAN_MONTHS[pr.billing_cycle] || 1;

  const { rows: subRows } = await query(
    "select expires_at from subscriptions where user_id=$1",
    [pr.user_id]
  );
  const existing = subRows[0]?.expires_at;
  const base = existing && new Date(existing) > new Date() ? new Date(existing) : new Date();
  const expiresAt = new Date(base);
  expiresAt.setMonth(expiresAt.getMonth() + months);

  await query(
    `insert into subscriptions (user_id, plan, expires_at)
     values ($1, $2, $3)
     on conflict (user_id) do update set plan=$2, expires_at=$3, updated_at=now()`,
    [pr.user_id, pr.plan, expiresAt]
  );
  await query(
    `update payment_requests
        set status='approved', approved_at=now(), matched_transaction_key=$2
      where id=$1`,
    [pr.id, matchedTransactionKey]
  );

  return { expiresAt, planName: PLAN_NAMES[pr.plan] || pr.plan };
}

module.exports = { approvePaymentRequest, PLAN_NAMES, PLAN_MONTHS };
