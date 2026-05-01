create table if not exists public.stakes (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);

insert into public.stakes (name)
values ('Default Stake')
on conflict (name) do nothing;

alter table if exists public.wards
  add column if not exists stake_id uuid references public.stakes(id) on delete restrict;

update public.wards
set stake_id = (select id from public.stakes where name = 'Default Stake' limit 1)
where stake_id is null;

alter table if exists public.wards
  alter column stake_id set not null;

alter table if exists public.profiles
  add column if not exists competition_opt_in boolean not null default true;

create index if not exists idx_wards_stake_id on public.wards(stake_id);

alter table public.stakes enable row level security;

drop policy if exists "stakes_authenticated_read" on public.stakes;
create policy "stakes_authenticated_read"
  on public.stakes
  for select
  to authenticated
  using (true);

drop policy if exists "stakes_authenticated_insert" on public.stakes;
create policy "stakes_authenticated_insert"
  on public.stakes
  for insert
  to authenticated
  with check (public.current_user_role() = 'administrator');

drop policy if exists "stakes_authenticated_update" on public.stakes;
create policy "stakes_authenticated_update"
  on public.stakes
  for update
  to authenticated
  using (public.current_user_role() = 'administrator')
  with check (public.current_user_role() = 'administrator');
