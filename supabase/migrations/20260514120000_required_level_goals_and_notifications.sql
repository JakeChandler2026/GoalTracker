create table if not exists public.required_level_goals (
  id uuid primary key default gen_random_uuid(),
  ward_id uuid not null references public.wards(id) on delete cascade,
  level integer not null check (level between 1 and 3),
  title text not null,
  summary text not null,
  reflection_prompt text not null default '',
  points integer not null default 0 check (points >= 0),
  deadline_days integer not null default 30 check (deadline_days > 0),
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (ward_id, level, title)
);

create table if not exists public.required_level_goal_checklist_items (
  id uuid primary key default gen_random_uuid(),
  required_goal_id uuid not null references public.required_level_goals(id) on delete cascade,
  title text not null,
  repeat_count integer not null check (repeat_count > 0),
  sort_order integer not null default 0,
  unique (required_goal_id, sort_order)
);

alter table if exists public.goals
  add column if not exists required_goal_definition_id uuid references public.required_level_goals(id) on delete set null,
  add column if not exists required_goal_level integer check (required_goal_level is null or required_goal_level between 1 and 3);

create index if not exists idx_required_level_goals_ward_level on public.required_level_goals(ward_id, level);
create index if not exists idx_required_level_goal_items_goal on public.required_level_goal_checklist_items(required_goal_id, sort_order);
create index if not exists idx_goals_required_goal on public.goals(required_goal_definition_id, required_goal_level);

alter table public.required_level_goals enable row level security;
alter table public.required_level_goal_checklist_items enable row level security;

drop policy if exists "required_level_goals_read_by_ward" on public.required_level_goals;
create policy "required_level_goals_read_by_ward"
on public.required_level_goals
for select
using (
  public.current_user_role() = 'administrator'
  or exists (
    select 1
    from public.profiles actor
    where actor.id = public.current_profile_id()
      and actor.ward_id = required_level_goals.ward_id
  )
);

drop policy if exists "required_level_goals_write_by_bishop" on public.required_level_goals;
create policy "required_level_goals_write_by_bishop"
on public.required_level_goals
for all
using (
  public.current_user_role() = 'bishop'
  and exists (
    select 1
    from public.profiles actor
    where actor.id = public.current_profile_id()
      and actor.ward_id = required_level_goals.ward_id
  )
)
with check (
  public.current_user_role() = 'bishop'
  and exists (
    select 1
    from public.profiles actor
    where actor.id = public.current_profile_id()
      and actor.ward_id = required_level_goals.ward_id
  )
);

drop policy if exists "required_level_goal_items_read_by_goal_access" on public.required_level_goal_checklist_items;
create policy "required_level_goal_items_read_by_goal_access"
on public.required_level_goal_checklist_items
for select
using (
  exists (
    select 1
    from public.required_level_goals goal
    join public.profiles actor on actor.id = public.current_profile_id()
    where goal.id = required_level_goal_checklist_items.required_goal_id
      and (public.current_user_role() = 'administrator' or actor.ward_id = goal.ward_id)
  )
);

drop policy if exists "required_level_goal_items_write_by_bishop" on public.required_level_goal_checklist_items;
create policy "required_level_goal_items_write_by_bishop"
on public.required_level_goal_checklist_items
for all
using (
  exists (
    select 1
    from public.required_level_goals goal
    join public.profiles actor on actor.id = public.current_profile_id()
    where goal.id = required_level_goal_checklist_items.required_goal_id
      and public.current_user_role() = 'bishop'
      and actor.ward_id = goal.ward_id
  )
)
with check (
  exists (
    select 1
    from public.required_level_goals goal
    join public.profiles actor on actor.id = public.current_profile_id()
    where goal.id = required_level_goal_checklist_items.required_goal_id
      and public.current_user_role() = 'bishop'
      and actor.ward_id = goal.ward_id
  )
);

with bishop_by_ward as (
  select distinct on (ward_id) id, ward_id
  from public.profiles
  where role = 'bishop'
  order by ward_id, created_at
),
seeded_required_goal as (
  insert into public.required_level_goals (ward_id, level, title, summary, points, deadline_days, created_by)
  select
    ward.id,
    1,
    'Read the Book of Mormon',
    'Read the Book of Mormon in its entirety in less than one year.',
    0,
    365,
    bishop_by_ward.id
  from public.wards ward
  join bishop_by_ward on bishop_by_ward.ward_id = ward.id
  where ward.name in ('Mapleton 1st Ward', 'Pocatello Creek Ward')
  on conflict (ward_id, level, title) do update
    set summary = excluded.summary,
        points = excluded.points,
        deadline_days = excluded.deadline_days,
        updated_at = now()
  returning id
),
book_counts(book_name, chapter_count, book_order) as (
  values
    ('1 Nephi', 22, 1),
    ('2 Nephi', 33, 2),
    ('Jacob', 7, 3),
    ('Enos', 1, 4),
    ('Jarom', 1, 5),
    ('Omni', 1, 6),
    ('Words of Mormon', 1, 7),
    ('Mosiah', 29, 8),
    ('Alma', 63, 9),
    ('Helaman', 16, 10),
    ('3 Nephi', 30, 11),
    ('4 Nephi', 1, 12),
    ('Mormon', 9, 13),
    ('Ether', 15, 14),
    ('Moroni', 10, 15)
),
book_offsets as (
  select
    book_name,
    chapter_count,
    book_order,
    coalesce(sum(chapter_count) over (order by book_order rows between unbounded preceding and 1 preceding), 0)::integer as chapter_offset
  from book_counts
),
chapters as (
  select
    seeded_required_goal.id as required_goal_id,
    book_offsets.book_name || ' ' || chapter_number as title,
    1 as repeat_count,
    book_offsets.chapter_offset + chapter_number - 1 as sort_order
  from seeded_required_goal
  cross join book_offsets
  cross join generate_series(1, book_offsets.chapter_count) as chapter_number
)
insert into public.required_level_goal_checklist_items (required_goal_id, title, repeat_count, sort_order)
select required_goal_id, title, repeat_count, coalesce(sort_order, 0)
from chapters
on conflict do nothing;

comment on table public.required_level_goals is 'Bishop-owned required goals that must be completed for level attainment in addition to point thresholds.';
