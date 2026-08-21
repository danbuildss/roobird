# Roobird — Session Memory

Read this at the start of every session. Never ask the user to re-explain things already here.

---

## What it is

An open market network for tokenized stocks, designed for both humans and autonomous agents.

- Humans access via consumer web app at roobird.vercel.app
- Agents access programmatically via MCP (planned) and REST API (`/api/v1/`)
- Roobird provides discovery, intelligence, social and coordination layer
- Trading/execution handled by integrated third-party partners (Bankr for V1)
- **Not a brokerage.** No order routing, no portfolio state, no custody.

## Positioning

> "A market intelligence product that gets better as humans and agents participate."

Information Architecture: Reddit-inspired IA applied to financial markets. Asset pages = communities. Posts = theses/research/questions. Voting determines sort order. No Reddit terminology.

---

## Tech Stack (verified against package.json)

| Layer | Choice |
|---|---|
| Frontend | Next.js 16.3.1 (App Router), TypeScript |
| Styling | Tailwind CSS, shadcn/ui, Lucide icons |
| Database | PostgreSQL via Supabase |
| Auth | Privy (`@privy-io/react-auth` v3.37.4) + AuthSessionBridge → Supabase |
| Market data | Robinhood Stock Token API (public, no auth) |
| Blockchain | Robinhood Chain (chain ID 4663), viem v2 |
| AI / Sentiment | Grok API (`grok-3` + `web_search`) via `XAI_API_KEY` |
| Hosting | Vercel (auto-deploy from main) |
| Scheduler | cron-job.org (external, calls `/api/v1/sync` every 15 min) |

---

## Auth Architecture (important — two-layer)

Roobird uses **Privy** for user-facing sign-in (email, Twitter, wallet) and **Supabase Auth** for server-side session verification. These are bridged:

1. User signs in via Privy modal
2. `AuthSessionBridge` (`src/components/providers/AuthSessionBridge.tsx`) fires on login
3. It fetches a Privy access token and POSTs to `/api/auth/privy/session`
4. That endpoint verifies the Privy token and establishes a Supabase session
5. All API routes then use `supabase.auth.getUser()` which works because the session is established
6. `SyncOnLogin` (`src/components/providers/PrivyProvider.tsx`) also fires on Twitter login and syncs `avatar_url` + `username` to the `users` table via `POST /api/v1/me/sync`

**Critical:** Without the bridge session, API writes fail with 401 even though Privy shows the user as authenticated.

Auth routes:
- `POST /api/auth/privy/session` — Privy token → Supabase session
- `POST /api/auth/signout` — sign out
- `GET/POST /api/auth/siwe` — SIWE wallet sign-in (legacy, still present)
- `GET /api/auth/callback` — OAuth callback

---

## Robinhood Stock Token API

Base URL: `https://api.robinhood.com/rhj/`
No API key or auth required. Public, read-only.

```
GET /assets              — full list of Stock Tokens (assets[])
GET /prices/{symbol}     — live bid/ask (quotes[])
GET /corporate-actions   — splits and dividends
```

