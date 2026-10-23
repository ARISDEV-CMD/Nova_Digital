-- Learning experience V1: activity, study plans, pace and privacy-safe social proof.
-- Quiz tables are extended here without removing the legacy lesson quiz flow.

alter table public.course_lessons
  add column if not exists estimated_minutes integer;
alter table public.profiles
  add column if not exists timezone text not null default 'Africa/Douala';

create table public.learning_experience_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);
insert into public.learning_experience_settings(key,value) values
  ('daily_activity_cap_seconds','36000'::jsonb),
  ('min_public_learners','10'::jsonb),
  ('pace_ahead_threshold','0.05'::jsonb),
  ('pace_behind_threshold','0.05'::jsonb),
  ('pace_far_behind_threshold','0.20'::jsonb),
  ('catch_up_multiplier','2'::jsonb),
  ('active_day_seconds','300'::jsonb)
on conflict(key) do nothing;
alter table public.learning_experience_settings enable row level security;

create table public.learning_events (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  lesson_id uuid references public.course_lessons(id) on delete set null,
  event_type text not null check(event_type in (
    'lesson_opened','lesson_completed','video_play','video_pause','video_progress',
    'quiz_started','quiz_submitted','session_heartbeat','plan_created','plan_paused','plan_resumed'
  )),
  occurred_at timestamptz not null default now(),
  active_seconds integer check(active_seconds is null or active_seconds between 0 and 30),
  metadata jsonb not null default '{}'::jsonb
);
create index learning_events_user_course_time_idx on public.learning_events(user_id,course_id,occurred_at desc);
create index learning_events_course_lesson_idx on public.learning_events(course_id,lesson_id,occurred_at);
create index learning_events_type_time_idx on public.learning_events(event_type,occurred_at);
create unique index learning_events_completion_once_idx on public.learning_events(user_id,lesson_id) where event_type='lesson_completed';
alter table public.learning_events enable row level security;
create policy learning_events_own_read on public.learning_events for select using(user_id=auth.uid());
create policy learning_events_admin_read on public.learning_events for select using(public.can_manage_catalog());

create table public.study_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  weekly_minutes integer not null check(weekly_minutes between 30 and 2400),
  preferred_days integer[] not null check(cardinality(preferred_days) between 1 and 7),
  start_date date not null,
  target_end_date date not null,
  status text not null default 'active' check(status in ('active','paused','completed','abandoned')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id,course_id),
  check(array_position(preferred_days,0) is null and array_position(preferred_days,8) is null)
);
create trigger study_plans_touch before update on public.study_plans for each row execute function public.touch_updated_at();
create table public.study_plan_pauses (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.study_plans(id) on delete cascade,
  starts_on date not null,
  ends_on date,
  check(ends_on is null or ends_on>=starts_on)
);
alter table public.study_plans enable row level security;
alter table public.study_plan_pauses enable row level security;
create policy study_plans_own_all on public.study_plans for all using(user_id=auth.uid()) with check(user_id=auth.uid());
create policy study_plan_pauses_own_all on public.study_plan_pauses for all using(exists(select 1 from public.study_plans p where p.id=plan_id and p.user_id=auth.uid())) with check(exists(select 1 from public.study_plans p where p.id=plan_id and p.user_id=auth.uid()));

create or replace function public.lesson_effort_minutes(p_lesson uuid)
returns integer language sql stable security definer set search_path=public as $$
  select coalesce(l.estimated_minutes, case l.lesson_type::text
    when 'video' then greatest(1,ceil(l.duration_minutes*1.5)::integer)
    when 'text' then greatest(1,l.duration_minutes)
    when 'quiz' then 10 when 'exercise' then 30 when 'project' then 60 else greatest(1,l.duration_minutes) end)
  from public.course_lessons l where l.id=p_lesson
$$;

