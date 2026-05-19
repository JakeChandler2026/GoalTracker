alter table public.goal_templates
  add column if not exists duration_days integer not null default 30 check (duration_days > 0);

update public.goal_templates
set duration_days = 90
where lower(title) like '%scripture%'
  and duration_days = 30;

comment on column public.goal_templates.duration_days is 'Default number of days a youth has to complete a goal after this template is assigned.';
