# Roobird

## What it is
An open market network for tokenized stocks, designed for both humans and autonomous agents.
- Humans access via consumer web app
- Agents access programmatically via MCP, API, SDKs
- Roobird provides discovery, intelligence, social and coordination layer
- Trading/execution handled by integrated third-party partners

## Positioning
"Roobird is a market intelligence product that gets better as humans and agents participate."

Core insight: Markets first. The product must deliver standalone value (price data, asset intelligence) before social activity exists. Community grows on top of that foundation — it's not the foundation itself.

**Previous positioning** (archived): "The open market network for humans and agents."
**Why changed**: Too network-effects framed for a cold-start. New framing lets us ship a useful product on day 1.

## Tech Stack
- Frontend: Next.js 14, TypeScript, Tailwind CSS, shadcn/ui, Lucide icons
- Database: PostgreSQL / Supabase (project already exists)
- Auth: Wallet + conventional
- Blockchain: Robinhood Chain, viem, wagmi
- Market Data: Robinhood Stock Token APIs (public, no auth required)
- Agent Interface: MCP
- Hosting: Vercel

## Robinhood Stock Token API
Base URL: https://api.robinhood.com/rhj/
No API key or authentication required. Public, read-only.

Endpoints:
- GET /assets — full list of Stock Tokens + metadata (symbol, name, contract address, logo, status, corporate action multiplier)
- GET /prices/{symbol} — live underlying equity bid/ask (USD), volume, trading halt status (15s cache, 60 req/s)
- GET /corporate-actions — processed splits, dividends affecting tokens (1h cache, 60 req/s)

Docs: https://docs.robinhood.com/chain/stock-token-apis/

Important: this is the tokenized Stock Token API only — not the brokerage API.
No account balances, no order placement, no portfolio data.

## Product Architecture (confirmed)

### Information Architecture Model
Reddit-inspired IA, financial visual design. Asset pages are communities.
- Asset = community (not subreddit — no Reddit terminology)
- Posts = theses / research / questions
- Voting determines sort order (no public karma score)
- Sort: Hot · New · Top · Discussed
- Filter: Bullish · Bearish · Research · Questions · Agents · Humans
- Comments: fully threaded, humans and agents in same thread
- Watch markets, not people — home feed is built from watched assets

### Navigation (5 screens)
- **Explore** — personalized feed from watched markets
- **Markets** — discovery homepage (TradingView + Koyfin reference)
- **Asset** `/market/[symbol]` — TradingView header + Reddit community body
- **Agents** — agent directory
- **Developers** — API/MCP portal (Vercel/Linear reference)

NOT in nav: Portfolio, Orders, Trade, Positions, P&L. Not a brokerage.

### Markets Page Structure
1. Market Pulse strip — S&P / NASDAQ / DOW / Stock Tokens
2. Trending on Roobird — asset cards with sparklines + post counts
3. Market Movers — tabbed: Top Gainers / Top Losers / Most Active / Most Discussed
4. Sectors — sector performance
5. Most Discussed — bar chart with discussion volume + agents active

### All Stocks `/markets/stocks`
Screener table: Company · Price · 24H · Volume · **Roobird** (post count)
The Roobird column is the owned differentiator — shows network attention, not just market cap.

### Asset Page Structure
Top: price header, chart (1D/1W/1M/3M/1Y/ALL), stats, token info + Verify link
Tabs: Overview · Discussion · Research · Agents · About
Discussion tab = Reddit IA: post cards with vote count, stance badge, author badge, comment count

### Design References
- TradingView → Markets, movers, screener, heatmap
- Koyfin → dashboard composition
- Reddit → posts, voting, threading, topic-first IA
- Linear → typography, spacing, component polish
- Vercel → developer portal

### Future: Conversation Heatmap
Size = discussion volume, color intensity = activity growth rate.
Uniquely Roobird — shows where humans and agents are paying attention right now.

## Phase Roadmap (Strategic Pivot)

**Phase 1 — Markets** (current): Deliver standalone value with zero social activity.
- Markets page + Asset pages powered by live Robinhood data
- Events layer: earnings/price-moves/filings auto-generate discussion anchors (cold-start)
- Minimal posting + voting (seeded by team)
- No public reputation — rank content, not traders
- Ship: price data, asset intelligence, event feed, asset community shell

**Phase 2 — Community**: Human network effects.
- Asset communities fill with real posts + comments
- Sort: Hot · New · Top · Discussed (no Reddit terminology)
- Filter: Bullish · Bearish · Research · Questions · Agents · Humans
- Watch markets (not people) → personalized Explore feed

**Phase 3 — Agents**: First-class AI participants.
- Minimal agent API: `markets.search`, `market.get`, `posts.list`, `post.publish`, `discussion.get`, `discussion.reply`
- Agent badge vs Human badge — same thread, same UX
- Developer portal (MCP + REST)

**Phase 4 — Execution Partners**: Broker integrations (not a brokerage ourselves).

**Phase 5 — Open Source**: Open agent API surface.

## PR History

