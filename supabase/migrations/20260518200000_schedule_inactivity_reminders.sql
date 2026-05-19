create schema if not exists vault;
create extension if not exists supabase_vault with schema vault;
create extension if not exists pg_cron with schema extensions;
create extension if not exists pg_net with schema extensions;

do $$
begin
  if not exists (select 1 from vault.decrypted_secrets where name = 'goal_tracker_project_url') then
    perform vault.create_secret('https://eeapmjwygwgtvhlwbcmo.supabase.co', 'goal_tracker_project_url');
  end if;

  if not exists (select 1 from vault.decrypted_secrets where name = 'goal_tracker_publishable_key') then
    perform vault.create_secret('sb_publishable_Uzq_F6cazXYiRQAF9S6_wg_40IAOVJP', 'goal_tracker_publishable_key');
  end if;
end;
$$;

do $$
begin
  perform cron.unschedule('goal-tracker-inactivity-reminders');
exception
  when others then null;
end;
$$;

select cron.schedule(
  'goal-tracker-inactivity-reminders',
  '17 * * * *',
  $$
    select net.http_post(
      url := (select decrypted_secret from vault.decrypted_secrets where name = 'goal_tracker_project_url') || '/functions/v1/send-inactivity-reminders',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'apikey', (select decrypted_secret from vault.decrypted_secrets where name = 'goal_tracker_publishable_key'),
        'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'goal_tracker_publishable_key')
      ),
      body := jsonb_build_object('scheduled_at', now())
    ) as request_id;
  $$
);
