create or replace function public.normalized_ward_name(value text)
returns text
language sql
immutable
as $$
  select trim(regexp_replace(regexp_replace(regexp_replace(lower(coalesce(value, '')), '&', 'and', 'g'), '(^|[[:space:]])ward($|[[:space:]])', ' ', 'g'), '\s+', ' ', 'g'));
$$;

do $$
declare
  duplicate_group record;
  duplicate_ward record;
  canonical_ward_id uuid;
  canonical_ward_name text;
begin
  for duplicate_group in
    select public.normalized_ward_name(name) as normalized_name
    from public.wards
    group by public.normalized_ward_name(name)
    having count(*) > 1
  loop
    select id, name
      into canonical_ward_id, canonical_ward_name
    from public.wards
    where public.normalized_ward_name(name) = duplicate_group.normalized_name
    order by
      case when name ~* '\mward\M' then 0 else 1 end,
      created_at nulls last,
      name
    limit 1;

    for duplicate_ward in
      select id
      from public.wards
      where public.normalized_ward_name(name) = duplicate_group.normalized_name
        and id <> canonical_ward_id
    loop
      update public.profiles
      set ward_id = canonical_ward_id,
          updated_at = now()
      where ward_id = duplicate_ward.id;

      update public.goal_templates
      set ward_id = canonical_ward_id,
          updated_at = now()
      where ward_id = duplicate_ward.id;

      update public.required_level_goals
      set ward_id = canonical_ward_id
      where ward_id = duplicate_ward.id
        and not exists (
          select 1
          from public.required_level_goals existing
          where existing.ward_id = canonical_ward_id
            and existing.level = public.required_level_goals.level
            and lower(existing.title) = lower(public.required_level_goals.title)
        );

      delete from public.required_level_goals
      where ward_id = duplicate_ward.id;

      delete from public.wards
      where id = duplicate_ward.id;
    end loop;
  end loop;
end $$;
