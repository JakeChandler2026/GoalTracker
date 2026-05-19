alter table public.profiles
  add column if not exists last_active_at timestamptz;

create table if not exists public.notification_preferences (
  profile_id uuid primary key references public.profiles(id) on delete cascade,
  same_goal_in_app boolean not null default true,
  same_goal_email boolean not null default false,
  same_goal_push boolean not null default false,
  inactivity_reminders_enabled boolean not null default false,
  inactivity_in_app boolean not null default true,
  inactivity_email boolean not null default false,
  inactivity_push boolean not null default false,
  inactivity_min_hours integer not null default 24 check (inactivity_min_hours between 24 and 96),
  inactivity_max_hours integer not null default 96 check (inactivity_max_hours between 24 and 96),
  next_inactivity_reminder_at timestamptz not null default (now() + ((24 + floor(random() * 73))::text || ' hours')::interval),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (inactivity_max_hours >= inactivity_min_hours)
);

create table if not exists public.user_push_tokens (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  provider text not null default 'expo' check (provider in ('expo')),
  token text not null,
  device_label text,
  enabled boolean not null default true,
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (profile_id, token)
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete set null,
  goal_id uuid references public.goals(id) on delete set null,
  type text not null default 'same_goal_passed' check (type in ('same_goal_passed', 'weekly_summary', 'inactivity_reminder')),
  goal_title text not null default 'Goal update',
  message text not null,
  recipient_email text,
  channels jsonb not null default '{"inApp": true, "email": false, "push": false}'::jsonb,
  status text not null default 'queued' check (status in ('queued', 'sent', 'partially_sent', 'in_app', 'failed')),
  read_at timestamptz,
  sent_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_user_push_tokens_profile_enabled on public.user_push_tokens(profile_id, enabled);
create index if not exists idx_notifications_recipient_created on public.notifications(recipient_id, created_at desc);
create index if not exists idx_notification_preferences_due_inactivity
  on public.notification_preferences(next_inactivity_reminder_at)
  where inactivity_reminders_enabled = true;

alter table public.notification_preferences enable row level security;
alter table public.user_push_tokens enable row level security;
alter table public.notifications enable row level security;

drop policy if exists "notification_preferences_self_read" on public.notification_preferences;
create policy "notification_preferences_self_read"
on public.notification_preferences
for select
using (profile_id = public.current_profile_id() or public.current_user_role() = 'administrator');

drop policy if exists "notification_preferences_self_write" on public.notification_preferences;
create policy "notification_preferences_self_write"
on public.notification_preferences
for all
using (profile_id = public.current_profile_id())
with check (profile_id = public.current_profile_id());

drop policy if exists "user_push_tokens_self_read" on public.user_push_tokens;
create policy "user_push_tokens_self_read"
on public.user_push_tokens
for select
using (profile_id = public.current_profile_id());

drop policy if exists "user_push_tokens_self_write" on public.user_push_tokens;
create policy "user_push_tokens_self_write"
on public.user_push_tokens
for all
using (profile_id = public.current_profile_id())
with check (profile_id = public.current_profile_id());

drop policy if exists "notifications_self_read" on public.notifications;
create policy "notifications_self_read"
on public.notifications
for select
using (recipient_id = public.current_profile_id());

drop policy if exists "notifications_self_update_read_state" on public.notifications;
create policy "notifications_self_update_read_state"
on public.notifications
for update
using (recipient_id = public.current_profile_id())
with check (recipient_id = public.current_profile_id());

create or replace function public.random_inactivity_reminder_at(min_hours integer default 24, max_hours integer default 96)
returns timestamptz
language sql
volatile
as $$
  select now() + ((least(96, greatest(24, min_hours)) + floor(random() * (least(96, greatest(24, max_hours)) - least(96, greatest(24, min_hours)) + 1)))::text || ' hours')::interval;
$$;

create or replace function public.touch_profile_activity(target_profile_id uuid default public.current_profile_id())
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if target_profile_id is null or target_profile_id <> public.current_profile_id() then
    raise exception 'You can only update your own activity.';
  end if;

  update public.profiles
  set last_active_at = now(),
      updated_at = now()
  where id = target_profile_id;

  insert into public.notification_preferences (profile_id)
  values (target_profile_id)
  on conflict (profile_id) do nothing;

  update public.notification_preferences
  set next_inactivity_reminder_at = public.random_inactivity_reminder_at(inactivity_min_hours, inactivity_max_hours),
      updated_at = now()
  where profile_id = target_profile_id
    and inactivity_reminders_enabled = true;
end;
$$;

grant execute on function public.touch_profile_activity(uuid) to authenticated;

insert into public.notification_preferences (profile_id, same_goal_in_app, same_goal_email, same_goal_push)
select id, true, false, false
from public.profiles
on conflict (profile_id) do nothing;

comment on table public.notification_preferences is 'Per-user notification channel choices for same-goal alerts and inactivity reminders.';
comment on table public.user_push_tokens is 'Mobile push tokens registered by signed-in users, initially for Expo push delivery.';
comment on table public.notifications is 'Durable in-app notification inbox and delivery queue history.';
