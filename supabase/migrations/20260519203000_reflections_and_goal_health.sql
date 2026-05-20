alter table public.goal_templates
  add column if not exists reflection_prompt text not null default '';

alter table public.required_level_goals
  add column if not exists reflection_prompt text not null default '';

alter table public.goals
  add column if not exists reflection_prompt text not null default '',
  add column if not exists reflection_response text not null default '';

update public.goal_templates
set reflection_prompt = case category
  when 'spiritual' then 'What did this goal help you learn about Jesus Christ, your covenants, or your faith?'
  when 'social' then 'How did this goal help you notice, serve, include, or strengthen another person?'
  when 'intellectual' then 'What did you learn, and how could you use that knowledge to bless others?'
  when 'physical' then 'What did this goal teach you about caring for your body and using discipline wisely?'
  else 'What did you learn from completing this goal?'
end
where coalesce(reflection_prompt, '') = '';

update public.required_level_goals
set reflection_prompt = case category
  when 'spiritual' then 'What did this required goal help you learn about Jesus Christ, your covenants, or your faith?'
  when 'social' then 'How did this required goal help you notice, serve, include, or strengthen another person?'
  when 'intellectual' then 'What did you learn, and how could you use that knowledge to bless others?'
  when 'physical' then 'What did this required goal teach you about caring for your body and using discipline wisely?'
  else 'What did you learn from completing this required goal?'
end
where coalesce(reflection_prompt, '') = '';

comment on column public.goal_templates.reflection_prompt is 'Prompt shown to youth when a template-based goal asks for completion reflection.';
comment on column public.required_level_goals.reflection_prompt is 'Prompt shown to youth when a required level goal asks for completion reflection.';
comment on column public.goals.reflection_prompt is 'Prompt copied onto a youth goal for completion reflection.';
comment on column public.goals.reflection_response is 'Youth-written reflection response for the goal.';
