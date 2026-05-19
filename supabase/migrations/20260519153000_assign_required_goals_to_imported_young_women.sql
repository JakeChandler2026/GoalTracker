with imported_young_women (id) as (
  values
    ('2899c7b2-3644-5e6c-8c71-60e0a56518c1'::uuid),
    ('fd35bc77-df64-5552-9ae8-fb106c5b12e0'::uuid),
    ('fa184259-f86b-596c-8390-ce4c673cbb84'::uuid),
    ('fd2a2295-5803-545b-aca1-224ba594c7b0'::uuid),
    ('dffc5262-3a6e-54a8-8af8-e42f68e9746b'::uuid),
    ('21b3a061-6002-5d2f-9821-a65f7113c026'::uuid),
    ('1f7d3793-98cd-5deb-98e4-1ed86ee69f1a'::uuid),
    ('0bb4e78f-290c-5bd1-89b5-ed0cc824f4fe'::uuid),
    ('570df2f0-2964-5077-8065-fdf5e00bdffc'::uuid),
    ('3755ed3f-2e63-5559-840d-6cbc1c60e0bb'::uuid),
    ('d5c11ee5-d7c2-5b2f-a441-d22d963bdde5'::uuid),
    ('e2ee12dc-9e93-5806-8563-07ae6f4a6831'::uuid),
    ('ad4138c5-f283-52d9-bf68-e7c9fa912262'::uuid),
    ('23b6673e-9f37-5998-8315-31bf519c8b66'::uuid),
    ('f4667ffa-bff8-5f92-aeb0-59a25c3ae4bb'::uuid),
    ('5064fdb7-6eae-52b7-8b15-4ac075b26bbb'::uuid),
    ('9bbfaa84-39cc-51d3-897f-718ab838d349'::uuid),
    ('98d4d9a4-e209-5419-932b-37654a50fdc2'::uuid),
    ('c5d4c6fc-12e3-54d4-8c74-81da7ad635fb'::uuid),
    ('24fc10a7-3f6f-5923-82f2-a9f9f38ad115'::uuid),
    ('45646de8-07d3-5d38-ace8-e0f8882a2952'::uuid),
    ('f71f2065-6284-5b3b-b758-8febf4f383fa'::uuid),
    ('af5dd0bc-dc23-5097-b36f-9940ea53af32'::uuid)
), roster_profiles as (
  select profiles.id, profiles.ward_id
  from public.profiles profiles
  join imported_young_women on imported_young_women.id = profiles.id
  where profiles.role = 'youth'
    and profiles.organization = 'young_women'
), bishop_actor as (
  select profiles.id, profiles.ward_id
  from public.profiles profiles
  join roster_profiles on roster_profiles.ward_id = profiles.ward_id
  where profiles.role = 'bishop'
  order by profiles.created_at
  limit 1
), inserted_required_goals as (
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
    deadline,
    leader_approved
  )
  select
    roster_profiles.id,
    coalesce(bishop_actor.id, roster_profiles.id),
    required_level_goals.id,
    required_level_goals.level,
    required_level_goals.title,
    required_level_goals.summary,
    required_level_goals.points,
    required_level_goals.difficulty,
    required_level_goals.category,
    0,
    true,
    coalesce(bishop_actor.id, roster_profiles.id),
    now(),
    (current_date + required_level_goals.deadline_days)::date,
    false
  from roster_profiles
  join public.required_level_goals on required_level_goals.ward_id = roster_profiles.ward_id
    and required_level_goals.level = 1
  left join bishop_actor on bishop_actor.ward_id = roster_profiles.ward_id
  where not exists (
    select 1
    from public.goals existing_goal
    where existing_goal.youth_id = roster_profiles.id
      and existing_goal.required_goal_definition_id = required_level_goals.id
  )
  returning id, required_goal_definition_id
), assigned_required_goals as (
  select inserted_required_goals.id, inserted_required_goals.required_goal_definition_id
  from inserted_required_goals
  union
  select goals.id, goals.required_goal_definition_id
  from public.goals goals
  join roster_profiles on roster_profiles.id = goals.youth_id
  join public.required_level_goals on required_level_goals.id = goals.required_goal_definition_id
  where required_level_goals.level = 1
)
insert into public.goal_checklist_items (goal_id, title, repeat_count, sort_order)
select
  assigned_required_goals.id,
  required_items.title,
  required_items.repeat_count,
  required_items.sort_order
from assigned_required_goals
join public.required_level_goal_checklist_items required_items
  on required_items.required_goal_id = assigned_required_goals.required_goal_definition_id
where not exists (
  select 1
  from public.goal_checklist_items existing_item
  where existing_item.goal_id = assigned_required_goals.id
    and existing_item.sort_order = required_items.sort_order
);
