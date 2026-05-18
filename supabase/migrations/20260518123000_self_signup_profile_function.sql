drop policy if exists "wards_authenticated_read" on public.wards;
create policy "wards_public_read"
on public.wards
for select
using (true);

create or replace function public.create_self_signup_profile(
  requested_role public.app_role,
  requested_full_name text,
  requested_ward_id uuid,
  requested_organization public.organization_type,
  requested_competition_opt_in boolean default false
)
returns table (
  id uuid,
  auth_user_id uuid,
  email text,
  full_name text,
  role public.app_role,
  organization public.organization_type,
  approval_status public.approval_state,
  competition_opt_in boolean,
  ward_id uuid,
  ward_name text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  current_auth_id uuid := auth.uid();
  current_email text := lower(coalesce(auth.jwt() ->> 'email', ''));
  existing_profile public.profiles%rowtype;
  resolved_org public.organization_type;
  resolved_status public.approval_state;
begin
  if current_auth_id is null or current_email = '' then
    raise exception 'A signed-in auth user with an email is required.';
  end if;

  if requested_role not in ('youth', 'youth_leader', 'bishop', 'parent') then
    raise exception 'That role cannot self sign up.';
  end if;

  if nullif(trim(requested_full_name), '') is null then
    raise exception 'Full name is required.';
  end if;

  if not exists (select 1 from public.wards where wards.id = requested_ward_id) then
    raise exception 'Please choose an existing ward.';
  end if;

  resolved_org := case
    when requested_role in ('bishop', 'parent') then 'all'::public.organization_type
    else requested_organization
  end;

  if requested_role in ('youth', 'youth_leader') and resolved_org not in ('young_men', 'young_women') then
    raise exception 'Organization must be Young Men or Young Women.';
  end if;

  resolved_status := case
    when requested_role = 'youth_leader' then 'pending'::public.approval_state
    else 'verified'::public.approval_state
  end;

  select *
    into existing_profile
  from public.profiles
  where lower(profiles.email) = current_email
     or profiles.id = current_auth_id
     or profiles.auth_user_id = current_auth_id
  order by case when profiles.auth_user_id = current_auth_id then 0 else 1 end
  limit 1;

  if existing_profile.id is not null then
    if existing_profile.auth_user_id is not null and existing_profile.auth_user_id <> current_auth_id then
      raise exception 'That email is already linked to another login.';
    end if;

    update public.profiles
    set auth_user_id = current_auth_id,
        email = current_email,
        updated_at = now()
    where profiles.id = existing_profile.id;
  else
    insert into public.profiles (
      id,
      auth_user_id,
      email,
      full_name,
      role,
      ward_id,
      organization,
      approval_status,
      competition_opt_in
    )
    values (
      current_auth_id,
      current_auth_id,
      current_email,
      trim(requested_full_name),
      requested_role,
      requested_ward_id,
      resolved_org,
      resolved_status,
      coalesce(requested_competition_opt_in, false)
    );
  end if;

  return query
  select
    profile.id,
    profile.auth_user_id,
    profile.email,
    profile.full_name,
    profile.role,
    profile.organization,
    profile.approval_status,
    profile.competition_opt_in,
    profile.ward_id,
    ward.name as ward_name
  from public.profiles profile
  join public.wards ward on ward.id = profile.ward_id
  where profile.auth_user_id = current_auth_id
     or profile.id = current_auth_id
  limit 1;
end;
$$;

grant execute on function public.create_self_signup_profile(public.app_role, text, uuid, public.organization_type, boolean) to authenticated;

