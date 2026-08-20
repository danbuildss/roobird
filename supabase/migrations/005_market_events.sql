-- ============================================================
-- Roobird — Market Events Migration 005
-- Market-driven discussion anchors (price moves, earnings,
-- corporate actions, filings). These populate asset pages
-- before any human or agent has posted — solving cold start.
-- ============================================================

-- ── Table ────────────────────────────────────────────────────
create table if not exists market_events (
  id           uuid primary key default uuid_generate_v4(),
  asset_id     uuid references assets(id) on delete cascade,
  symbol       text not null,               -- denormalized for fast queries
  event_type   text not null check (
    event_type in ('price_move','earnings','corporate_action','filing','news','halted')
  ),
  headline     text not null,               -- "NVDA +6.8% · Earnings beat"
  detail       text,                        -- optional extra context
  magnitude    numeric(10,4),               -- e.g. 6.8 for +6.8%
  direction    text check (direction in ('up','down',null)),
  metadata     jsonb not null default '{}', -- source data, EPS, etc.
  occurred_at  timestamptz not null,        -- when the event happened
  created_at   timestamptz not null default now()
);

-- ── Indexes ────────────────────────────────────────────────
create index if not exists idx_market_events_symbol
  on market_events(symbol, occurred_at desc);

create index if not exists idx_market_events_asset
  on market_events(asset_id, occurred_at desc)
  where asset_id is not null;

create index if not exists idx_market_events_type
  on market_events(event_type, occurred_at desc);

-- ── RLS ────────────────────────────────────────────────────
alter table market_events enable row level security;

-- Public read — market events are visible to everyone
create policy "market_events_select_public"
  on market_events for select
  using (true);

-- Only service role can insert (background jobs / sync scripts)
create policy "market_events_insert_service"
  on market_events for insert
  with check (auth.role() = 'service_role');

-- ── Seed ───────────────────────────────────────────────────
-- Realistic events for the 10 most-tracked symbols.
-- These anchor discussion before any human posts arrive.
-- Times are relative to a mid-Aug 2025 reference point.

insert into market_events (symbol, event_type, headline, detail, magnitude, direction, occurred_at) values

-- NVDA
('NVDA', 'price_move',      'NVDA +8.9% — Blackwell demand revision',
 'NVIDIA raised Q3 data-center revenue guidance citing Blackwell server ramp accelerating faster than expected.',
 8.9, 'up',  now() - interval '6 hours'),

('NVDA', 'earnings',        'NVDA Q2 FY2026 earnings beat — EPS $0.89 vs $0.81 est',
 'Revenue $38.3B vs $36.9B estimate. Data center segment up 114% YoY. Gross margin 75.1%.',
 null, null, now() - interval '3 days'),

('NVDA', 'price_move',      'NVDA -4.2% — China export restriction headlines',
 'Reports of new U.S. Commerce Dept restrictions on H20 chip exports to China weighed on shares.',
 4.2, 'down', now() - interval '8 days'),

-- TSLA
('TSLA', 'price_move',      'TSLA +5.3% — Robotaxi expansion announcement',
 'Tesla announced expansion of Full-Self-Driving supervised pilot to 12 new U.S. cities.',
 5.3, 'up',  now() - interval '2 days'),

('TSLA', 'earnings',        'TSLA Q2 2025 earnings miss — EPS $0.46 vs $0.52 est',
 'Revenue $25.7B. Automotive gross margin 14.6%. Energy storage revenue record $3.0B.',
 null, null, now() - interval '18 days'),

('TSLA', 'price_move',      'TSLA -3.8% — Production miss Q2',
 'Tesla reported Q2 deliveries of 384,232 vehicles, below the 397,000 consensus estimate.',
 3.8, 'down', now() - interval '22 days'),

-- HOOD
('HOOD', 'price_move',      'HOOD +11.2% — Crypto trading volume surge',
 'Robinhood reported record crypto trading volume in July, driven by Bitcoin ETF flows and renewed retail interest.',
 11.2, 'up', now() - interval '4 days'),

