alter table public.execution_partners add column if not exists provider_key text;
alter table public.execution_partners add column if not exists capabilities jsonb not null default '[]'::jsonb;

create unique index if not exists execution_partners_provider_key_idx
  on public.execution_partners(provider_key) where provider_key is not null;

create table if not exists public.execution_intents (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  asset_id uuid not null references public.assets(id),
  provider_id uuid not null references public.execution_partners(id),
  execution_mode text not null check (execution_mode in ('external_handoff', 'unsigned_transaction', 'provider_wallet_execution')),
  source_wallet text not null check (source_wallet ~ '^0x[0-9a-f]{40}$'),
  destination_wallet text not null check (destination_wallet ~ '^0x[0-9a-f]{40}$'),
  requested_amount numeric not null check (requested_amount > 0),
  estimated_output numeric,
  provider_reference text,
  transaction_hash text,
  status text not null check (status in ('preparing', 'awaiting_signature', 'submitting', 'pending', 'confirmed', 'failed', 'cancelled', 'external_handoff')),
  error_code text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.execution_intents enable row level security;

drop policy if exists "Execution intents visible to owner" on public.execution_intents;
create policy "Execution intents visible to owner"
  on public.execution_intents for select using (auth.uid() = user_id);

drop policy if exists "Execution intents insertable by owner" on public.execution_intents;
create policy "Execution intents insertable by owner"
  on public.execution_intents for insert with check (auth.uid() = user_id);

create index if not exists execution_intents_user_created_idx
  on public.execution_intents(user_id, created_at desc);

insert into public.execution_partners (name, description, website_url, provider_key, capabilities)
values ('Bankr', 'Execution provider for Roobird handoff flows.', 'https://bankr.bot', 'bankr', '["external_handoff"]'::jsonb)
on conflict (provider_key) where provider_key is not null do update set
  name = excluded.name,
  description = excluded.description,
  website_url = excluded.website_url,
  capabilities = excluded.capabilities,
  is_active = true;

insert into public.provider_assets (provider_id, asset_id, supported_network, execution_method, deep_link_template)
select ep.id, a.id, 'Robinhood Chain', 'external_handoff', 'https://bankr.bot'
from public.execution_partners ep
join public.assets a
  on a.symbol in ('NVDA', 'AAPL', 'TSLA')
  and a.chain_id = 4663
  and a.is_active = true
where ep.provider_key = 'bankr'
on conflict (provider_id, asset_id) do update set
  supported_network = excluded.supported_network,
  execution_method = excluded.execution_method,
  deep_link_template = excluded.deep_link_template;
