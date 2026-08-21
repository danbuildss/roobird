-- Market Pulse table: X/Twitter sentiment per symbol, cached from Grok API
CREATE TABLE IF NOT EXISTS market_pulse (
  symbol          text PRIMARY KEY,
  sentiment       text NOT NULL CHECK (sentiment IN ('Bullish', 'Neutral', 'Bearish')),
  sentiment_score numeric(4,3) NOT NULL,
  summary         text NOT NULL,
  key_posts       jsonb NOT NULL DEFAULT '[]',
  themes          jsonb NOT NULL DEFAULT '[]',
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- Public read: anon users can read pulse data on asset pages
ALTER TABLE market_pulse ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public read market_pulse"
  ON market_pulse FOR SELECT TO anon USING (true);

-- Seed the whitelist (only these symbols trigger Grok calls)
-- Add or remove symbols here to control API costs
INSERT INTO market_pulse (symbol, sentiment, sentiment_score, summary, key_posts, themes, updated_at)
VALUES
  ('AAPL',  'Neutral', 0.0, 'Loading sentiment data…', '[]', '[]', '1970-01-01T00:00:00Z'),
  ('NVDA',  'Neutral', 0.0, 'Loading sentiment data…', '[]', '[]', '1970-01-01T00:00:00Z'),
  ('TSLA',  'Neutral', 0.0, 'Loading sentiment data…', '[]', '[]', '1970-01-01T00:00:00Z'),
  ('MSFT',  'Neutral', 0.0, 'Loading sentiment data…', '[]', '[]', '1970-01-01T00:00:00Z'),
  ('AMZN',  'Neutral', 0.0, 'Loading sentiment data…', '[]', '[]', '1970-01-01T00:00:00Z'),
  ('GOOGL', 'Neutral', 0.0, 'Loading sentiment data…', '[]', '[]', '1970-01-01T00:00:00Z'),
  ('META',  'Neutral', 0.0, 'Loading sentiment data…', '[]', '[]', '1970-01-01T00:00:00Z'),
  ('HOOD',  'Neutral', 0.0, 'Loading sentiment data…', '[]', '[]', '1970-01-01T00:00:00Z'),
  ('COIN',  'Neutral', 0.0, 'Loading sentiment data…', '[]', '[]', '1970-01-01T00:00:00Z'),
  ('AMD',   'Neutral', 0.0, 'Loading sentiment data…', '[]', '[]', '1970-01-01T00:00:00Z'),
  ('INTC',  'Neutral', 0.0, 'Loading sentiment data…', '[]', '[]', '1970-01-01T00:00:00Z'),
  ('NFLX',  'Neutral', 0.0, 'Loading sentiment data…', '[]', '[]', '1970-01-01T00:00:00Z'),
  ('DIS',   'Neutral', 0.0, 'Loading sentiment data…', '[]', '[]', '1970-01-01T00:00:00Z'),
  ('PYPL',  'Neutral', 0.0, 'Loading sentiment data…', '[]', '[]', '1970-01-01T00:00:00Z'),
  ('PLTR',  'Neutral', 0.0, 'Loading sentiment data…', '[]', '[]', '1970-01-01T00:00:00Z'),
  ('RBLX',  'Neutral', 0.0, 'Loading sentiment data…', '[]', '[]', '1970-01-01T00:00:00Z'),
  ('SNAP',  'Neutral', 0.0, 'Loading sentiment data…', '[]', '[]', '1970-01-01T00:00:00Z'),
  ('UBER',  'Neutral', 0.0, 'Loading sentiment data…', '[]', '[]', '1970-01-01T00:00:00Z'),
  ('LYFT',  'Neutral', 0.0, 'Loading sentiment data…', '[]', '[]', '1970-01-01T00:00:00Z'),
  ('SQ',    'Neutral', 0.0, 'Loading sentiment data…', '[]', '[]', '1970-01-01T00:00:00Z')
ON CONFLICT (symbol) DO NOTHING;
