update public.goals
set reflection_prompt = case category
  when 'spiritual' then 'What did this goal help you learn about Jesus Christ, your covenants, or your faith?'
  when 'social' then 'How did this goal help you notice, serve, include, or strengthen another person?'
  when 'intellectual' then 'What did you learn, and how could you use that knowledge to bless others?'
  when 'physical' then 'What did this goal teach you about caring for your body and using discipline wisely?'
  else 'What did you learn from completing this goal?'
end
where coalesce(reflection_prompt, '') = '';
