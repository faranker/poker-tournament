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
 * Canonicalizes on `/payments/approve/:id`'s existing semantics: expiry is
 * always computed from `now()`, not extended from any existing
 * `subscriptions.expires_at`. The Telegram handler's inline copy used to
 * extend from the existing expiry if still active — that behavior is
 * dropped here in favor of one consistent rule across all three paths.
 */
async function approvePaymentRequest(pr, { matchedTransactionKey = null } = {}) {
  const months = PLAN_MONTHS[pr.billing_cycle] || 1;
  const expiresAt = new Date();
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
