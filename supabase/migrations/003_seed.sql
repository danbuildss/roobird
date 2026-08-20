-- ============================================================
-- Roobird — Seed Migration 003
-- Initial data for development and testing
-- Run after 002_rls.sql
-- Uses service role (bypasses RLS)
-- ============================================================

-- ============================================================
-- ASSETS (top Stock Tokens)
-- Token addresses are placeholders — replace with real Robinhood Chain addresses
-- ============================================================
insert into assets (symbol, name, token_address, chain_id, underlying, asset_type, source_adapter) values
  ('NVDA',  'NVIDIA Corporation',         '0x1111111111111111111111111111111111111111', 1,    'NVDA',  'stock', 'robinhood'),
  ('TSLA',  'Tesla, Inc.',                '0x2222222222222222222222222222222222222222', 1,    'TSLA',  'stock', 'robinhood'),
  ('AAPL',  'Apple Inc.',                 '0x3333333333333333333333333333333333333333', 1,    'AAPL',  'stock', 'robinhood'),
  ('MSFT',  'Microsoft Corporation',      '0x4444444444444444444444444444444444444444', 1,    'MSFT',  'stock', 'robinhood'),
  ('META',  'Meta Platforms, Inc.',        '0x5555555555555555555555555555555555555555', 1,    'META',  'stock', 'robinhood'),
  ('GOOGL', 'Alphabet Inc.',              '0x6666666666666666666666666666666666666666', 1,    'GOOGL', 'stock', 'robinhood'),
  ('AMZN',  'Amazon.com, Inc.',           '0x7777777777777777777777777777777777777777', 1,    'AMZN',  'stock', 'robinhood'),
  ('AMD',   'Advanced Micro Devices',     '0x8888888888888888888888888888888888888888', 1,    'AMD',   'stock', 'robinhood'),
  ('HOOD',  'Robinhood Markets, Inc.',    '0x9999999999999999999999999999999999999999', 1,    'HOOD',  'stock', 'robinhood'),
  ('COIN',  'Coinbase Global, Inc.',      '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', 1,    'COIN',  'stock', 'robinhood'),
  ('SPY',   'SPDR S&P 500 ETF Trust',    '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb', 1,    'SPY',   'etf',   'robinhood'),
  ('QQQ',   'Invesco QQQ Trust',          '0xcccccccccccccccccccccccccccccccccccccccc', 1,    'QQQ',   'etf',   'robinhood')
on conflict (symbol) do nothing;

-- ============================================================
-- SEED PRICES (placeholder — real prices come from Robinhood API)
-- ============================================================
insert into prices (asset_id, price, change_24h, volume_24h, market_cap)
select id, price, change_24h, volume_24h, market_cap
from (values
  ('NVDA',   131.42,  2.84,   312000000,  3210000000000),
  ('TSLA',   248.71, -1.23,   198000000,   795000000000),
  ('AAPL',   213.18,  0.42,   287000000,  3280000000000),
  ('MSFT',   441.27,  0.93,   198000000,  3280000000000),
  ('META',   612.44,  1.87,   143000000,  1560000000000),
  ('GOOGL',  187.93,  1.14,   167000000,  2310000000000),
  ('AMZN',   198.12,  0.65,   221000000,  2090000000000),
  ('AMD',    154.92, -0.78,   156000000,   251000000000),
  ('HOOD',    47.23,  5.61,    87000000,    41000000000),
  ('COIN',   248.61,  3.22,    94000000,    62000000000),
  ('SPY',    562.14,  0.44,   890000000,   530000000000),
  ('QQQ',    481.33,  0.71,   420000000,   210000000000)
) as v(symbol, price, change_24h, volume_24h, market_cap)
join assets on assets.symbol = v.symbol;

-- ============================================================
-- EXECUTION PARTNERS
-- ============================================================
insert into execution_partners (name, description, website_url) values
  ('Robinhood', 'Trade Stock Tokens directly on Robinhood.', 'https://robinhood.com'),
  ('Uniswap',   'Swap Stock Tokens on-chain via Uniswap.',   'https://uniswap.org')
on conflict do nothing;

-- ============================================================
-- PROVIDER ASSETS (wire execution partners to assets)
-- ============================================================
insert into provider_assets (provider_id, asset_id, supported_network, execution_method, deep_link_template)
select
  ep.id,
  a.id,
  'Robinhood Chain',
  'deep_link',
  'https://robinhood.com/stocks/' || a.symbol
from execution_partners ep
cross join assets a
where ep.name = 'Robinhood'
on conflict do nothing;

-- ============================================================
-- NOTE: Users, agents, and theses are NOT seeded here.
-- They are created through the application auth + registration flows.
-- For local development testing, create a user via Supabase Auth
-- then use the app to create agents and publish theses.
-- ============================================================
