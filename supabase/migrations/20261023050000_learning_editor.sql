-- Let catalogue managers build draft programmes and upload private course media.
alter table public.courses add column draft_version_id uuid;
update public.courses c set draft_version_id = c.current_version_id
from public.course_versions v where v.id = c.current_version_id and v.course_id = c.id and v.status <> 'published';
alter table public.courses add constraint courses_draft_version_fk
  foreign key (draft_version_id) references public.course_versions(id) on delete set null;
create or replace function public.validate_draft_course_version() returns trigger
language plpgsql set search_path = public as $$
begin
  if new.draft_version_id is not null and not exists (
    select 1 from public.course_versions where id = new.draft_version_id and course_id = new.id and status <> 'published'
  ) then raise exception 'La version de travail doit appartenir à la formation et ne pas être publiée'; end if;
  return new;
end $$;
create trigger courses_draft_version_guard before insert or update of draft_version_id on public.courses
  for each row execute function public.validate_draft_course_version();
alter table public.course_chapters drop constraint if exists course_chapters_course_id_position_key;
create unique index course_chapters_version_position_uidx on public.course_chapters(version_id, position);

create or replace function public.create_initial_course_version() returns trigger
language plpgsql set search_path = public as $$
declare v_version uuid;
begin
  insert into public.course_versions(course_id, version_label) values(new.id, '1.0') returning id into v_version;
  update public.courses set current_version_id = v_version, draft_version_id = v_version where id = new.id;
  return new;
end $$;

create policy course_content_admin_insert
on storage.objects for insert to authenticated
with check (bucket_id = 'course-content' and public.can_manage_catalog());

create or replace function public.validate_learning_publication() returns trigger
language plpgsql set search_path = public as $$
declare
  v_version public.course_versions;
  v_admin_publish boolean := current_setting('nova.publish_course', true) = new.id::text;
begin
  if new.status = 'published' then
    new.published_at := coalesce(new.published_at, now());
    select * into v_version from public.course_versions where id = new.current_version_id and course_id = new.id;
    if not found or v_version.status <> 'published' or new.cover_image_url is null or new.category_id is null
      or new.content_source is null or new.reviewed_at is null or new.rights_verified_at is null
      or jsonb_array_length(new.learning_outcomes) = 0 or length(btrim(new.description)) = 0
      or new.estimated_minutes <= 0
      or not exists(select 1 from public.course_chapters ch join public.course_lessons l on l.chapter_id = ch.id
        where ch.version_id = v_version.id and l.published)
      or not exists(select 1 from public.course_chapters ch join public.course_lessons l on l.chapter_id = ch.id
        where ch.version_id = v_version.id and l.published and l.is_free_preview)
      or not exists(select 1 from public.offers o join public.offer_prices p on p.offer_id = o.id
        where o.course_id = new.id and o.kind = 'course' and p.amount_minor > 0 and (o.active or v_admin_publish))
    then
      raise exception 'Publication impossible : version publiée, couverture, origine, objectifs, description, durée, leçons, aperçu gratuit et offre tarifée requis';
    end if;
  end if;
  return new;
end $$;

create or replace function public.admin_fork_course_version(p_course uuid)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_course public.courses;
  v_old_version uuid;
  v_new_version uuid;
  v_chapter public.course_chapters;
  v_new_chapter uuid;
  v_lesson public.course_lessons;
  v_new_lesson uuid;
  v_question public.quiz_questions;
  v_new_question uuid;
  v_answer public.quiz_answer_keys;
  v_label text;
