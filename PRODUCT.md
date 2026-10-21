# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Everyone around a live poker game, with no single primary audience confirmed:

- Hosts of home games who run the game from their own phone or laptop during play: blind timer, buy-ins, rebuys, and settling up at the end.
- Clubs or venues running semi-formal events, often with a shared screen showing the timer to the room.
- Players who open the app to see results and their own history.

Use is split about evenly between phones and large screens (laptop or a display the whole table can see), so both must work as first-class.

## Product Purpose

Go Poker runs a live poker game end to end and settles the money, so nobody has to keep notes or do the maths by hand. Success means the game runs on time and everyone agrees on who owes what when it ends.

## Positioning

What sets it apart from a generic poker blind timer:

- **Settles the whole game in one place:** buy-ins, rebuys, prize pool, payout percentages, bounty, and profit/loss per player.
- **Built for Thai players:** Thai and English UI, payments by PromptPay QR, donations matched against SCB deposits.
- **Results as a shareable image:** a results summary exported as an image to post in group chats such as LINE.
- **Cash Game, Tournament, and Insurance in one app.**

## Operating Context

- Used live at the table, with its interruptions: level-up sound alerts, breaks, players busting and rebuying.
- At the end of a game the results are shared to group chats (LINE, plus Telegram and Discord integrations).
- Accounts, saved game sessions, and game history are kept on the backend (Node server + Postgres/Supabase).

## Capabilities and Constraints

- **Tournament:** blind levels (SB/BB/ante), countdown timer, automatic level progression with a sound alert, next/previous level, break mode, ranking players, payout slots by percentage, Hunter Bounty mode (bounty % and kills per player).
- **Cash Game:** player and buy-in tracking with per-player settlement.
- **Insurance:** an all-in insurance calculator (`PokerInsurance`).
- **Plans:**
  - Free: Cash Game up to 6 players, Tournament with the default blind structure only.
  - Cash Pro: unlimited Cash Game players.
  - Full Pro: everything in Cash Pro plus full Tournament (custom blinds, bounty).
  - Paid by PromptPay QR, monthly or yearly.
- **Donations:** approved automatically by matching SCB deposits; there is no slip upload.
- **Stack:** Vite + React 19 + TypeScript + styled-components, Radix Dialog/Select, lucide-react icons, html2canvas for image export; Noto Sans Thai is loaded from Google Fonts.
- **Planned, not built:** an image-export theme picker (dark, light/minimal, and a custom background uploaded under Your Account) that replaces the LINE text share, for both Cash Game and Tournament.

## Brand Commitments

- Product name: **Go Poker** (the page title; the repo is still named `poker-tournament`).
- Logo and favicon live in `public/`: `logo.webp` is what the app serves, `logo22.png` is the full-size original, plus `favicon.png`.
- Bilingual Thai/English; every user-facing string has both versions.

## Evidence on Hand

- Real product copy and plan details in `src/components/PricingModal.tsx`.
- PromptPay QR asset: `public/promptpay-qr.jpg`.
- No testimonials, user counts, or press exist. Do not invent them.

## Product Principles

1. The money must be right and visibly so: settlement figures are the product's core promise.
2. Must work mid-game: glanceable at a distance and on a phone, with minimal input while cards are in the air.
3. Thai first, without being Thai only: native Thai copy and local payments, with English kept in step.
4. The result is the share: the end-of-game summary is what spreads the product.
