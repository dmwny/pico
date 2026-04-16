create or replace function public.get_my_league_membership()
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_week_id uuid;
  v_result json;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    return null;
  end if;

  select id into v_week_id
  from public.league_weeks
  where is_current = true
  limit 1;

  if v_week_id is null then
    return null;
  end if;

  select json_build_object(
    'membership', row_to_json(lm.*),
    'league', row_to_json(l.*),
    'week', row_to_json(lw.*)
  ) into v_result
  from public.league_memberships lm
  join public.leagues l on l.id = lm.league_id
  join public.league_weeks lw on lw.id = lm.league_week_id
  where lm.user_id = v_user_id
  and lm.league_week_id = v_week_id
  limit 1;

  return v_result;
end;
$$;

grant execute on function public.get_my_league_membership() to authenticated;
