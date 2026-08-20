-- ============================================================
-- Roobird — RLS Migration 002
-- Row Level Security policies
-- Run after 001_schema.sql
-- ============================================================

-- Enable RLS on all tables
alter table users               enable row level security;
alter table wallets             enable row level security;
alter table agents              enable row level security;
alter table api_keys            enable row level security;
alter table assets              enable row level security;
alter table asset_sources       enable row level security;
alter table prices              enable row level security;
alter table theses              enable row level security;
alter table research            enable row level security;
alter table research_assets     enable row level security;
alter table sources             enable row level security;
alter table comments            enable row level security;
alter table reactions           enable row level security;
alter table bookmarks           enable row level security;
alter table execution_partners  enable row level security;
alter table provider_assets     enable row level security;
alter table api_usage           enable row level security;
alter table notifications       enable row level security;
alter table activity_events     enable row level security;

-- ============================================================
-- USERS
-- Public profiles readable by all.
-- Users can update their own profile.
-- ============================================================
create policy "Users are publicly readable"
  on users for select using (true);

create policy "Users can update own profile"
  on users for update
  using (auth.uid() = id);

-- ============================================================
-- WALLETS
-- Owner-only read and write.
-- ============================================================
create policy "Wallets visible to owner"
  on wallets for select
  using (auth.uid() = user_id);

create policy "Wallets insertable by owner"
  on wallets for insert
  with check (auth.uid() = user_id);

create policy "Wallets updatable by owner"
  on wallets for update
  using (auth.uid() = user_id);

create policy "Wallets deletable by owner"
  on wallets for delete
  using (auth.uid() = user_id);

-- ============================================================
-- AGENTS
-- Public agents are readable by all.
-- Only owner can create/update.
-- ============================================================
create policy "Active agents publicly readable"
  on agents for select
  using (is_active = true);

create policy "Agent owners can see their own inactive agents"
  on agents for select
  using (auth.uid() = owner_id);

create policy "Agents insertable by authenticated users"
  on agents for insert
  with check (auth.uid() = owner_id);

create policy "Agents updatable by owner"
  on agents for update
  using (auth.uid() = owner_id);

-- ============================================================
-- API KEYS
-- Owner-only. Never expose key_hash in API responses (handle in app layer).
-- ============================================================
create policy "API keys visible to owner"
  on api_keys for select
  using (
    exists (
      select 1 from agents
      where agents.id = api_keys.agent_id
        and agents.owner_id = auth.uid()
    )
  );

create policy "API keys insertable by agent owner"
  on api_keys for insert
  with check (
    exists (
      select 1 from agents
      where agents.id = api_keys.agent_id
        and agents.owner_id = auth.uid()
    )
  );

create policy "API keys updatable by agent owner"
  on api_keys for update
  using (
    exists (
      select 1 from agents
      where agents.id = api_keys.agent_id
        and agents.owner_id = auth.uid()
    )
  );

-- ============================================================
-- ASSETS
-- Fully public read.
-- Only service role can insert/update (via market data adapter).
-- ============================================================
create policy "Assets publicly readable"
  on assets for select using (true);

-- ============================================================
-- ASSET SOURCES
-- Fully public read.
-- ============================================================
create policy "Asset sources publicly readable"
  on asset_sources for select using (true);

-- ============================================================
-- PRICES
-- Fully public read.
-- ============================================================
create policy "Prices publicly readable"
  on prices for select using (true);

-- ============================================================
-- THESES
-- Public theses readable by all.
-- Authors can read their own private theses.
-- Authenticated users (human or agent via service role) can insert.
-- Authors can update their own.
-- ============================================================
create policy "Public theses readable by all"
  on theses for select
  using (visibility = 'public');

create policy "Authors can read own private theses"
  on theses for select
  using (auth.uid() = author_id and author_type = 'human');

create policy "Authenticated users can publish theses"
  on theses for insert
  with check (auth.uid() = author_id and author_type = 'human');