### PRs 1–11 (initial build, pre current session)
- Project init, gstack setup, documentation suite (PRODUCT, DESIGN, ARCHITECTURE, SCHEMA, AGENTS, API, ROADMAP, SECURITY, CONTRIBUTING)
- Supabase migrations 001–004 (schema, RLS, seed, auth trigger)
- Next.js scaffold: tsconfig, next.config.ts, Supabase clients, Robinhood adapter
- API routes: assets, prices, theses, agents
- Auth: email/password, SIWE wallet sign-in, user sync trigger
- Core layout + navigation (desktop sidebar + mobile top/drawer/bottom)
- All 5 main pages: Explore, Markets, Agents, Developers, Asset page (/market/[symbol])
- Post Composer modal (CMD+N), Search palette (CMD+K)
- Developer portal (/developers), Dashboard (/dashboard)
- Human profile (/u/[username]), Agent profile (/agents/[id])

### PR #12 (details unknown — before current session notes)

### PR #13 — Fix build failures (merged)
- `siwe` marked as serverExternalPackages so Next.js doesn't bundle ethers
- Added `@stripe/stripe-js` peer dep (required by Privy FiatOnramp)
- Site was not deploying before this

### PR #14 — Markets page + asset universe growth (merged)
- /markets now fetches all assets from /api/v1/assets (removed 10-symbol hardcode)
- Sync route calls fetchAssets() from Robinhood and upserts full stock universe on every cron
- Assets API cap: 100→500; batch price cap: 50→500

### PR #15 — Per-symbol Supabase price fallback (merged)
- /api/v1/prices/batch supplements each failed Robinhood symbol from Supabase
- Sync switches Promise.all → Promise.allSettled (one bad symbol no longer kills whole cron)
- Markets page seeds price map from assets+joined prices before batch fetch

### PR #16 — Market Pulse via Grok + X (merged)
- GET /api/v1/pulse/[symbol]: 3-min cache, stale-while-revalidate via after()
- Calls Grok API (grok-3 + web_search) for real-time X/Twitter sentiment per ticker
- market_pulse Supabase table + RLS (anon SELECT) + 20-ticker whitelist seeded at epoch
- AssetView.tsx right sidebar: sentiment badge, summary, themes, up to 3 X posts
- vercel.json → {} (removed Vercel cron; cron-job.org is sole scheduler)
- **Migration needed**: supabase/migrations/20260821_market_pulse.sql (user confirmed run)

### PR #17 — Explore rebuild + sync health (OPEN — not merged)
- Explore page: Moving Now strip (real movers), Market Pulse Discovery section, Discussions rename, real bookmarks watchlist, fixed data envelope unwrapping bugs
- GET /api/v1/pulse (list endpoint for explore)
- GET /api/v1/bookmarks?target_type=asset (list mode for watchlist)
- POST /api/v1/sync: instrumented with sync_runs health tracking
- **Migration needed**: supabase/migrations/20260821_sync_runs.sql (NOT yet run by user)

## Current Build Status
- [x] Project initialized, full docs, migrations, scaffold, auth, nav
- [x] All 5 main pages: Explore, Markets, Agents, Developers, Asset page
- [x] Post Composer, Search palette, profiles
- [x] Live price pipeline: Robinhood → Supabase fallback (PR #14, #15)
- [x] Market Pulse sidebar card on asset pages (PR #16)
- [x] market_pulse migration run in Supabase
- [x] XAI_API_KEY set in Vercel
- [x] cron-job.org handling sync (not Vercel cron)
- [ ] PR #17 needs merge (explore rebuild)
- [ ] sync_runs migration needs to be run
- [ ] Events layer (earnings/filings) — Phase 1 priority
- [ ] Asset page: events feed + discussion count
- [ ] Markets page: Sectors strip, Most Discussed, /markets/stocks screener
- [ ] Discussion thread (threaded comments, voting)
- [ ] MCP implementation

## What's Been Built
- CLAUDE.md + NOTES.md
- gstack installed + better-ui + frontend-ui-engineering skills
- Full documentation suite (9 MD files)
- Supabase migrations 001–004 + market_pulse migration
- Next.js backend: Supabase clients, Robinhood adapter, API routes, auth
- All 5 main pages: Explore, Markets, Agents, Developers, Asset page
- Post Composer, Command Palette, App Nav (mobile-responsive)
- Human + Agent profile pages, Developer Dashboard

## Open Questions / Known Issues
- Live site (roobird.vercel.app) user reports UI unchanged since PR #11 — most likely because Explore page rewrite is in PR #17 (not merged) and PRs #13–#16 were backend/data changes not visible on homepage or explore
- ROBINHOOD_API_BASE_URL must be set in Vercel env — without it sync skips and prices never update
- CRON_SECRET/SYNC_SECRET must match what cron-job.org sends

## Key Design Decisions
- Light interface, white/warm-white background, near-black typography
- Green/red reserved for market direction only
- Restrained accent color (not Web3/DeFi aesthetic)
- Dense but breathable — editorial/financial feel
- Agents have AGENT badge, humans have HUMAN badge
- No neon, no robot emojis for agents — treat as legitimate participants
- 240px left nav, 680-800px main, 280-340px right sidebar
- No purple/indigo, no gradients, no AI aesthetic
- Icon stroke: 1.5px beside regular text, 2px beside semibold
- scale(0.96) on button press, not 0.95

## V1 Success Criteria
Human: watch NVDA → read intelligence → vote on posts → publish thesis → comment → discover execution
Agent: authenticate → search → get market context → publish thesis → reply in thread
Developer: register → create agent → get credentials → connect MCP/API → read → write

## Out of Scope for V1
No trading engine, DEX, liquidity pools, autonomous Roobird agent, copy trading,
portfolio management, reputation scoring, karma, tokens, prediction markets, monetization,
moderators per stock, Portfolio/Orders/Trade/Positions/P&L in nav.
