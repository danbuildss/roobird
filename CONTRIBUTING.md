# Contributing

Roobird is open source. Contributions to the protocol, SDK, MCP implementation, adapters, and reference integrations are welcome.

---

## What You Can Contribute

- **Bug fixes** across any package
- **Market data adapters** — new tokenized equity sources
- **Execution adapters** — new execution partner integrations
- **SDK improvements** — TypeScript SDK features, type coverage, docs
- **MCP tool additions** — new tools following the established pattern
- **Example agents** — reference implementations in `examples/`
- **Documentation** — corrections, clarifications, translations

What we are not accepting in V1:
- Trading/execution infrastructure
- Reputation or leaderboard systems
- Autonomous Roobird agent behavior
- Monetization features

If you are unsure whether your contribution fits, open an issue first.

---

## Repository Structure

```
roobird/
├── apps/
│   ├── web/          — Next.js consumer web application
│   ├── mcp/          — MCP server
│   └── docs/         — Documentation site
│
├── packages/
│   ├── sdk/          — TypeScript SDK (public npm package)
│   ├── database/     — Schema, migrations, generated types
│   ├── market-data/  — Market data adapter interface + Robinhood adapter
│   ├── protocol/     — Shared types and constants
│   ├── ui/           — Shared UI components
│   └── types/        — Shared TypeScript types
│
├── adapters/
│   ├── robinhood/    — Robinhood Stock Token API adapter
│   └── execution/    — Execution partner adapter interface
│
└── examples/
    ├── basic-agent/  — Minimal MCP + REST API agent
    └── research-agent/ — Full research publishing agent
```

---

## Getting Started

### Prerequisites
- Node.js 20+
- pnpm 9+
- A Supabase project (for database)
- A Robinhood API key (for market data, during development use the mock adapter)

### Setup

```bash
git clone https://github.com/roobird/roobird.git
cd roobird
pnpm install
cp apps/web/.env.example apps/web/.env.local
# Fill in .env.local with your Supabase and Robinhood credentials
pnpm dev
```

### Running tests

```bash
pnpm test          # all packages
pnpm test --filter=sdk  # specific package
```

### Building

```bash
pnpm build
```

---

## Pull Request Guidelines

1. **One thing per PR.** A fix, a feature, a new adapter. Not all three.
2. **Reference the issue.** PRs should close or address an open issue.
3. **Keep changes minimal.** Do not refactor surrounding code unless the PR is explicitly a refactor.
4. **Write tests** for new behavior. Bug fix PRs should include a test that would have caught the bug.
5. **Follow the existing code style.** ESLint and Prettier are configured. Run `pnpm lint` before submitting.
6. **Update documentation** if your change affects the API, schema, or agent interface.

---

## Building a Market Data Adapter

New market data sources are implemented as adapters in `adapters/` or `packages/market-data/`.

Every adapter must implement the `MarketDataAdapter` interface:

```typescript
interface MarketDataAdapter {
  searchAssets(query: string, options?: SearchOptions): Promise<Asset[]>
  getAsset(symbol: string): Promise<Asset>
  getPrice(symbol: string): Promise<Price>
  getMarketContext(symbol: string): Promise<MarketContext>
}
```

See `adapters/robinhood/` for the reference implementation.

Adapters must:
- Return data in the canonical `Asset` and `Price` types from `packages/types`
- Handle errors gracefully and throw typed errors
- Include a README describing the data source, authentication requirements, and any limitations
- Include tests using a mock or sandbox API

---

## Building an Execution Adapter

Execution partners connect through a lightweight adapter that provides:
- Asset support list
- Deep link generation
- (Optional) quote retrieval

See `adapters/execution/` for the interface definition.

Roobird does not execute trades. Execution adapters generate links and pass users to the partner — they do not touch order routing, wallets, or funds.

---

## Code of Conduct

See `CODE_OF_CONDUCT.md`. The short version: be respectful, assume good intent, focus on the work.

---

## License

See `LICENSE`. The project uses the MIT license.

By contributing, you agree that your contributions will be licensed under the same terms.
