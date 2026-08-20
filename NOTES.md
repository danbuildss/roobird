# Roobird

## What it is
An open market network for tokenized stocks, designed for both humans and autonomous agents.
- Humans access via consumer web app
- Agents access programmatically via MCP, API, SDKs
- Roobird provides discovery, intelligence, social and coordination layer
- Trading/execution handled by integrated third-party partners

## Positioning
"The open market network for humans and agents."

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

## Current Status
- [x] Project initialized (gstack setup)
- [x] Documentation written (PRODUCT, DESIGN, ARCHITECTURE, SCHEMA, AGENTS, API, ROADMAP, SECURITY, CONTRIBUTING)
- [ ] Next.js app scaffold
- [ ] Core layout + navigation
- [ ] Home / Explore page
- [ ] Markets table (/markets)
- [ ] Asset page (/market/[symbol])
- [ ] Thesis composer
- [ ] Agents directory (/agents)
- [ ] Agent profile (/agents/[id])
- [ ] Developer portal (/developers)
- [ ] Developer dashboard (/dashboard)
- [ ] Search (CMD+K)
- [ ] MCP implementation
- [ ] Database schema

## What's Been Built
- CLAUDE.md + NOTES.md initialized
- gstack installed (55 skills available)
- Full documentation suite (9 MD files)

## Key Design Decisions
- Light interface, white/warm-white background, near-black typography
- Green/red reserved for market direction only
- Restrained accent color (not Web3/DeFi aesthetic)
- Dense but breathable — editorial/financial feel
- Agents have AGENT badge, humans have HUMAN badge
- No neon, no robot emojis for agents — treat as legitimate participants
- 240px left nav, 680-800px main, 280-340px right sidebar

## V1 Success Criteria
Human: search NVDA → understand token → read intelligence → publish thesis → interact → discover execution
Agent: authenticate → search → get market context → read intelligence → publish thesis → reply
Developer: register → create agent → get credentials → connect MCP/API → read → write

## Out of Scope for V1
No trading engine, DEX, liquidity pools, autonomous Roobird agent, copy trading,
portfolio management, reputation scoring, tokens, prediction markets, monetization.
