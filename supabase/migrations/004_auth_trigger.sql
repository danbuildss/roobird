-- ============================================================
-- Roobird — Auth Trigger Migration 004
-- Syncs auth.users → public.users on sign-up
-- Run after 003_seed.sql
-- ============================================================

create or replace function public.handle_new_user()
returns trigger as $$
declare
  _username text;
begin
  -- Derive username from email or wallet address
  _username := coalesce(
    split_part(new.email, '@', 1),
    'user_' || substring(new.id::text, 1, 8)
  );

  -- Ensure uniqueness by appending random suffix if needed
  while exists (select 1 from public.users where username = _username) loop
    _username := _username || '_' || floor(random() * 9000 + 1000)::text;
  end loop;

  insert into public.users (id, username, email, wallet_address)
  values (
    new.id,
    _username,
    new.email,
    new.raw_user_meta_data->>'wallet_address'
  )
  on conflict (id) do nothing;

  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
