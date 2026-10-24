-- The application now authenticates users through Google on its own Vercel
-- domain. Supabase remains the data store, and profiles become its app-user
-- registry instead of mirroring auth.users.

alter table public.profiles add column if not exists email text;
alter table public.profiles add column if not exists google_subject text;
alter table public.profiles add column if not exists password_hash text;

update public.profiles p
set email = lower(btrim(u.email)),
    google_subject = google_identity.provider_id,
    password_hash = nullif(u.encrypted_password, '')
from auth.users u
left join lateral (
  select i.provider_id
  from auth.identities i
  where i.user_id = u.id and i.provider = 'google'
  order by i.created_at
  limit 1
) google_identity on true
where p.id = u.id;

create unique index if not exists profiles_email_unique_idx
  on public.profiles (lower(email)) where email is not null;
create unique index if not exists profiles_google_subject_unique_idx
  on public.profiles (google_subject) where google_subject is not null;

-- Preserve existing user UUIDs and all linked purchases/progress while
-- moving application-table foreign keys from Supabase Auth users to profiles.
-- Keep Supabase-managed auth tables such as auth.identities untouched.
do $$
declare
  fk record;
  rewritten_definition text;
begin
  for fk in
    select conrelid::regclass as table_name, conname, conrelid, oid,
           pg_get_constraintdef(oid) as definition
    from pg_constraint
    where contype = 'f'
      and confrelid = 'auth.users'::regclass
      and connamespace = 'public'::regnamespace
  loop
    execute format('alter table %s drop constraint %I', fk.table_name, fk.conname);

    if fk.conrelid <> 'public.profiles'::regclass then
      rewritten_definition := replace(fk.definition, 'auth.users', 'public.profiles');
      execute format('alter table %s add constraint %I %s',
        fk.table_name, fk.conname, rewritten_definition);
    end if;
  end loop;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();

comment on table public.profiles is
  'Application users authenticated by email/password or Google through the Vercel server runtime.';

-- The server-only BFF uses these narrowly scoped functions to run the existing
-- user-aware SQL with the verified Google profile id in auth.uid(). The
-- service role key never leaves the Vercel runtime.
create or replace function public.app_course_learning_pace(p_user uuid, p_course uuid)
returns jsonb language plpgsql security definer set search_path=pg_catalog,public,auth as $$
begin
  if auth.role() <> 'service_role' then raise exception 'Service role required'; end if;
  perform set_config('request.jwt.claim.sub', p_user::text, true);
  perform set_config('request.jwt.claims', jsonb_build_object('sub', p_user::text, 'role', 'authenticated', 'aud', 'authenticated')::text, true);
  return public.course_learning_pace(p_course);
end $$;

create or replace function public.app_save_study_plan(p_user uuid, p_course uuid, p_weekly_minutes integer, p_preferred_days integer[])
returns uuid language plpgsql security definer set search_path=pg_catalog,public,auth as $$
begin
  if auth.role() <> 'service_role' then raise exception 'Service role required'; end if;
  perform set_config('request.jwt.claim.sub', p_user::text, true);
  perform set_config('request.jwt.claims', jsonb_build_object('sub', p_user::text, 'role', 'authenticated', 'aud', 'authenticated')::text, true);
  return public.save_study_plan(p_course, p_weekly_minutes, p_preferred_days);
end $$;

create or replace function public.app_set_study_plan_paused(p_user uuid, p_course uuid, p_paused boolean)
returns void language plpgsql security definer set search_path=pg_catalog,public,auth as $$
begin
  if auth.role() <> 'service_role' then raise exception 'Service role required'; end if;
  perform set_config('request.jwt.claim.sub', p_user::text, true);
  perform set_config('request.jwt.claims', jsonb_build_object('sub', p_user::text, 'role', 'authenticated', 'aud', 'authenticated')::text, true);
  perform public.set_study_plan_paused(p_course, p_paused);
end $$;

create or replace function public.app_save_lesson_progress(p_user uuid, p_lesson uuid, p_position integer, p_completed boolean)
returns void language plpgsql security definer set search_path=pg_catalog,public,auth as $$
begin
  if auth.role() <> 'service_role' then raise exception 'Service role required'; end if;
  perform set_config('request.jwt.claim.sub', p_user::text, true);
  perform set_config('request.jwt.claims', jsonb_build_object('sub', p_user::text, 'role', 'authenticated', 'aud', 'authenticated')::text, true);
  perform public.save_lesson_progress(p_lesson, p_position, p_completed);
end $$;

create or replace function public.app_record_learning_events(p_user uuid, p_events jsonb)
returns integer language plpgsql security definer set search_path=pg_catalog,public,auth as $$
begin
  if auth.role() <> 'service_role' then raise exception 'Service role required'; end if;
  perform set_config('request.jwt.claim.sub', p_user::text, true);
  perform set_config('request.jwt.claims', jsonb_build_object('sub', p_user::text, 'role', 'authenticated', 'aud', 'authenticated')::text, true);
  return public.record_learning_events(p_events);
end $$;

create or replace function public.app_admin_fork_course_version(p_user uuid, p_course uuid)
returns uuid language plpgsql security definer set search_path=pg_catalog,public,auth as $$
begin
  if auth.role() <> 'service_role' then raise exception 'Service role required'; end if;
  perform set_config('request.jwt.claim.sub', p_user::text, true);
  perform set_config('request.jwt.claims', jsonb_build_object('sub', p_user::text, 'role', 'authenticated', 'aud', 'authenticated')::text, true);
  return public.admin_fork_course_version(p_course);
end $$;

create or replace function public.app_admin_publish_course(p_user uuid, p_course uuid)
returns void language plpgsql security definer set search_path=pg_catalog,public,auth as $$
begin
  if auth.role() <> 'service_role' then raise exception 'Service role required'; end if;
  perform set_config('request.jwt.claim.sub', p_user::text, true);
  perform set_config('request.jwt.claims', jsonb_build_object('sub', p_user::text, 'role', 'authenticated', 'aud', 'authenticated')::text, true);
  perform public.admin_publish_course(p_course);
end $$;

revoke all on function public.app_course_learning_pace(uuid,uuid) from public, anon, authenticated;
revoke all on function public.app_save_study_plan(uuid,uuid,integer,integer[]) from public, anon, authenticated;
revoke all on function public.app_set_study_plan_paused(uuid,uuid,boolean) from public, anon, authenticated;
revoke all on function public.app_save_lesson_progress(uuid,uuid,integer,boolean) from public, anon, authenticated;
revoke all on function public.app_record_learning_events(uuid,jsonb) from public, anon, authenticated;
revoke all on function public.app_admin_fork_course_version(uuid,uuid) from public, anon, authenticated;
revoke all on function public.app_admin_publish_course(uuid,uuid) from public, anon, authenticated;
grant execute on function public.app_course_learning_pace(uuid,uuid) to service_role;
grant execute on function public.app_save_study_plan(uuid,uuid,integer,integer[]) to service_role;
grant execute on function public.app_set_study_plan_paused(uuid,uuid,boolean) to service_role;
grant execute on function public.app_save_lesson_progress(uuid,uuid,integer,boolean) to service_role;
grant execute on function public.app_record_learning_events(uuid,jsonb) to service_role;
grant execute on function public.app_admin_fork_course_version(uuid,uuid) to service_role;
grant execute on function public.app_admin_publish_course(uuid,uuid) to service_role;