begin
  if not public.can_manage_catalog() then raise exception 'Accès administrateur requis'; end if;
  select * into v_course from public.courses where id = p_course for update;
  if not found then raise exception 'Formation introuvable'; end if;
  if v_course.draft_version_id is not null then return v_course.draft_version_id; end if;
  v_old_version := v_course.current_version_id;
  if v_old_version is null then raise exception 'La formation ne possède pas de version'; end if;
  select (count(*) + 1)::text || '.0' into v_label from public.course_versions where course_id = p_course;
  insert into public.course_versions(course_id, version_label, changelog_md)
    values(p_course, v_label, 'Version de travail') returning id into v_new_version;
  for v_chapter in select * from public.course_chapters where version_id = v_old_version order by position loop
    insert into public.course_chapters(course_id, version_id, position, title, description)
      values(p_course, v_new_version, v_chapter.position, v_chapter.title, v_chapter.description) returning id into v_new_chapter;
    for v_lesson in select * from public.course_lessons where chapter_id = v_chapter.id order by position loop
      insert into public.course_lessons(chapter_id, course_id, position, title, lesson_type, duration_minutes, summary,
        is_free_preview, preview_requires_login, published, source_lesson_id)
      values(v_new_chapter, p_course, v_lesson.position, v_lesson.title, v_lesson.lesson_type, v_lesson.duration_minutes,
        v_lesson.summary, v_lesson.is_free_preview, v_lesson.preview_requires_login, v_lesson.published, v_lesson.id)
      returning id into v_new_lesson;
      insert into public.course_lesson_contents(lesson_id, body_md, video_storage_path, project_instructions)
        select v_new_lesson, body_md, video_storage_path, project_instructions from public.course_lesson_contents where lesson_id = v_lesson.id;
      for v_question in select * from public.quiz_questions where lesson_id = v_lesson.id order by position loop
        insert into public.quiz_questions(lesson_id, position, prompt_md, options)
          values(v_new_lesson, v_question.position, v_question.prompt_md, v_question.options) returning id into v_new_question;
        select * into v_answer from public.quiz_answer_keys where question_id = v_question.id;
        if found then
          insert into public.quiz_answer_keys(question_id, correct_option_ids, explanation_md)
            values(v_new_question, v_answer.correct_option_ids, v_answer.explanation_md);
        end if;
      end loop;
      insert into public.course_resources(lesson_id, title, storage_path, resource_type, kind, external_url, requires_license, position, media_id)
        select v_new_lesson, title, storage_path, resource_type, kind, external_url, requires_license, position, media_id
        from public.course_resources where lesson_id = v_lesson.id;
    end loop;
  end loop;
  update public.courses set draft_version_id = v_new_version where id = p_course;
  return v_new_version;
end $$;

create or replace function public.admin_publish_course(p_course uuid)
returns void language plpgsql security definer set search_path = public as $$
declare v_course public.courses; v_target_version uuid;
begin
  if not public.can_manage_catalog() then raise exception 'Accès administrateur requis'; end if;
  select * into v_course from public.courses where id = p_course for update;
  if not found then raise exception 'Formation introuvable'; end if;
  v_target_version := coalesce(v_course.draft_version_id, v_course.current_version_id);
  if v_target_version is null then raise exception 'La formation ne possède pas de version'; end if;
  if v_course.status = 'published' and v_course.draft_version_id is null then raise exception 'Crée d’abord une version de travail'; end if;
  perform set_config('nova.publish_course', p_course::text, true);
  update public.course_versions set status = 'published', published_at = coalesce(published_at, now())
    where id = v_target_version and course_id = p_course and status <> 'published';
  update public.courses set current_version_id = v_target_version, draft_version_id = null, status = 'published'
    where id = p_course;
  update public.offers set active = true where course_id = p_course and kind = 'course' and not active
    and exists(select 1 from public.offer_prices p where p.offer_id = offers.id and p.amount_minor > 0);
  perform set_config('nova.publish_course', '', true);
end $$;

revoke all on function public.admin_fork_course_version(uuid) from public, anon;
revoke all on function public.admin_publish_course(uuid) from public, anon;
grant execute on function public.admin_fork_course_version(uuid) to authenticated;
grant execute on function public.admin_publish_course(uuid) to authenticated;
