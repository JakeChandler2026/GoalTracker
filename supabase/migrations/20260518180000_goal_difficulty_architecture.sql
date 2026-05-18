do $$
begin
  if not exists (select 1 from pg_type where typname = 'goal_difficulty') then
    create type public.goal_difficulty as enum ('easy', 'medium', 'hard');
  end if;

  if not exists (select 1 from pg_type where typname = 'goal_category') then
    create type public.goal_category as enum ('physical', 'spiritual', 'intellectual', 'social');
  end if;
end $$;

alter table public.goals
  add column if not exists difficulty public.goal_difficulty not null default 'medium',
  add column if not exists category public.goal_category not null default 'spiritual';

alter table public.goal_templates
  add column if not exists difficulty public.goal_difficulty not null default 'medium',
  add column if not exists category public.goal_category not null default 'spiritual';

alter table public.required_level_goals
  add column if not exists difficulty public.goal_difficulty not null default 'medium',
  add column if not exists category public.goal_category not null default 'spiritual';

update public.goals
set difficulty = case
  when points >= 90 then 'hard'::public.goal_difficulty
  when points >= 50 then 'medium'::public.goal_difficulty
  else 'easy'::public.goal_difficulty
end
where difficulty is null or difficulty = 'medium';

update public.goal_templates
set difficulty = case
  when points >= 90 then 'hard'::public.goal_difficulty
  when points >= 50 then 'medium'::public.goal_difficulty
  else 'easy'::public.goal_difficulty
end
where difficulty is null or difficulty = 'medium';

update public.required_level_goals
set category = 'spiritual'::public.goal_category,
    difficulty = case
      when lower(title) = lower('Read the Book of Mormon') then 'hard'::public.goal_difficulty
      else difficulty
    end
where level = 1;

drop table if exists public.level_goal_requirements;

create table public.level_goal_requirements (
  level integer not null check (level > 0),
  category public.goal_category not null,
  easy_required integer not null default 0 check (easy_required >= 0),
  medium_required integer not null default 0 check (medium_required >= 0),
  hard_required integer not null default 0 check (hard_required >= 0),
  updated_by uuid references public.profiles(id) on delete set null,
  updated_at timestamptz not null default now(),
  primary key (level, category)
);

insert into public.level_goal_requirements (level, category, easy_required, medium_required, hard_required)
values
  (1, 'physical', 1, 0, 0),
  (1, 'spiritual', 1, 1, 0),
  (1, 'intellectual', 1, 0, 0),
  (1, 'social', 1, 0, 0),
  (2, 'physical', 1, 1, 0),
  (2, 'spiritual', 1, 1, 1),
  (2, 'intellectual', 1, 1, 0),
  (2, 'social', 1, 1, 0),
  (3, 'physical', 1, 1, 1),
  (3, 'spiritual', 1, 2, 1),
  (3, 'intellectual', 1, 1, 1),
  (3, 'social', 1, 1, 1)
on conflict (level, category) do nothing;

alter table public.level_goal_requirements enable row level security;

drop policy if exists "level_goal_requirements_read_all" on public.level_goal_requirements;
create policy "level_goal_requirements_read_all"
on public.level_goal_requirements
for select
using (true);

drop policy if exists "level_goal_requirements_write_bishops_admins" on public.level_goal_requirements;
create policy "level_goal_requirements_write_bishops_admins"
on public.level_goal_requirements
for all
using (public.current_user_role() in ('bishop', 'administrator'))
with check (public.current_user_role() in ('bishop', 'administrator'));

comment on table public.level_goal_requirements is 'Configurable counts of easy, medium, and hard completed goals required in each category for each attainment level.';

with required_assignments as (
  select
    youth.id as youth_id,
    goal.id as required_goal_id,
    goal.level,
    goal.title,
    goal.summary,
    goal.points,
    goal.difficulty,
    goal.category,
    goal.deadline_days,
    goal.created_by
  from public.required_level_goals goal
  join public.profiles youth on youth.ward_id = goal.ward_id
  where youth.role = 'youth'
    and goal.level = 1
    and not exists (
      select 1
      from public.goals existing
      where existing.youth_id = youth.id
        and existing.required_goal_definition_id = goal.id
    )
),
inserted_goals as (
  insert into public.goals (
    youth_id,
    created_by,
    required_goal_definition_id,
    required_goal_level,
    title,
    summary,
    points,
    difficulty,
    category,
    priority_order,
    goal_approved,
    goal_approved_by,
    goal_approved_at,
    deadline
  )
  select
    assignment.youth_id,
    assignment.created_by,
    assignment.required_goal_id,
    assignment.level,
    assignment.title,
    assignment.summary,
    assignment.points,
    assignment.difficulty,
    assignment.category,
    coalesce((
      select max(existing.priority_order)
      from public.goals existing
      where existing.youth_id = assignment.youth_id
    ), 0) + (row_number() over (partition by assignment.youth_id order by assignment.required_goal_id) * 100),
    true,
    assignment.created_by,
    now(),
    current_date + assignment.deadline_days
  from required_assignments assignment
  returning id, required_goal_definition_id
)
insert into public.goal_checklist_items (goal_id, title, repeat_count, sort_order)
select
  inserted_goals.id,
  required_item.title,
  required_item.repeat_count,
  required_item.sort_order
from inserted_goals
join public.required_level_goal_checklist_items required_item
  on required_item.required_goal_id = inserted_goals.required_goal_definition_id
on conflict do nothing;
