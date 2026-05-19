alter table public.level_goal_requirements
  add column if not exists ward_id uuid references public.wards(id) on delete cascade;

alter table public.level_goal_requirements
  drop constraint if exists level_goal_requirements_pkey;

with default_requirements (level, category, easy_required, medium_required, hard_required) as (
  values
    (1, 'physical'::public.goal_category, 1, 0, 0),
    (1, 'spiritual'::public.goal_category, 1, 1, 0),
    (1, 'intellectual'::public.goal_category, 1, 0, 0),
    (1, 'social'::public.goal_category, 1, 0, 0),
    (2, 'physical'::public.goal_category, 1, 1, 0),
    (2, 'spiritual'::public.goal_category, 1, 1, 1),
    (2, 'intellectual'::public.goal_category, 1, 1, 0),
    (2, 'social'::public.goal_category, 1, 1, 0),
    (3, 'physical'::public.goal_category, 1, 1, 1),
    (3, 'spiritual'::public.goal_category, 1, 2, 1),
    (3, 'intellectual'::public.goal_category, 1, 1, 1),
    (3, 'social'::public.goal_category, 1, 1, 1)
), global_requirements as (
  select level, category, easy_required, medium_required, hard_required, updated_by
  from public.level_goal_requirements
  where ward_id is null
), source_requirements as (
  select
    default_requirements.level,
    default_requirements.category,
    coalesce(global_requirements.easy_required, default_requirements.easy_required) as easy_required,
    coalesce(global_requirements.medium_required, default_requirements.medium_required) as medium_required,
    coalesce(global_requirements.hard_required, default_requirements.hard_required) as hard_required,
    global_requirements.updated_by
  from default_requirements
  left join global_requirements
    on global_requirements.level = default_requirements.level
   and global_requirements.category = default_requirements.category
)
insert into public.level_goal_requirements (
  ward_id,
  level,
  category,
  easy_required,
  medium_required,
  hard_required,
  updated_by
)
select
  wards.id,
  source_requirements.level,
  source_requirements.category,
  source_requirements.easy_required,
  source_requirements.medium_required,
  source_requirements.hard_required,
  source_requirements.updated_by
from public.wards
cross join source_requirements
where not exists (
  select 1
  from public.level_goal_requirements existing
  where existing.ward_id = wards.id
    and existing.level = source_requirements.level
    and existing.category = source_requirements.category
);

delete from public.level_goal_requirements
where ward_id is null;

alter table public.level_goal_requirements
  alter column ward_id set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'level_goal_requirements_pkey'
      and conrelid = 'public.level_goal_requirements'::regclass
  ) then
    alter table public.level_goal_requirements
      add constraint level_goal_requirements_pkey primary key (ward_id, level, category);
  end if;
end $$;

create index if not exists idx_level_goal_requirements_ward
on public.level_goal_requirements(ward_id);

drop policy if exists "level_goal_requirements_read_all" on public.level_goal_requirements;
drop policy if exists "level_goal_requirements_read_by_ward" on public.level_goal_requirements;
create policy "level_goal_requirements_read_by_ward"
on public.level_goal_requirements
for select
using (
  public.current_user_role() = 'administrator'
  or ward_id = public.current_user_ward_id()
);

drop policy if exists "level_goal_requirements_write_bishops_admins" on public.level_goal_requirements;
drop policy if exists "level_goal_requirements_write_by_ward" on public.level_goal_requirements;
create policy "level_goal_requirements_write_by_ward"
on public.level_goal_requirements
for all
using (
  public.current_user_role() = 'administrator'
  or (
    public.current_user_role() = 'bishop'
    and ward_id = public.current_user_ward_id()
  )
)
with check (
  public.current_user_role() = 'administrator'
  or (
    public.current_user_role() = 'bishop'
    and ward_id = public.current_user_ward_id()
  )
);

comment on table public.level_goal_requirements is 'Ward-scoped configurable counts of easy, medium, and hard completed goals required in each category for each attainment level.';
