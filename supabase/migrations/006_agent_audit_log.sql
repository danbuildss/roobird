-- ============================================================
-- Roobird — Migration 006: Agent audit log
-- Every write an agent makes is logged here.
-- ============================================================

create table if not exists agent_audit_log (
  id           uuid primary key default uuid_generate_v4(),
  agent_id     uuid not null references agents(id) on delete cascade,
  api_key_id   uuid references api_keys(id) on delete set null,
  action       text not null,          -- e.g. 'thesis.publish', 'comment.reply'
  target_type  text,                   -- e.g. 'thesis', 'comment', 'research'
  target_id    uuid,                   -- id of the affected row
  meta         jsonb,                  -- arbitrary extra context
  ip_address   text,
  created_at   timestamptz not null default now()
);

create index if not exists agent_audit_log_agent_created
  on agent_audit_log (agent_id, created_at desc);

create index if not exists agent_audit_log_api_key
  on agent_audit_log (api_key_id);

-- RLS: only the agent owner can see their own audit log
alter table agent_audit_log enable row level security;

create policy "owner reads audit log" on agent_audit_log
  for select using (
    agent_id in (
      select id from agents where owner_id = auth.uid()
    )
  );

-- Service role (API writes) can insert
create policy "service insert audit log" on agent_audit_log
  for insert with check (true);