create or replace function public.recalculate_study_plan(p_user uuid,p_course uuid,p_start date,p_weekly integer,p_days integer[])
returns date language plpgsql security definer set search_path=public as $$
declare v_total integer; v_days integer; v_daily numeric; v_sessions integer; v_day date; v_found integer:=0;
begin
  select coalesce(sum(public.lesson_effort_minutes(l.id)),0) into v_total
  from public.course_lessons l join public.course_chapters ch on ch.id=l.chapter_id
  join public.courses c on c.id=l.course_id and c.current_version_id=ch.version_id
  where c.id=p_course and c.status='published' and l.published;
  v_days:=cardinality(p_days);
  if v_total=0 or v_days=0 then return p_start; end if;
  v_daily:=p_weekly::numeric/v_days;
  v_sessions:=greatest(1,ceil(v_total/v_daily)::integer);
  v_day:=p_start;
  while v_found<v_sessions loop
    if extract(isodow from v_day)::integer=any(p_days) then v_found:=v_found+1; end if;
    if v_found<v_sessions then v_day:=v_day+1; end if;
    if v_day>p_start+3650 then raise exception 'Plan trop long'; end if;
  end loop;
  return v_day;
end $$;

create or replace function public.save_study_plan(p_course uuid,p_weekly_minutes integer,p_preferred_days integer[],p_start_date date default current_date)
returns uuid language plpgsql security definer set search_path=public as $$
declare v_id uuid; v_end date; v_uid uuid:=auth.uid();
begin
  if v_uid is null then raise exception 'Connexion requise'; end if;
  if p_weekly_minutes not between 30 and 2400 or cardinality(p_preferred_days) not between 1 and 7
     or exists(select 1 from unnest(p_preferred_days) d where d<1 or d>7) then raise exception 'Paramètres du plan invalides'; end if;
  if not public.can_access_course(p_course) then raise exception 'Un accès actif à cette formation est nécessaire pour créer un plan'; end if;
  v_end:=public.recalculate_study_plan(v_uid,p_course,p_start_date,p_weekly_minutes,p_preferred_days);
  insert into public.study_plans(user_id,course_id,weekly_minutes,preferred_days,start_date,target_end_date,status)
  values(v_uid,p_course,p_weekly_minutes,p_preferred_days,p_start_date,v_end,'active')
  on conflict(user_id,course_id) do update set weekly_minutes=excluded.weekly_minutes,preferred_days=excluded.preferred_days,
    start_date=excluded.start_date,target_end_date=excluded.target_end_date,status='active'
  returning id into v_id;
  insert into public.learning_events(user_id,course_id,event_type,metadata) values(v_uid,p_course,'plan_created',jsonb_build_object('weekly_minutes',p_weekly_minutes));
  return v_id;
end $$;

create or replace function public.set_study_plan_paused(p_course uuid,p_paused boolean)
returns void language plpgsql security definer set search_path=public as $$
declare v_plan public.study_plans%rowtype; v_uid uuid:=auth.uid(); v_today date; v_tz text;
begin
  select * into v_plan from public.study_plans where user_id=v_uid and course_id=p_course for update;
  if not found then raise exception 'Plan introuvable'; end if;
  select case when exists(select 1 from pg_timezone_names n where n.name=p.timezone) then p.timezone else 'Africa/Douala' end into v_tz from public.profiles p where p.id=v_uid;
  v_today:=(now() at time zone coalesce(v_tz,'Africa/Douala'))::date;
  if p_paused and v_plan.status='active' then
    update public.study_plans set status='paused' where id=v_plan.id;
    insert into public.study_plan_pauses(plan_id,starts_on) values(v_plan.id,v_today);
    insert into public.learning_events(user_id,course_id,event_type) values(v_uid,p_course,'plan_paused');
  elsif not p_paused and v_plan.status='paused' then
    update public.study_plan_pauses set ends_on=v_today where plan_id=v_plan.id and ends_on is null;
    update public.study_plans set status='active',target_end_date=target_end_date+(v_today-(select max(starts_on) from public.study_plan_pauses where plan_id=v_plan.id)) where id=v_plan.id;
    insert into public.learning_events(user_id,course_id,event_type) values(v_uid,p_course,'plan_resumed');
  end if;
end $$;