**Critical parsing notes (fixed in PR #19):**
- Response is `assets[]` not `results[]`
- Fields: `tokenSymbol`, `tokenName`, not snake_case
- Prices in `quotes[]` not a flat object
- Price = `(bid + ask) / 2` (midpoint)
- Robinhood Chain deployment selected by `chain_id === 4663`

Docs: https://docs.robinhood.com/chain/stock-token-apis/

---

## API Routes (actual, as of PR #24)

All routes under `/api/v1/`. Response envelope: `{ data: ..., error: null }` / `{ data: null, error: { code, message, status } }`.

| Route | Methods | Notes |
|---|---|---|
| `/api/v1/assets` | GET | List/search assets. `limit` up to 500, `search` param. |
| `/api/v1/assets/[symbol]` | GET | Single asset by symbol (returns id for buy flow). |
| `/api/v1/prices/[symbol]` | GET | Live price: Robinhood + Supabase `change_24h` enrichment. |
| `/api/v1/prices/batch` | GET | `?symbols=NVDA,AAPL,...` up to 500. Single Supabase enrichment query. |
| `/api/v1/theses` | GET, POST | GET: joined asset+user. POST: `{ asset_id, title, body, stance }`. `body` optional, stances: bullish/bearish/neutral/research/question. |
| `/api/v1/theses/[id]` | GET | Single thesis. |
| `/api/v1/comments` | GET, POST | Threaded comments. |
| `/api/v1/agents` | GET, POST | Agent profiles. |
| `/api/v1/bookmarks` | GET, POST, DELETE | List mode: `?target_type=asset` → `{ assets: [] }`. Check mode: `?target_type=asset&target_id=<uuid>` → `{ bookmarked: bool }`. |
| `/api/v1/pulse` | GET | List `market_pulse` rows with `updated_at > epoch`. `limit` max 20. |
| `/api/v1/pulse/[symbol]` | GET | Per-symbol Grok sentiment. Stale-while-revalidate (3 min). Fires background refresh via `after()`. |
| `/api/v1/events` | GET | Market events feed. |
| `/api/v1/sync` | POST, GET | Cron endpoint. Auth: `Authorization: Bearer <SYNC_SECRET>`. Upserts assets + prices from Robinhood. Writes to `sync_runs`. |
| `/api/v1/me/sync` | POST | Syncs `avatar_url` + `username` from Privy Twitter to Supabase `users` table. Called on login. |
| `/api/v1/users/[username]` | GET | Public user profile by username. |
| `/api/v1/api-keys` | GET, POST, DELETE | Agent API key management. |
| `/api/v1/notifications` | GET | User notifications. |
| `/api/v1/execution-intents` | GET, POST | Buy flow. POST validates asset/wallet/provider, creates intent, returns handoff URL. |
| `/api/v1/execution-intents/[id]` | GET | Intent status. Owner-scoped. |

---

## Pages (actual)

| Route | Description |
|---|---|
| `/` | Public landing page. Live ticker strip (8 symbols, 15s refresh). Discussion feed. |
| `/explore` | Personalized feed. Moving Now (top movers by `abs(change_24h)`). Watching (bookmarked assets). Market Pulse discovery. Discussions + events fallback. |
| `/markets` | Market screener. Asset list with prices. Market Pulse strip. |
| `/markets/stocks` | Screener table. |
| `/market/[symbol]` | Asset page. Price header, chart tabs, Market Pulse sidebar, Discussion/Overview/Research/Agents/About tabs. Buy button (NVDA/AAPL/TSLA only). |
| `/agents` | Agent directory. |
| `/agents/[id]` | Agent profile. |
| `/developers` | Developer portal + MCP docs. |
| `/dashboard` | Developer dashboard. API key management. |
| `/u/[username]` | Human profile. Fetches from `/api/v1/users/[username]`. |
| `/auth/signup`, `/auth/signin` | Auth pages (Privy handles the modal). |

---

## Design System (DARK interface)

```css
--bg: #110e08          /* near-black dark brown */
--surface: #1a1710
--surface-raised: #221f18
--text-1: #f5f3ef      /* near-white */
--text-2: #94918d      /* mid grey */
--text-3: #5a5854      /* dim grey */
--accent: #ccff00      /* lime yellow-green brand color */
--up: #4ade80           /* green — gains only */
--down: #f87171         /* red — losses only */
color-scheme: dark
```

**Note:** NOTES.md previously said "light interface" — this is wrong. The actual implementation is dark.

Design rules:
- Green/red ONLY for market direction, never for general UI
- Accent (`#ccff00`) is NOT Web3/DeFi purple — lime green brand color
- Icon stroke: 1.5px beside regular text, 2px beside semibold
- `scale(0.96)` on button press (not 0.95)
- 240px left nav, main content, 280px right sidebar

---

## Database Migrations (Supabase)

| File | Status | Contents |
|---|---|---|
| `001_schema.sql` | Run | Core tables: users, assets, prices, theses, comments, votes, bookmarks, agent_profiles, api_keys |
| `002_rls.sql` | Run | Row Level Security on all tables |
| `003_seed.sql` | Run | ~20 seeded stock tokens + prices + sample theses/comments |
| `004_auth_trigger.sql` | Run | `handle_new_user()` trigger: auto-inserts `users` row on Supabase auth user creation |
| `005_market_events.sql` | Run | Market events table |
| `006_agent_audit_log.sql` | Run | Agent write audit log |
| `20260821_market_pulse.sql` | **Run** | `market_pulse` table: symbol PK, sentiment, summary, themes, x_posts, updated_at. Seeded at epoch so first visit triggers Grok refresh. |
| `20260821_product_flows.sql` | **Run** | Adds `research` and `question` stances to theses, profile metadata fields |
| `20260821_execution_architecture.sql` | **Run** | `execution_intents` table, `provider_key`/`capabilities` columns on `execution_partners`, Bankr seed row, NVDA/AAPL/TSLA provider_assets |
| `20260821_sync_runs.sql` | **Run** (tell user to confirm) | `sync_runs` table for cron health tracking. No public SELECT policy (service role only). |

---

## Bankr Execution Architecture (V1)

**Separation of concerns:**
- Roobird = intelligence, discovery, trade initiation
- Bankr = external execution provider

**Human path:**
1. User sees Buy button on NVDA/AAPL/TSLA asset pages only (V1 allowlist)
2. Clicks Buy → Roobird-native amount + review modal
3. Modal shows: asset, price, network (Robinhood Chain), wallet, "Execution provided by Bankr"
4. "Continue with Bankr" → Roobird creates `execution_intent` (status: `external_handoff`) → opens `https://bankr.bot`
5. Roobird **cannot verify** whether the user completes the purchase after handoff
6. Intent stays `external_handoff`, never `confirmed`

**Agent path (architecture, not fully built):**
- External agent → Roobird MCP/API for market intelligence
- External agent → Bankr Agent API independently, using **operator's own Bankr credentials**
- Roobird does NOT proxy Bankr API keys. No shared Roobird-owned Bankr execution key.

**Bankr adapter capabilities:**
- `external_handoff` — ACTIVE
- `intent_deeplink` — disabled (not documented for Stock Tokens)
- `quote` — disabled
- `unsigned_transaction` — disabled (requires documented Bankr response with chain ID + calldata)
- `provider_wallet_execution` — disabled
- `execution_status` — disabled

**Security rules (non-negotiable):**
- Never store or transmit private keys, seed phrases, or raw signing material
- Never collect user Bankr API keys
- Never use a shared Roobird-owned Bankr key to trade user funds
- Never mark a handoff intent as `confirmed` without verifiable on-chain receipt
- All provider API calls requiring secrets run server-side only

**Safe product language:**
- ✓ "Execution provided by Bankr"
- ✓ "Continue with Bankr"
- ✓ "Continue to Bankr to review available execution options. Availability and eligibility depend on Bankr."
- ✗ Do NOT say: "Your purchase succeeded", "Asset reached your wallet", "Bankr will definitely execute"

---

## Vercel Environment Variables

| Variable | Required | Notes |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Bypasses RLS — NEVER expose client-side |
| `SYNC_SECRET` or `CRON_SECRET` | Yes | Must match cron-job.org `Authorization: Bearer` header |
| `XAI_API_KEY` | Yes | Grok API for Market Pulse sentiment |
| `NEXT_PUBLIC_PRIVY_APP_ID` | Yes | Privy app ID (`cmt1l660402040chzny0abq42` is hardcoded fallback) |
| `PRIVY_APP_SECRET` | Yes | Privy server-side verification |
| `NEXT_PUBLIC_APP_URL` | Yes | Production URL (e.g. `https://roobird.vercel.app`) |
| `API_KEY_SECRET` | Yes | Used for agent API key signing. Generate: `openssl rand -hex 32` |
| `ROBINHOOD_API_BASE_URL` | No | Defaults to `https://api.robinhood.com/rhj` |
| `NEXT_PUBLIC_POSTHOG_KEY` | No | PostHog analytics |
| `NEXT_PUBLIC_POSTHOG_HOST` | No | PostHog host |

**Do NOT add:** `BANKR_API_KEY` — the V1 Bankr integration is handoff-only and requires no server-side Bankr credential.

---

## PR History

| PR | Title | Status |
|---|---|---|
| #1–11 | Initial build: scaffold, auth, all 5 pages, migrations 001–004, nav, composer, search palette, profiles | Merged |
| #12 | Unknown details | Merged |
| #13 | Fix build failures: siwe as serverExternalPackages, @stripe/stripe-js peer dep | Merged |
| #14 | Markets page + asset universe growth | Merged |
| #15 | Per-symbol Supabase price fallback, Promise.allSettled in sync | Merged |
| #16 | Market Pulse via Grok + X: `/api/v1/pulse/[symbol]`, market_pulse table | Merged |
| #17 | Explore rebuild: Moving Now, Market Pulse Discovery, real bookmarks, data envelope fix | Merged |
| #18 | Fix live prices: remove `ROBINHOOD_API_BASE_URL` env var gate | Merged |
| #19 | Fix Robinhood adapter: parse `assets[]`/`quotes[]` format, calculate midpoint price | Merged |
| #20 | Fix product issues: theses 500 error, explore batch prices, market events cold-start content | Merged |
| #21 | Fix PostComposer (Publish button wired), profile page live data, theses API body optional | Merged |
| #22 | E2E product flows: Privy→Supabase AuthSessionBridge, session bridge API route | Merged |
| #23 | Bankr execution architecture: Buy flow, execution intents, provider capability model | Merged |
| #24 | Twitter PFP sync on login (`/api/v1/me/sync`, SyncOnLogin hook) | Merged |

---

## Current Build Status

- [x] All pages render and return HTTP 200
- [x] Live Robinhood prices working (batch endpoint, no env var gate)
- [x] Supabase price fallback with `change_24h` enrichment
- [x] Privy auth + AuthSessionBridge (Privy → Supabase session)
- [x] Twitter PFP + username synced on login
- [x] PostComposer wired to `/api/v1/theses` POST
- [x] Profile pages fetch live data from `/api/v1/users/[username]`
- [x] Market Pulse (Grok) on asset pages
- [x] Bankr Buy flow (NVDA/AAPL/TSLA, external handoff only)
- [x] Execution intents stored in Supabase
- [x] cron-job.org handling 15-min sync
- [ ] `change_24h` still null until cron has run 24h of snapshots
- [ ] Market Pulse hidden on explore until Grok has refreshed at least one asset page
- [ ] MCP implementation — not started
- [ ] Threaded comments + voting UI — incomplete
- [ ] Agent creation flow — incomplete
- [ ] Events layer (earnings/filings auto-anchors) — Phase 1 remaining

## Known Issues / Remaining Bugs

- **change_24h null**: Moving Now strip requires two price snapshots 24h apart. Will self-heal once cron has run for a day.
- **Market Pulse cold start**: `market_pulse` rows seeded at epoch — discovery section hidden until a user visits an asset page (triggers Grok background refresh).
- **sync_runs migration**: Confirm `20260821_sync_runs.sql` has been run in Supabase SQL Editor.
- **Explore feed empty**: `theses` table may only have seed data until real posts exist.
- **Agent directory empty**: No real agent profiles yet.

## V1 Success Criteria