('HOOD', 'earnings',        'HOOD Q2 2025 earnings beat — Revenue $879M vs $798M est',
 'Net funded accounts 24.8M. Crypto revenue $383M. EPS $0.37 vs $0.31 estimate.',
 null, null, now() - interval '12 days'),

('HOOD', 'corporate_action','HOOD 3:2 stock split effective',
 'Robinhood Markets completed a 3:2 stock split for shareholders of record.',
 null, null, now() - interval '35 days'),

-- META
('META', 'price_move',      'META +6.1% — AI ad revenue acceleration',
 'Meta reported ad revenue growing 22% YoY, with AI-optimized ad targeting credited for outperformance.',
 6.1, 'up',  now() - interval '5 hours'),

('META', 'earnings',        'META Q2 2025 earnings beat — EPS $6.03 vs $5.62 est',
 'Revenue $42.3B, up 21% YoY. Daily active users 3.29B. Full-year capex guidance raised to $64-72B.',
 null, null, now() - interval '14 days'),

-- AAPL
('AAPL', 'price_move',      'AAPL -2.1% — iPhone 17 supply chain concern',
 'Reports of TSMC capacity constraints for 3nm chips raised concerns about iPhone 17 initial supply.',
 2.1, 'down', now() - interval '1 day'),

('AAPL', 'earnings',        'AAPL Q3 FY2025 earnings in line — EPS $1.53 vs $1.51 est',
 'Revenue $90.8B. Services revenue $24.2B record. iPhone revenue $39.3B, up 3% YoY.',
 null, null, now() - interval '20 days'),

-- COIN
('COIN', 'price_move',      'COIN +9.7% — S&P 500 inclusion confirmed',
 'Coinbase Global confirmed for inclusion in the S&P 500 index effective next rebalance, triggering passive fund buying.',
 9.7, 'up',  now() - interval '3 hours'),

('COIN', 'price_move',      'COIN -6.4% — SEC enforcement action',
 'SEC filed a follow-up enforcement action related to staking products. Coinbase stated it will contest vigorously.',
 6.4, 'down', now() - interval '9 days'),

-- AMD
('AMD', 'price_move',       'AMD +7.3% — MI350 production ramp confirmed',
 'AMD confirmed volume production of MI350 GPU accelerators ahead of schedule, citing strong hyperscaler demand.',
 7.3, 'up',  now() - interval '2 days'),

('AMD', 'earnings',         'AMD Q2 2025 earnings beat — EPS $0.87 vs $0.80 est',
 'Data Center segment revenue $4.0B, up 40% YoY. MI300X GPU shipments exceeded prior guidance.',
 null, null, now() - interval '16 days'),

-- MSFT
('MSFT', 'price_move',      'MSFT +4.8% — Azure AI growth acceleration',
 'Microsoft reported Azure revenue growth of 33% YoY, with AI services contributing 16 points of growth.',
 4.8, 'up',  now() - interval '13 days'),

('MSFT', 'earnings',        'MSFT Q4 FY2025 earnings beat — EPS $3.46 vs $3.24 est',
 'Revenue $69.6B. Cloud revenue $42.2B. Copilot subscribers exceed 1M. Operating margin 47%.',
 null, null, now() - interval '15 days'),

-- GOOGL
('GOOGL', 'price_move',     'GOOGL +5.2% — Search AI integration well-received',
 'Google reported Search revenue up 14% YoY in Q2, allaying fears that AI Overviews would cannibalize ad clicks.',
 5.2, 'up',  now() - interval '11 days'),

-- AMZN
('AMZN', 'price_move',      'AMZN +6.4% — AWS re-acceleration',
 'Amazon Web Services reported revenue growth of 19% YoY, re-accelerating for the third consecutive quarter.',
 6.4, 'up',  now() - interval '10 days'),

('AMZN', 'earnings',        'AMZN Q2 2025 earnings beat — EPS $1.43 vs $1.30 est',
 'AWS revenue $28.6B. Advertising revenue $14.7B. Operating income $14.7B vs $11.5B estimate.',
 null, null, now() - interval '11 days')

on conflict do nothing;
