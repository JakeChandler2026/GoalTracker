drop policy if exists "notification_preferences_self_read" on public.notification_preferences;
create policy "notification_preferences_self_or_same_ward_read"
on public.notification_preferences
for select
using (
  profile_id = public.current_profile_id()
  or public.current_user_role() = 'administrator'
  or exists (
    select 1
    from public.profiles actor
    join public.profiles target on target.id = notification_preferences.profile_id
    where actor.id = public.current_profile_id()
      and actor.ward_id = target.ward_id
      and actor.role in ('youth', 'youth_leader', 'bishop')
  )
);
