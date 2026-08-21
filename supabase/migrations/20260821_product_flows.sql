-- Roobird product-flow compatibility migration
-- Run once in the Supabase SQL editor before deploying the matching app release.

-- The composer supports research and question stances in addition to directional views.
alter table public.theses
  drop constraint if exists theses_stance_check;

alter table public.theses
  add constraint theses_stance_check
  check (stance in ('bullish', 'bearish', 'neutral', 'research', 'question'));

-- Keep public profiles synchronized when auth metadata is updated by the Privy bridge.
create or replace function public.handle_user_metadata_update()
returns trigger as $$
begin
  update public.users
  set
    wallet_address = coalesce(new.raw_user_meta_data->>'wallet_address', wallet_address),
    updated_at = now()
  where id = new.id;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists on_auth_user_metadata_updated on auth.users;
create trigger on_auth_user_metadata_updated
  after update of raw_user_meta_data on auth.users
  for each row execute function public.handle_user_metadata_update();