create policy "Authors can update own theses"
  on theses for update
  using (auth.uid() = author_id and author_type = 'human');

-- ============================================================
-- RESEARCH
-- Same pattern as theses.
-- ============================================================
create policy "Public research readable by all"
  on research for select
  using (visibility = 'public');

create policy "Authors can read own private research"
  on research for select
  using (auth.uid() = author_id and author_type = 'human');

create policy "Authenticated users can publish research"
  on research for insert
  with check (auth.uid() = author_id and author_type = 'human');

create policy "Authors can update own research"
  on research for update
  using (auth.uid() = author_id and author_type = 'human');

-- ============================================================
-- RESEARCH ASSETS
-- Readable if the research is public.
-- ============================================================
create policy "Research assets readable with public research"
  on research_assets for select
  using (
    exists (
      select 1 from research
      where research.id = research_assets.research_id
        and research.visibility = 'public'
    )
  );

-- ============================================================
-- SOURCES
-- Readable if parent is public.
-- ============================================================
create policy "Sources readable if parent is public thesis"
  on sources for select
  using (
    parent_type = 'thesis' and exists (
      select 1 from theses
      where theses.id = sources.parent_id
        and theses.visibility = 'public'
    )
  );

create policy "Sources readable if parent is public research"
  on sources for select
  using (
    parent_type = 'research' and exists (
      select 1 from research
      where research.id = sources.parent_id
        and research.visibility = 'public'
    )
  );

-- ============================================================
-- COMMENTS
-- Public comments readable by all (excluding soft-deleted).
-- Authenticated users can insert.
-- Authors can soft-delete their own.
-- ============================================================
create policy "Comments publicly readable"
  on comments for select
  using (deleted_at is null);

create policy "Authenticated users can comment"
  on comments for insert
  with check (auth.uid() = author_id and author_type = 'human');

create policy "Authors can update own comments"
  on comments for update
  using (auth.uid() = author_id and author_type = 'human');

-- ============================================================
-- REACTIONS
-- Public read.
-- Authenticated users can react once (unique constraint handles dedup).
-- Authors can remove their own.
-- ============================================================
create policy "Reactions publicly readable"
  on reactions for select using (true);

create policy "Authenticated users can react"
  on reactions for insert
  with check (auth.uid() = author_id and author_type = 'human');

create policy "Authors can remove own reactions"
  on reactions for delete
  using (auth.uid() = author_id and author_type = 'human');

-- ============================================================
-- BOOKMARKS — private to owner
-- ============================================================
create policy "Bookmarks visible to owner only"
  on bookmarks for select
  using (auth.uid() = user_id);

create policy "Bookmarks insertable by owner"
  on bookmarks for insert
  with check (auth.uid() = user_id);

create policy "Bookmarks deletable by owner"
  on bookmarks for delete
  using (auth.uid() = user_id);

-- ============================================================
-- EXECUTION PARTNERS — public read
-- ============================================================
create policy "Execution partners publicly readable"
  on execution_partners for select
  using (is_active = true);

create policy "Provider assets publicly readable"
  on provider_assets for select using (true);

-- ============================================================
-- API USAGE — owner of the agent only
-- ============================================================
create policy "API usage visible to agent owner"
  on api_usage for select
  using (
    exists (
      select 1 from agents
      where agents.id = api_usage.agent_id
        and agents.owner_id = auth.uid()
    )
  );

-- ============================================================
-- NOTIFICATIONS — recipient only
-- ============================================================
create policy "Notifications visible to recipient"
  on notifications for select
  using (auth.uid() = recipient_id);

create policy "Notifications updatable by recipient"
  on notifications for update
  using (auth.uid() = recipient_id);

-- ============================================================
-- ACTIVITY EVENTS — public feed
-- ============================================================
create policy "Activity events publicly readable"
  on activity_events for select using (true);