create or replace function public.course_learning_pace(p_course uuid)
returns jsonb language plpgsql stable security definer set search_path=public as $$
declare v_uid uuid:=auth.uid(); v_plan public.study_plans%rowtype; v_tz text; v_today date; v_total integer; v_done integer; v_actual integer; v_sessions integer; v_daily numeric; v_planned integer; v_delta numeric; v_status text; v_last timestamptz; v_week_target integer; v_week_done integer; v_next jsonb; v_access_end timestamptz; v_days_since integer; v_streak integer:=0; v_cursor date; v_ahead numeric; v_behind numeric; v_far numeric; v_active_threshold integer;
begin
  if v_uid is null then raise exception 'Connexion requise'; end if;
  select * into v_plan from public.study_plans where user_id=v_uid and course_id=p_course;
  if not found then return jsonb_build_object('has_plan',false); end if;
  select case when exists(select 1 from pg_timezone_names n where n.name=p.timezone) then p.timezone else 'Africa/Douala' end into v_tz from public.profiles p where p.id=v_uid;
  v_tz:=coalesce(v_tz,'Africa/Douala');
  v_today:=(now() at time zone v_tz)::date;
  select coalesce((select (value#>>'{}')::numeric from public.learning_experience_settings where key='pace_ahead_threshold'),0.05),
         coalesce((select (value#>>'{}')::numeric from public.learning_experience_settings where key='pace_behind_threshold'),0.05),
         coalesce((select (value#>>'{}')::numeric from public.learning_experience_settings where key='pace_far_behind_threshold'),0.20),
         coalesce((select (value#>>'{}')::integer from public.learning_experience_settings where key='active_day_seconds'),300)
    into v_ahead,v_behind,v_far,v_active_threshold;
  select coalesce(sum(public.lesson_effort_minutes(l.id)),0) into v_total from public.course_lessons l join public.course_chapters ch on ch.id=l.chapter_id
    join public.courses c on c.id=l.course_id and c.current_version_id=ch.version_id where c.id=p_course and c.status='published' and l.published;
  select count(*) into v_done from public.lesson_progress lp join public.course_lessons l on l.id=lp.lesson_id join public.course_chapters ch on ch.id=l.chapter_id join public.courses c on c.id=l.course_id and c.current_version_id=ch.version_id where lp.user_id=v_uid and lp.is_completed and c.id=p_course and l.published and not l.is_free_preview;
  select coalesce(sum(public.lesson_effort_minutes(l.id)),0) into v_actual from public.lesson_progress lp join public.course_lessons l on l.id=lp.lesson_id join public.course_chapters ch on ch.id=l.chapter_id join public.courses c on c.id=l.course_id and c.current_version_id=ch.version_id where lp.user_id=v_uid and lp.is_completed and c.id=p_course and l.published and not l.is_free_preview;
  v_daily:=v_plan.weekly_minutes::numeric/cardinality(v_plan.preferred_days);
  select count(*) into v_sessions from generate_series(v_plan.start_date,v_today,interval '1 day') d where extract(isodow from d)::integer=any(v_plan.preferred_days);
  v_planned:=least(v_total,ceil(v_daily*v_sessions)::integer);
  v_delta:=case when v_total=0 then 0 else (v_actual-v_planned)::numeric/v_total end;
  v_status:=case when v_plan.status='paused' then 'paused' when v_total>0 and v_actual>=v_total then 'completed' when v_delta>=v_ahead then 'ahead' when v_delta<=-v_far then 'far_behind' when v_delta<=-v_behind then 'behind' else 'on_track' end;
  select max(occurred_at) into v_last from public.learning_events le where user_id=v_uid and course_id=p_course and (le.lesson_id is null or not exists(select 1 from public.course_lessons pl where pl.id=le.lesson_id and pl.is_free_preview));
  v_days_since:=case when v_last is null then null else v_today-(v_last at time zone coalesce(v_tz,'Africa/Douala'))::date end;
  select coalesce(sum(le.active_seconds),0)/60 into v_week_done from public.learning_events le left join public.course_lessons activity_lesson on activity_lesson.id=le.lesson_id where le.user_id=v_uid and le.course_id=p_course and le.event_type='session_heartbeat' and not coalesce(activity_lesson.is_free_preview,false) and le.occurred_at>=date_trunc('week',now() at time zone coalesce(v_tz,'Africa/Douala')) at time zone coalesce(v_tz,'Africa/Douala');
  v_week_target:=v_plan.weekly_minutes;
  v_cursor:=case when exists(select 1 from public.learning_events e left join public.course_lessons al on al.id=e.lesson_id where e.user_id=v_uid and e.course_id=p_course and (e.occurred_at at time zone v_tz)::date=v_today and not coalesce(al.is_free_preview,false) and (e.event_type='lesson_completed' or (e.event_type='session_heartbeat' and e.active_seconds>=v_active_threshold))) then v_today else v_today-1 end;
  while v_streak<366 and exists(select 1 from public.learning_events e left join public.course_lessons al on al.id=e.lesson_id where e.user_id=v_uid and e.course_id=p_course and (e.occurred_at at time zone v_tz)::date=v_cursor and not coalesce(al.is_free_preview,false) and (e.event_type='lesson_completed' or (e.event_type='session_heartbeat' and e.active_seconds>=v_active_threshold))) loop
    v_streak:=v_streak+1; v_cursor:=v_cursor-1;
  end loop;
  select jsonb_build_object('id',l.id,'title',l.title,'estimated_minutes',public.lesson_effort_minutes(l.id)) into v_next from public.course_lessons l join public.course_chapters ch on ch.id=l.chapter_id join public.courses c on c.id=l.course_id and c.current_version_id=ch.version_id left join public.lesson_progress lp on lp.lesson_id=l.id and lp.user_id=v_uid and lp.is_completed where c.id=p_course and c.status='published' and l.published and lp.lesson_id is null order by ch.position,l.position limit 1;
  select max(e.ends_at) into v_access_end from public.learning_entitlements e where e.user_id=v_uid and e.revoked_at is null and e.starts_at<=now() and e.ends_at is not null and (e.scope='all_courses' or (e.scope='course' and e.course_id=p_course));
  return jsonb_build_object('has_plan',true,'status',v_status,'planned_progress',case when v_total=0 then 0 else least(1,v_planned::numeric/v_total) end,'actual_progress',case when v_total=0 then 0 else least(1,v_actual::numeric/v_total) end,'delta_minutes',v_planned-v_actual,'last_activity_at',v_last,'days_since_last_activity',v_days_since,'target_end_date',v_plan.target_end_date,'weekly_minutes',v_plan.weekly_minutes,'preferred_days',v_plan.preferred_days,'week_goal',jsonb_build_object('target_minutes',v_week_target,'done_minutes',v_week_done),'next_lesson',v_next,'catch_up',jsonb_build_object('suggested_daily_minutes',ceil(greatest(0,v_total-v_actual)::numeric/greatest(1,(v_plan.target_end_date-v_today)+1))::integer,'recalculate_recommended',ceil(greatest(0,v_total-v_actual)::numeric/greatest(1,(v_plan.target_end_date-v_today)+1))>v_daily*2),'access_ends_before_plan_end',v_access_end is not null and v_access_end::date<v_plan.target_end_date,'streak_days',v_streak,'total_effort_minutes',v_total,'completed_effort_minutes',v_actual);
end $$;

create or replace function public.course_public_stats(p_course uuid)
returns jsonb language sql stable security definer set search_path=public as $$
  with eligible as (
    select distinct e.user_id from public.learning_entitlements e where e.revoked_at is null and e.starts_at<=now()
      and (e.scope='all_courses' or (e.scope='course' and e.course_id=p_course))
      and (e.source_order_id is null or not exists(select 1 from public.learning_orders o where o.id=e.source_order_id and o.status='refunded'))
      and not exists(select 1 from public.profiles p where p.id=e.user_id and p.role::text in ('admin','editor'))
  ), started as (
    select e.user_id from eligible e where exists(select 1 from public.learning_events le where le.user_id=e.user_id and le.course_id=p_course and le.event_type in ('lesson_opened','lesson_completed'))
  ), counts as (
    select (select count(*) from started)::integer learners,(select count(distinct le.user_id) from public.learning_events le join eligible e on e.user_id=le.user_id where le.course_id=p_course and le.occurred_at>=now()-interval '7 days')::integer active
  )
  select case when not exists(select 1 from public.courses where id=p_course and status='published') or learners < coalesce((select (value#>>'{}')::integer from public.learning_experience_settings where key='min_public_learners'),10)
    then jsonb_build_object('visible',false) else jsonb_build_object('visible',true,'learners_count',learners,'active_last_7_days',active) end from counts
$$;

create or replace function public.record_learning_events(p_events jsonb)
returns integer language plpgsql security definer set search_path=public as $$
declare v_uid uuid:=auth.uid(); v_item jsonb; v_course uuid; v_lesson uuid; v_type text; v_seconds integer; v_inserted integer:=0; v_rows integer; v_tz text; v_day date; v_used integer; v_cap integer;
begin
  if v_uid is null then raise exception 'Connexion requise'; end if;
  if jsonb_typeof(p_events)<>'array' or jsonb_array_length(p_events)>50 then raise exception 'Lot d’événements invalide'; end if;
  select case when exists(select 1 from pg_timezone_names n where n.name=p.timezone) then p.timezone else 'Africa/Douala' end into v_tz from public.profiles p where p.id=v_uid;
  v_tz:=coalesce(v_tz,'Africa/Douala'); v_day:=(now() at time zone v_tz)::date;
  select coalesce((value#>>'{}')::integer,36000) into v_cap from public.learning_experience_settings where key='daily_activity_cap_seconds';
  for v_item in select value from jsonb_array_elements(p_events) loop
    begin v_course:=(v_item->>'course_id')::uuid; v_lesson:=nullif(v_item->>'lesson_id','')::uuid; v_type:=v_item->>'event_type'; exception when others then continue; end;
    if v_type not in ('lesson_opened','lesson_completed','video_play','video_pause','video_progress','quiz_started','quiz_submitted','session_heartbeat') then continue; end if;
    if v_lesson is null or not exists(select 1 from public.course_lessons l where l.id=v_lesson and l.course_id=v_course and (public.can_access_lesson(l.id) or (l.is_free_preview and (not l.preview_requires_login or v_uid is not null)))) then continue; end if;
    if octet_length(coalesce(v_item->'metadata','{}'::jsonb)::text)>2048 then continue; end if;
    v_seconds:=least(30,greatest(0,coalesce((v_item->>'active_seconds')::integer,0)));
    if v_type='session_heartbeat' then
      select coalesce(sum(active_seconds),0) into v_used from public.learning_events where user_id=v_uid and course_id=v_course and event_type='session_heartbeat' and (occurred_at at time zone v_tz)::date=v_day;
      v_seconds:=least(v_seconds,greatest(0,v_cap-v_used));
      if v_seconds=0 then continue; end if;
    else v_seconds:=null; end if;
    if v_type='lesson_completed' and exists(select 1 from public.learning_events where user_id=v_uid and lesson_id=v_lesson and event_type='lesson_completed') then continue; end if;
    insert into public.learning_events(user_id,course_id,lesson_id,event_type,active_seconds,metadata)
      values(v_uid,v_course,v_lesson,v_type,v_seconds,coalesce(v_item->'metadata','{}'::jsonb)) on conflict do nothing;
    get diagnostics v_rows = row_count;
    v_inserted:=v_inserted+v_rows;
  end loop;
  return v_inserted;
end $$;

grant execute on function public.lesson_effort_minutes(uuid) to authenticated;
grant execute on function public.recalculate_study_plan(uuid,uuid,date,integer,integer[]) to authenticated;
grant execute on function public.save_study_plan(uuid,integer,integer[],date) to authenticated;
grant execute on function public.set_study_plan_paused(uuid,boolean) to authenticated;
grant execute on function public.course_learning_pace(uuid) to authenticated;
grant execute on function public.course_public_stats(uuid) to anon,authenticated;
grant execute on function public.record_learning_events(jsonb) to authenticated;

