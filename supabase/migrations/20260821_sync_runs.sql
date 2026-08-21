-- Sync run health tracking — internal only, no public access
CREATE TABLE IF NOT EXISTS sync_runs (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  started_at       timestamptz NOT NULL DEFAULT now(),
  completed_at     timestamptz,
  status           text NOT NULL CHECK (status IN ('running', 'completed', 'failed', 'skipped')),
  assets_attempted integer NOT NULL DEFAULT 0,
  assets_updated   integer NOT NULL DEFAULT 0,
  prices_inserted  integer NOT NULL DEFAULT 0,
  failure_count    integer NOT NULL DEFAULT 0,
  duration_ms      integer,
  error_summary    text
);

-- No RLS policies = inaccessible to anon and authenticated roles
-- Only service role can read/write
ALTER TABLE sync_runs ENABLE ROW LEVEL SECURITY;

-- Keep last 500 runs (trim older ones automatically)
CREATE INDEX IF NOT EXISTS sync_runs_started_at_idx ON sync_runs (started_at DESC);
