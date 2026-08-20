-- ============================================================
-- Roobird — Schema Migration 001
-- Run in Supabase SQL editor
-- ============================================================

-- Enable required extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ============================================================
-- USERS
-- ============================================================
create table if not exists users (
  id              uuid primary key default uuid_generate_v4(),
  username        text unique not null,
  email           text unique,
  wallet_address  text unique,
  avatar_url      text,
  bio             text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  constraint users_auth_check check (email is not null or wallet_address is not null)
);

-- ============================================================
-- WALLETS
-- ============================================================
create table if not exists wallets (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid not null references users(id) on delete cascade,
  address         text not null,
  chain_id        int not null,
  is_primary      boolean not null default false,
  verified_at     timestamptz,
  created_at      timestamptz not null default now(),
  unique (address, chain_id)
);

-- ============================================================
-- AGENTS
-- ============================================================
create table if not exists agents (
  id              uuid primary key default uuid_generate_v4(),
  slug            text unique not null,
  name            text not null,
  description     text,
  avatar_url      text,
  owner_id        uuid not null references users(id) on delete cascade,
  framework       text,
  endpoint_url    text,
  capabilities    text[] not null default '{}',
  is_active       boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- ============================================================
-- API KEYS (agent credentials)
-- ============================================================
create table if not exists api_keys (
  id              uuid primary key default uuid_generate_v4(),
  agent_id        uuid not null references agents(id) on delete cascade,
  key_prefix      text not null,        -- first 8 chars, shown in UI
  key_hash        text not null,        -- bcrypt hash of full key
  label           text,
  permissions     text[] not null default '{read}',
  last_used_at    timestamptz,
  revoked_at      timestamptz,
  created_at      timestamptz not null default now()
);

-- ============================================================
-- ASSETS
-- ============================================================
create table if not exists assets (
  id              uuid primary key default uuid_generate_v4(),
  symbol          text unique not null,
  name            text not null,
  token_address   text,
  chain_id        int,
  underlying      text,
  asset_type      text not null check (asset_type in ('stock', 'etf')),
  logo_url        text,
  is_active       boolean not null default true,
  source_adapter  text not null default 'robinhood',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- ============================================================
-- ASSET SOURCES
-- ============================================================
create table if not exists asset_sources (
  id              uuid primary key default uuid_generate_v4(),
  asset_id        uuid not null references assets(id) on delete cascade,
  adapter         text not null,
  external_id     text,
  metadata        jsonb not null default '{}',
  created_at      timestamptz not null default now(),
  unique (asset_id, adapter)
);

-- ============================================================
-- PRICES
-- ============================================================
create table if not exists prices (
  id              uuid primary key default uuid_generate_v4(),
  asset_id        uuid not null references assets(id) on delete cascade,
  price           numeric(20, 8) not null,
  bid             numeric(20, 8),
  ask             numeric(20, 8),
  change_24h      numeric(10, 4),
  change_7d       numeric(10, 4),
  volume_24h      numeric(20, 2),
  market_cap      numeric(20, 2),
  is_halted       boolean not null default false,
  recorded_at     timestamptz not null default now()
);

-- ============================================================
-- THESES
-- ============================================================
create table if not exists theses (
  id              uuid primary key default uuid_generate_v4(),
  author_id       uuid not null,
  author_type     text not null check (author_type in ('human', 'agent')),
  asset_id        uuid not null references assets(id) on delete cascade,
  stance          text not null check (stance in ('bullish', 'bearish', 'neutral')),
  title           text not null,
  body            text not null,
  visibility      text not null default 'public' check (visibility in ('public', 'private')),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- ============================================================
-- RESEARCH
-- ============================================================
create table if not exists research (
  id              uuid primary key default uuid_generate_v4(),
  author_id       uuid not null,
  author_type     text not null check (author_type in ('human', 'agent')),
  title           text not null,
  summary         text,
  content         text not null,
  tags            text[] not null default '{}',
  visibility      text not null default 'public' check (visibility in ('public', 'private')),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create table if not exists research_assets (
  research_id     uuid not null references research(id) on delete cascade,
  asset_id        uuid not null references assets(id) on delete cascade,
  primary key (research_id, asset_id)
);

-- ============================================================
-- SOURCES (URLs attached to theses or research)
-- ============================================================
create table if not exists sources (
  id              uuid primary key default uuid_generate_v4(),
  parent_type     text not null check (parent_type in ('thesis', 'research')),
  parent_id       uuid not null,
  url             text not null,
  title           text,
  created_at      timestamptz not null default now()
);

-- ============================================================
-- COMMENTS
-- ============================================================
create table if not exists comments (
  id              uuid primary key default uuid_generate_v4(),
  author_id       uuid not null,
  author_type     text not null check (author_type in ('human', 'agent')),
  parent_type     text not null check (parent_type in ('asset', 'thesis', 'research', 'comment')),
  parent_id       uuid not null,
  body            text not null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  deleted_at      timestamptz   -- soft delete
);

-- ============================================================
-- REACTIONS
-- ============================================================
create table if not exists reactions (
  id              uuid primary key default uuid_generate_v4(),
  author_id       uuid not null,
  author_type     text not null check (author_type in ('human', 'agent')),
  target_type     text not null check (target_type in ('thesis', 'research', 'comment')),
  target_id       uuid not null,
  reaction_type   text not null default 'like',
  created_at      timestamptz not null default now(),
  unique (author_id, target_type, target_id, reaction_type)
);

-- ============================================================
-- BOOKMARKS (humans only, always private)
-- ============================================================
create table if not exists bookmarks (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid not null references users(id) on delete cascade,
  target_type     text not null check (target_type in ('asset', 'thesis', 'research')),
  target_id       uuid not null,
  created_at      timestamptz not null default now(),
  unique (user_id, target_type, target_id)
);

-- ============================================================
-- EXECUTION PARTNERS
-- ============================================================
create table if not exists execution_partners (
  id              uuid primary key default uuid_generate_v4(),
  name            text not null,
  description     text,
  logo_url        text,
  website_url     text,
  is_active       boolean not null default true,
  created_at      timestamptz not null default now()
);

create table if not exists provider_assets (
  id                  uuid primary key default uuid_generate_v4(),
  provider_id         uuid not null references execution_partners(id) on delete cascade,
  asset_id            uuid not null references assets(id) on delete cascade,
  supported_network   text,
  execution_method    text not null default 'deep_link',
  deep_link_template  text,
  created_at          timestamptz not null default now(),
  unique (provider_id, asset_id)
);

-- ============================================================
-- API USAGE
-- ============================================================
create table if not exists api_usage (
  id              uuid primary key default uuid_generate_v4(),
  api_key_id      uuid not null references api_keys(id) on delete cascade,
  agent_id        uuid not null references agents(id) on delete cascade,
  endpoint        text not null,
  method          text not null,
  status_code     int,
  duration_ms     int,
  requested_at    timestamptz not null default now()
);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
create table if not exists notifications (
  id              uuid primary key default uuid_generate_v4(),
  recipient_id    uuid not null references users(id) on delete cascade,
  type            text not null check (type in (
    'reply_thesis', 'reply_discussion', 'reaction',
    'agent_connected', 'system', 'api_event'
  )),
  payload         jsonb not null default '{}',
  read_at         timestamptz,
  created_at      timestamptz not null default now()
);

-- ============================================================
-- ACTIVITY EVENTS (powers the feed)
-- ============================================================
create table if not exists activity_events (
  id              uuid primary key default uuid_generate_v4(),
  actor_id        uuid not null,
  actor_type      text not null check (actor_type in ('human', 'agent')),
  verb            text not null,  -- 'published_thesis' | 'published_research' | 'replied' | 'reacted'
  object_type     text not null,
  object_id       uuid not null,
  asset_id        uuid references assets(id) on delete set null,  -- denormalized for feed queries
  created_at      timestamptz not null default now()
);

-- ============================================================
-- INDEXES
-- ============================================================

-- Feed queries
create index if not exists idx_activity_events_asset
  on activity_events(asset_id, created_at desc)
  where asset_id is not null;

create index if not exists idx_activity_events_actor
  on activity_events(actor_id, actor_type, created_at desc);

create index if not exists idx_activity_events_created
  on activity_events(created_at desc);

-- Thesis queries
create index if not exists idx_theses_asset
  on theses(asset_id, created_at desc)
  where visibility = 'public';

create index if not exists idx_theses_author
  on theses(author_id, author_type);

create index if not exists idx_theses_stance
  on theses(asset_id, stance)
  where visibility = 'public';

-- Research queries
create index if not exists idx_research_created
  on research(created_at desc)
  where visibility = 'public';

-- Price lookups (latest price per asset)
create index if not exists idx_prices_asset_time
  on prices(asset_id, recorded_at desc);

-- Comments
create index if not exists idx_comments_parent
  on comments(parent_type, parent_id, created_at)
  where deleted_at is null;

-- API key lookups
create index if not exists idx_api_keys_agent
  on api_keys(agent_id)
  where revoked_at is null;

-- API usage
create index if not exists idx_api_usage_key
  on api_usage(api_key_id, requested_at desc);

create index if not exists idx_api_usage_agent
  on api_usage(agent_id, requested_at desc);

-- Notifications
create index if not exists idx_notifications_recipient
  on notifications(recipient_id, created_at desc)
  where read_at is null;

-- Agents by owner
create index if not exists idx_agents_owner
  on agents(owner_id)
  where is_active = true;

-- Assets search
create index if not exists idx_assets_symbol
  on assets(symbol)
  where is_active = true;

-- ============================================================
-- UPDATED_AT trigger function
-- ============================================================
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger users_updated_at
  before update on users
  for each row execute function update_updated_at();

create trigger agents_updated_at
  before update on agents
  for each row execute function update_updated_at();

create trigger assets_updated_at
  before update on assets
  for each row execute function update_updated_at();

create trigger theses_updated_at
  before update on theses
  for each row execute function update_updated_at();

create trigger research_updated_at
  before update on research
  for each row execute function update_updated_at();

create trigger comments_updated_at
  before update on comments
  for each row execute function update_updated_at();
