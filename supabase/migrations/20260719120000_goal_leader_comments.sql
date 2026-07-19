alter table public.goals
  add column if not exists leader_comment text not null default '';

comment on column public.goals.leader_comment is 'Optional youth-visible leader note saved when a completed goal receives final approval.';
