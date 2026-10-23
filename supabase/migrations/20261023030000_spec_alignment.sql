-- Align the learning backend with docs/nova-digital-spec-formations.md.
-- The existing Nova Digital product-shop orders remain untouched.

create table public.course_categories (
  id uuid primary key default gen_random_uuid(),
  code public.course_category not null unique,
  slug text not null unique,
  name text not null,
  position integer not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.course_categories(code, slug, name, position) values
 ('ai_automation','ia-automatisation','Intelligence artificielle et automatisation',1),
 ('web_development','developpement-web','Développement web et programmation',2),
 ('design_visual','design-ui-ux','Design graphique, UI/UX et conception',3),
 ('digital_marketing','marketing-digital','Marketing digital, SEO et e-commerce',4),
 ('video_content','video-creation','Vidéo, photographie et création de contenu',5),
 ('productivity','bureautique-productivite','Bureautique et productivité',6),
 ('data_bi','data-bi','Data, analyse et Business Intelligence',7),
 ('cybersecurity','cybersecurite','Cybersécurité, réseaux et systèmes',8),
 ('entrepreneurship','entrepreneuriat','Entrepreneuriat, gestion et finance',9),
 ('career','carriere-numerique','Compétences professionnelles et carrière',10)
on conflict (code) do update set slug=excluded.slug, name=excluded.name, position=excluded.position;

alter type public.user_role add value if not exists 'editor';
alter type public.order_status add value if not exists 'cancelled';

alter table public.courses
  add column code text,
  add column category_id uuid references public.course_categories(id),
  add column subtitle text not null default '',
  add column description_md text not null default '',
  add column cover_alt text not null default '',
  add column trailer_media_id uuid,
  add column prerequisites_md text not null default '',
  add column learning_outcomes jsonb not null default '[]'::jsonb,
  add column current_version_id uuid,
  add column has_code_license boolean not null default false,
  add column demo_url text,
  add column official boolean not null default false,
  add column content_source text check (content_source in ('original','licensed','open_license')),
  add column license_notes text;

update public.courses c set category_id=cc.id from public.course_categories cc where cc.code=c.category;
update public.courses set code=(case courses.category when 'ai_automation' then 'AI' when 'web_development' then 'DEV'
  when 'design_visual' then 'DES' when 'digital_marketing' then 'MKT' when 'video_content' then 'VID'
  when 'productivity' then 'BUR' when 'data_bi' then 'DAT' when 'cybersecurity' then 'SEC'
  when 'entrepreneurship' then 'ENT' else 'CAR' end) || '-' || lpad(ranked.row_number::text,2,'0')
from (select id, category, row_number() over (partition by category order by created_at, id) as row_number from public.courses) ranked
where courses.id=ranked.id and courses.code is null;
alter table public.courses alter column code set not null;
create unique index courses_code_uidx on public.courses(code);
alter table public.courses alter column category_id set not null;
alter table public.courses alter column current_version_id drop not null;

create function public.sync_course_category_id() returns trigger
language plpgsql set search_path=public as $$
begin
  select id into new.category_id from public.course_categories where code=new.category;
  if new.code is null or new.code='' then
    declare v_prefix text; v_next integer;
    begin
      v_prefix := case new.category
        when 'ai_automation' then 'AI' when 'web_development' then 'DEV'
        when 'design_visual' then 'DES' when 'digital_marketing' then 'MKT'
        when 'video_content' then 'VID' when 'productivity' then 'BUR'
        when 'data_bi' then 'DAT' when 'cybersecurity' then 'SEC'
        when 'entrepreneurship' then 'ENT' else 'CAR' end;
      select coalesce(max(substring(code from '[0-9]+$')::integer),0)+1 into v_next
        from public.courses where code like v_prefix || '-%';
      new.code := v_prefix || '-' || lpad(v_next::text,2,'0');
    end;
  end if;
  return new;
end $$;
create trigger courses_category_sync before insert or update of category, category_id on public.courses
  for each row execute function public.sync_course_category_id();

create table public.course_versions (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  version_label text not null,
  changelog_md text not null default '',
  status public.course_status not null default 'draft',
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(course_id, version_label),
  unique(id, course_id),
  check ((status='published') = (published_at is not null))
);
create table public.media_assets (
  id uuid primary key default gen_random_uuid(),
  provider text not null default 'storage',
  provider_ref text not null,
  mime_type text,
  size_bytes bigint check(size_bytes is null or size_bytes>=0),
  is_public boolean not null default false,
  renditions jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.courses add constraint courses_trailer_media_fk
  foreign key(trailer_media_id) references public.media_assets(id) on delete set null;
create trigger course_versions_touch before update on public.course_versions
  for each row execute function public.touch_updated_at();
create trigger course_categories_touch before update on public.course_categories
  for each row execute function public.touch_updated_at();
create trigger media_assets_touch before update on public.media_assets
  for each row execute function public.touch_updated_at();

insert into public.course_versions(course_id, version_label, status, published_at)
select id, '1.0', case when status='published' then 'published'::public.course_status else 'draft'::public.course_status end,
  case when status='published' then published_at else null end
from public.courses;
update public.courses c set current_version_id=v.id from public.course_versions v where v.course_id=c.id;
alter table public.courses add constraint courses_current_version_fk
  foreign key(current_version_id) references public.course_versions(id) on delete set null deferrable initially deferred;
create function public.validate_current_course_version() returns trigger
language plpgsql set search_path=public as $$
begin
  if new.current_version_id is not null and not exists(
    select 1 from public.course_versions where id=new.current_version_id and course_id=new.id
  ) then raise exception 'Current version must belong to the course'; end if;
  return new;
end $$;
create trigger current_course_version_guard before insert or update of current_version_id on public.courses
  for each row execute function public.validate_current_course_version();
create function public.create_initial_course_version() returns trigger
language plpgsql set search_path=public as $$
declare v_version uuid;
begin
  insert into public.course_versions(course_id,version_label) values(new.id,'1.0') returning id into v_version;
  update public.courses set current_version_id=v_version where id=new.id;
  return new;
end $$;
create trigger course_initial_version after insert on public.courses
  for each row when(new.current_version_id is null) execute function public.create_initial_course_version();

alter table public.course_chapters add column version_id uuid references public.course_versions(id) on delete cascade;
update public.course_chapters ch set version_id=c.current_version_id from public.courses c where c.id=ch.course_id;
alter table public.course_chapters alter column version_id set not null;
alter table public.course_chapters add constraint course_chapter_version_owner_fk
  foreign key(version_id,course_id) references public.course_versions(id,course_id) on delete cascade;
alter table public.course_chapters add column updated_at timestamptz not null default now();
create trigger course_chapters_touch before update on public.course_chapters
  for each row execute function public.touch_updated_at();
create index course_chapters_version_order_idx on public.course_chapters(version_id, position);

alter type public.lesson_type add value if not exists 'exercise';
alter table public.course_lessons
  add column summary text not null default '',
  add column is_free_preview boolean not null default false,
  add column preview_requires_login boolean not null default false,
  add column published boolean not null default true,
  add column source_lesson_id uuid references public.course_lessons(id) on delete set null;
update public.course_lessons set is_free_preview=is_free;
alter table public.lesson_progress add column status text generated always as
  (case when is_completed then 'completed' else 'started' end) stored;

-- Keep lesson metadata public for the programme, and isolate every protected field.
create table public.course_lesson_contents (
  lesson_id uuid primary key references public.course_lessons(id) on delete cascade,
  body_md text,
  video_storage_path text,
  project_instructions text,
  updated_at timestamptz not null default now()
);
create trigger course_lesson_contents_touch before update on public.course_lesson_contents
  for each row execute function public.touch_updated_at();
insert into public.course_lesson_contents(lesson_id, body_md, video_storage_path, project_instructions)
select id, text_content, video_storage_path, project_instructions from public.course_lessons
where text_content is not null or video_storage_path is not null or project_instructions is not null;

-- Preserve legacy quiz JSON outside the learner-visible lesson metadata table.
create table public.legacy_course_quizzes (
  lesson_id uuid primary key references public.course_lessons(id) on delete cascade,
  quiz_data jsonb not null,
  preserved_at timestamptz not null default now()
);
insert into public.legacy_course_quizzes(lesson_id, quiz_data)
select id, quiz from public.course_lessons where quiz is not null;

-- Remove policies that still reference legacy lesson columns before dropping them.
drop policy if exists lessons_access_read on public.course_lessons;
drop policy if exists resources_access_read on public.course_resources;
drop policy if exists progress_own_all on public.lesson_progress;

alter table public.course_lessons drop column is_free;
alter table public.course_lessons drop column text_content;
alter table public.course_lessons drop column video_storage_path;
alter table public.course_lessons drop column project_instructions;
alter table public.course_lessons drop column quiz;

create table public.quiz_questions (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.course_lessons(id) on delete cascade,
  position integer not null check(position > 0),
  prompt_md text not null,
  options jsonb not null,
  unique(lesson_id, position)
);
alter table public.quiz_questions add column created_at timestamptz not null default now();
alter table public.quiz_questions add column updated_at timestamptz not null default now();
create trigger quiz_questions_touch before update on public.quiz_questions
  for each row execute function public.touch_updated_at();
create table public.quiz_answer_keys (
  question_id uuid primary key references public.quiz_questions(id) on delete cascade,
  correct_option_ids jsonb not null,
  explanation_md text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger quiz_answer_keys_touch before update on public.quiz_answer_keys
  for each row execute function public.touch_updated_at();

alter table public.course_resources
  alter column storage_path drop not null,
  add column kind text not null default 'zip' check(kind in ('pdf','zip','link','repo_tag')),
  add column external_url text,
  add column requires_license public.license_tier,
  add column position integer not null default 0,
  add column media_id uuid references public.media_assets(id) on delete set null,
  add column updated_at timestamptz not null default now(),
  add constraint course_resources_location_check check(storage_path is not null or external_url is not null);
create trigger course_resources_touch before update on public.course_resources
  for each row execute function public.touch_updated_at();

create table public.offers (
  id uuid primary key default gen_random_uuid(),
  kind text not null check(kind in ('course','bundle','subscription')),
  slug text not null unique,
  name text not null,
  description text not null default '',
  course_id uuid references public.courses(id) on delete restrict,
  duration_days integer check(duration_days is null or duration_days > 0),
  code_license public.license_tier,
  active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((kind='course' and course_id is not null) or (kind<>'course' and course_id is null)),
  check ((kind='subscription' and duration_days is not null) or (kind<>'subscription')),
  check ((kind='course' and duration_days is null) or kind<>'course')
);
create trigger offers_touch before update on public.offers for each row execute function public.touch_updated_at();

create table public.offer_courses (
  offer_id uuid not null references public.offers(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete restrict,
  primary key(offer_id, course_id)
);
create table public.offer_prices (
  id uuid primary key default gen_random_uuid(),
  offer_id uuid not null references public.offers(id) on delete cascade,
  currency char(3) not null check(currency in ('XAF','EUR','USD')),
  amount_minor bigint not null check(amount_minor >= 0),
  compare_at_minor bigint check(compare_at_minor is null or compare_at_minor >= amount_minor),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(offer_id, currency)
);
create trigger offer_prices_touch before update on public.offer_prices
  for each row execute function public.touch_updated_at();

create table public.learning_orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  offer_id uuid not null references public.offers(id),
  currency char(3) not null check(currency in ('XAF','EUR','USD')),
  amount_minor bigint not null check(amount_minor >= 0),
  amount_xaf integer not null check(amount_xaf > 0),
  status public.order_status not null default 'pending',
  provider text not null default 'notchpay',
  provider_reference text unique,
  checkout_url text,
  idempotency_key text not null unique,
  raw_webhook jsonb,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index learning_orders_user_created_idx on public.learning_orders(user_id, created_at desc);
create trigger learning_orders_touch before update on public.learning_orders for each row execute function public.touch_updated_at();

create table public.learning_entitlements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  scope text not null check(scope in ('course','all_courses')),
  course_id uuid references public.courses(id) on delete cascade,
  starts_at timestamptz not null default now(),
  ends_at timestamptz,
  source_order_id uuid references public.learning_orders(id),
  code_license public.license_tier,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((scope='course' and course_id is not null) or (scope='all_courses' and course_id is null)),
  check (ends_at is null or ends_at > starts_at)
);
create index learning_entitlements_user_idx on public.learning_entitlements(user_id, scope, course_id, starts_at, ends_at)
  where revoked_at is null;
create trigger learning_entitlements_touch before update on public.learning_entitlements
  for each row execute function public.touch_updated_at();

-- Preserve any learning access records created with the earlier draft schema.
insert into public.learning_entitlements(user_id,scope,course_id,source_order_id,code_license)
select p.user_id,'course',p.course_id,null::uuid,null::public.license_tier from public.learning_purchases p
where p.status='paid' and p.course_id is not null
union all
select p.user_id,'course',pi.course_id,null::uuid,null::public.license_tier from public.learning_purchases p
join public.course_pack_items pi on pi.pack_id=p.pack_id
where p.status='paid' and p.pack_id is not null;
insert into public.learning_entitlements(user_id,scope,starts_at,ends_at,source_order_id)
select user_id,'all_courses',coalesce(starts_at,now()),ends_at,null::uuid from public.subscriptions
where status='active' and (ends_at is null or ends_at>now());

create table public.course_resume (
  user_id uuid not null references auth.users(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  lesson_id uuid references public.course_lessons(id) on delete set null,
  updated_at timestamptz not null default now(),
  primary key(user_id, course_id)
);
create table public.version_acknowledgements (
  user_id uuid not null references auth.users(id) on delete cascade,
  course_version_id uuid not null references public.course_versions(id) on delete cascade,
  seen_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key(user_id, course_version_id)
);
create trigger version_acknowledgements_touch before update on public.version_acknowledgements
  for each row execute function public.touch_updated_at();
create table public.learning_audit_log (
  id bigint generated always as identity primary key,
  actor_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  reason text,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create function public.audit_offer_price_change() returns trigger
language plpgsql security definer set search_path=public as $$
begin
  insert into public.learning_audit_log(actor_id,action,entity_type,entity_id,details)
  values(auth.uid(),'price_'||lower(tg_op),'offer_price',coalesce(new.id,old.id),
    jsonb_build_object('old',case when tg_op='INSERT' then null else to_jsonb(old) end,
      'new',case when tg_op='DELETE' then null else to_jsonb(new) end));
  if tg_op='DELETE' then return old; end if;
  return new;
end $$;
create trigger offer_price_audit after insert or update or delete on public.offer_prices
  for each row execute function public.audit_offer_price_change();

-- One source of truth for lesson/course access. Locked lesson metadata remains visible,
-- while content, answers and resources are separately protected by RLS.
drop policy if exists lessons_access_read on public.course_lessons;
drop policy if exists chapters_public_read on public.course_chapters;
drop policy if exists resources_access_read on public.course_resources;
drop policy if exists resources_admin_write on public.course_resources;
drop policy if exists progress_own_all on public.lesson_progress;
drop function public.can_access_course(uuid);
create function public.can_manage_catalog()
returns boolean language sql stable security definer set search_path=public as $$
  select exists(select 1 from public.profiles where id=auth.uid() and role::text in ('admin','editor'));
$$;
create function public.can_access_course(p_course uuid)
returns boolean language sql stable security definer set search_path=public as $$
  select exists (
    select 1 from public.learning_entitlements e
    where e.user_id=auth.uid() and e.revoked_at is null and e.starts_at<=now()
      and (e.ends_at is null or e.ends_at>now())
      and (e.scope='all_courses' or (e.scope='course' and e.course_id=p_course))
  );
$$;
create function public.can_access_lesson(p_lesson uuid)
returns boolean language sql stable security definer set search_path=public as $$
  select exists (
    select 1 from public.course_lessons l
    join public.course_chapters ch on ch.id=l.chapter_id
    join public.course_versions v on v.id=ch.version_id and v.course_id=ch.course_id
    join public.courses c on c.id=v.course_id and c.current_version_id=v.id
    where l.id=p_lesson and l.published and v.status='published' and c.status='published'
      and ((l.is_free_preview and (not l.preview_requires_login or auth.uid() is not null))
        or public.can_access_course(c.id) or public.can_manage_catalog())
  );
$$;
create function public.save_lesson_progress(p_lesson uuid, p_position integer, p_completed boolean)
returns void language plpgsql security definer set search_path=public as $$
declare v_user uuid := auth.uid(); v_course uuid; v_now timestamptz := now();
begin
  if v_user is null then raise exception 'Authentication required'; end if;
  if p_position<0 or p_position>86400 then raise exception 'Progress position out of range'; end if;
  if not public.can_access_lesson(p_lesson) then raise exception 'Lesson access required'; end if;
  select course_id into v_course from public.course_lessons where id=p_lesson;
  if v_course is null then raise exception 'Lesson not found'; end if;
  insert into public.lesson_progress(user_id,lesson_id,last_position_seconds,is_completed,completed_at,updated_at)
    values(v_user,p_lesson,p_position,p_completed,case when p_completed then v_now else null end,v_now)
    on conflict(user_id,lesson_id) do update set last_position_seconds=excluded.last_position_seconds,
      is_completed=excluded.is_completed,completed_at=excluded.completed_at,updated_at=excluded.updated_at;
  insert into public.course_resume(user_id,course_id,lesson_id,updated_at)
    values(v_user,v_course,p_lesson,v_now)
    on conflict(user_id,course_id) do update set lesson_id=excluded.lesson_id,updated_at=excluded.updated_at;
end $$;

alter table public.course_categories enable row level security;
alter table public.course_versions enable row level security;
alter table public.media_assets enable row level security;
alter table public.course_lesson_contents enable row level security;
alter table public.quiz_questions enable row level security;
alter table public.quiz_answer_keys enable row level security;
alter table public.legacy_course_quizzes enable row level security;
alter table public.offers enable row level security;
alter table public.offer_courses enable row level security;
alter table public.offer_prices enable row level security;
alter table public.learning_orders enable row level security;
alter table public.learning_entitlements enable row level security;
alter table public.course_resume enable row level security;
alter table public.version_acknowledgements enable row level security;
alter table public.learning_audit_log enable row level security;

create policy categories_public_read on public.course_categories for select using(true);
create policy categories_admin_write on public.course_categories for all using(public.can_manage_catalog()) with check(public.can_manage_catalog());
create policy media_public_read on public.media_assets for select using(is_public or public.can_manage_catalog());
create policy media_editor_write on public.media_assets for all using(public.can_manage_catalog()) with check(public.can_manage_catalog());
drop policy if exists courses_public_read on public.courses;
create policy courses_public_read on public.courses for select using(status='published' or public.can_manage_catalog());
create policy versions_current_read on public.course_versions for select using (
  exists(select 1 from public.courses c where c.id=course_id and c.status='published' and c.current_version_id=id)
  or public.can_manage_catalog()
);
create policy lessons_metadata_read on public.course_lessons for select using (
  published and exists(select 1 from public.course_chapters ch join public.course_versions v on v.id=ch.version_id
    join public.courses c on c.id=v.course_id where ch.id=chapter_id and c.status='published'
    and v.status='published' and c.current_version_id=v.id)
  or public.can_manage_catalog()
);
drop policy if exists lessons_admin_write on public.course_lessons;
create policy lessons_admin_write on public.course_lessons for all using(public.can_manage_catalog()) with check(public.can_manage_catalog());
create policy versions_editor_write on public.course_versions for all using(public.can_manage_catalog()) with check(public.can_manage_catalog());
drop policy if exists chapters_admin_write on public.course_chapters;
create policy chapters_admin_write on public.course_chapters for all using(public.can_manage_catalog()) with check(public.can_manage_catalog());
drop policy if exists courses_admin_write on public.courses;
create policy courses_editor_write on public.courses for all using(public.can_manage_catalog()) with check(public.can_manage_catalog());
create policy chapters_public_read on public.course_chapters for select using (
  exists(select 1 from public.course_versions v join public.courses c on c.id=v.course_id
    where v.id=version_id and c.status='published' and v.status='published' and c.current_version_id=v.id)
  or public.can_manage_catalog()
);
create policy lesson_content_access on public.course_lesson_contents for select using(public.can_access_lesson(lesson_id));
create policy lesson_content_admin_write on public.course_lesson_contents for all using(public.can_manage_catalog()) with check(public.can_manage_catalog());
create policy quiz_questions_access on public.quiz_questions for select using(public.can_access_lesson(lesson_id));
create policy quiz_questions_admin_write on public.quiz_questions for all using(public.can_manage_catalog()) with check(public.can_manage_catalog());
create policy quiz_answers_editor_write on public.quiz_answer_keys for all using(public.can_manage_catalog()) with check(public.can_manage_catalog());
create policy legacy_quizzes_admin_read on public.legacy_course_quizzes for select using(public.can_manage_catalog());
create policy resources_access_read on public.course_resources for select using (
  public.can_access_lesson(lesson_id) and (requires_license is null or exists(
    select 1 from public.learning_entitlements e where e.user_id=auth.uid() and e.revoked_at is null
      and (e.ends_at is null or e.ends_at>now())
      and (e.code_license='agency' or (e.code_license='standard' and requires_license='standard'))
      and (e.scope='all_courses' or e.course_id=(select l.course_id from public.course_lessons l where l.id=lesson_id))
  ))
);
create policy resources_admin_write on public.course_resources for all using(public.can_manage_catalog()) with check(public.can_manage_catalog());
create policy offers_public_read on public.offers for select using(active or public.is_admin());
create policy offers_admin_write on public.offers for all using(public.is_admin()) with check(public.is_admin());
create policy offer_courses_public_read on public.offer_courses for select using(exists(select 1 from public.offers o where o.id=offer_id and o.active));
create policy offer_courses_admin_write on public.offer_courses for all using(public.is_admin()) with check(public.is_admin());
create policy offer_prices_public_read on public.offer_prices for select using(exists(select 1 from public.offers o where o.id=offer_id and o.active));
create policy offer_prices_admin_write on public.offer_prices for all using(public.is_admin()) with check(public.is_admin());
create policy learning_orders_admin_read on public.learning_orders for select using(public.is_admin());
create policy entitlements_own_read on public.learning_entitlements for select using(user_id=auth.uid() or public.is_admin());
create policy progress_own_all on public.lesson_progress for all using(user_id=auth.uid()) with check(user_id=auth.uid() and public.can_access_lesson(lesson_id));
create policy resume_own_all on public.course_resume for all using(user_id=auth.uid()) with check(
  user_id=auth.uid() and exists(select 1 from public.course_lessons l where l.id=public.course_resume.lesson_id
    and l.course_id=public.course_resume.course_id and public.can_access_lesson(l.id))
);
create policy acknowledgements_own_all on public.version_acknowledgements for all using(user_id=auth.uid()) with check(user_id=auth.uid());
create policy audit_admin_read on public.learning_audit_log for select using(public.is_admin());

revoke all on public.learning_orders from anon, authenticated;
create function public.get_learning_order_status(p_order uuid)
returns table(id uuid, offer_id uuid, currency char(3), amount_minor bigint, status public.order_status, paid_at timestamptz)
language sql stable security definer set search_path=public as $$
  select o.id,o.offer_id,o.currency,o.amount_minor,o.status,o.paid_at
  from public.learning_orders o
  where o.id=p_order and (o.user_id=auth.uid() or public.is_admin());
$$;
revoke all on function public.get_learning_order_status(uuid) from public, anon;
grant execute on function public.get_learning_order_status(uuid) to authenticated;

create function public.validate_learning_publication() returns trigger
language plpgsql set search_path=public as $$
declare v_version public.course_versions;
begin
  if new.status='published' then
    new.published_at := coalesce(new.published_at,now());
    select * into v_version from public.course_versions where id=new.current_version_id and course_id=new.id;
    if not found or v_version.status<>'published' or new.cover_image_url is null or new.category_id is null
      or new.content_source is null or new.reviewed_at is null or new.rights_verified_at is null
      or jsonb_array_length(new.learning_outcomes)=0 or length(btrim(new.description))=0
      or new.estimated_minutes<=0
      or not exists(select 1 from public.course_chapters ch join public.course_lessons l on l.chapter_id=ch.id
        where ch.version_id=v_version.id and l.published)
      or not exists(select 1 from public.course_chapters ch join public.course_lessons l on l.chapter_id=ch.id
        where ch.version_id=v_version.id and l.published and l.is_free_preview)
      or not exists(select 1 from public.offers o join public.offer_prices p on p.offer_id=o.id
        where o.course_id=new.id and o.kind='course' and p.amount_minor>0)
    then
      raise exception 'Publication impossible : version publiée, couverture, origine, objectifs, description, durée, leçons, aperçu gratuit et offre tarifée requis';
    end if;
  end if;
  return new;
end $$;
create trigger learning_publication_guard before insert or update of status,current_version_id on public.courses
  for each row execute function public.validate_learning_publication();
drop trigger if exists course_publication_guard on public.courses;

create function public.validate_version_publication() returns trigger
language plpgsql set search_path=public as $$
begin
  if new.status='published' then
  if not exists(select 1 from public.course_chapters ch where ch.version_id=new.id)
      or not exists(select 1 from public.course_chapters ch join public.course_lessons l on l.chapter_id=ch.id
        where ch.version_id=new.id and l.published and l.is_free_preview)
      or exists(select 1 from public.course_chapters ch where ch.version_id=new.id
        and not exists(select 1 from public.course_lessons l where l.chapter_id=ch.id and l.published))
    then raise exception 'Une version doit contenir des chapitres non vides et au moins un aperçu gratuit'; end if;
    new.published_at := coalesce(new.published_at,now());
  else
    new.published_at := null;
  end if;
  return new;
end $$;
create trigger version_publication_guard before insert or update of status on public.course_versions
  for each row execute function public.validate_version_publication();

create function public.validate_offer_activation() returns trigger
language plpgsql set search_path=public as $$
begin
  if new.active and (not exists(select 1 from public.offer_prices p where p.offer_id=new.id and p.amount_minor>0)
    or (new.kind='course' and not exists(select 1 from public.courses c where c.id=new.course_id and c.status='published'))
    or (new.kind='bundle' and not exists(select 1 from public.offer_courses oc join public.courses c on c.id=oc.course_id
      where oc.offer_id=new.id and c.status='published'))
  ) then raise exception 'Une offre active doit avoir un prix positif et du contenu publié'; end if;
  return new;
end $$;
create trigger offer_activation_guard before insert or update of active on public.offers
  for each row execute function public.validate_offer_activation();

create function public.create_pending_learning_order(p_user uuid, p_offer uuid, p_currency char(3), p_idempotency_key text)
returns table(order_id uuid, amount_minor bigint, amount_xaf integer)
language plpgsql security definer set search_path=public as $$
declare v_price public.offer_prices; v_offer public.offers; v_order uuid; v_xaf integer; v_existing public.learning_orders;
begin
  if p_user is null or p_idempotency_key is null or length(p_idempotency_key)<8 then raise exception 'Commande invalide'; end if;
  select * into v_existing from public.learning_orders where idempotency_key=p_idempotency_key;
  if found then
    if v_existing.user_id<>p_user or v_existing.offer_id<>p_offer or v_existing.currency<>p_currency then
      raise exception 'Idempotency key already used for a different order';
    end if;
    if v_existing.status<>'pending' then raise exception 'Idempotency key refers to an order that is no longer pending'; end if;
    return query select v_existing.id,v_existing.amount_minor,v_existing.amount_xaf;
    return;
  end if;
  select * into v_offer from public.offers where id=p_offer and active;
  if not found then raise exception 'Offre indisponible'; end if;
  select * into v_price from public.offer_prices where offer_id=p_offer and currency=p_currency;
  if not found or v_price.amount_minor<=0 then raise exception 'Prix indisponible'; end if;
  v_xaf := case p_currency when 'XAF' then v_price.amount_minor::integer
    when 'EUR' then round(v_price.amount_minor*655957.0/100000)::integer
    else null end;
  if v_xaf is null or v_xaf<=0 then raise exception 'Devise non prise en charge par le paiement mobile'; end if;
  insert into public.learning_orders(user_id,offer_id,currency,amount_minor,amount_xaf,idempotency_key)
    values(p_user,p_offer,p_currency,v_price.amount_minor,v_xaf,p_idempotency_key)
    returning id into v_order;
  return query select v_order,v_price.amount_minor,v_xaf;
end $$;

create function public.fulfill_learning_order(p_order uuid, p_provider_reference text, p_raw_webhook jsonb default null)
returns void language plpgsql security definer set search_path=public as $$
declare v_order public.learning_orders; v_offer public.offers; v_start timestamptz;
begin
  select * into v_order from public.learning_orders where id=p_order for update;
  if not found or v_order.status='paid' then return; end if;
  if v_order.status<>'pending' then return; end if;
  select * into v_offer from public.offers where id=v_order.offer_id;
  update public.learning_orders set status='paid',paid_at=now(),provider_reference=p_provider_reference,raw_webhook=p_raw_webhook
    where id=v_order.id;
  if v_offer.kind='subscription' then
    select greatest(now(),coalesce(max(e.ends_at),now())) into v_start
      from public.learning_entitlements e where e.user_id=v_order.user_id and e.scope='all_courses'
        and e.revoked_at is null and e.ends_at>now();
    insert into public.learning_entitlements(user_id,scope,starts_at,ends_at,source_order_id,code_license)
      values(v_order.user_id,'all_courses',v_start,v_start+make_interval(days=>v_offer.duration_days),v_order.id,v_offer.code_license);
  elsif v_offer.kind='course' then
    insert into public.learning_entitlements(user_id,scope,course_id,source_order_id,code_license)
      values(v_order.user_id,'course',v_offer.course_id,v_order.id,v_offer.code_license);
  else
    insert into public.learning_entitlements(user_id,scope,course_id,starts_at,ends_at,source_order_id,code_license)
      select v_order.user_id,'course',oc.course_id,now(),
        case when v_offer.duration_days is null then null else now()+make_interval(days=>v_offer.duration_days) end,
        v_order.id,v_offer.code_license
      from public.offer_courses oc where oc.offer_id=v_offer.id;
  end if;
end $$;

create function public.admin_grant_learning_access(
  p_user uuid, p_scope text, p_course uuid, p_starts_at timestamptz,
  p_ends_at timestamptz, p_code_license public.license_tier, p_reason text
) returns uuid language plpgsql security definer set search_path=public as $$
declare v_id uuid;
begin
  if not public.is_admin() then raise exception 'Administrator access required'; end if;
  if p_reason is null or length(btrim(p_reason))<5 then raise exception 'A reason is required'; end if;
  if (p_scope='course' and p_course is null) or (p_scope='all_courses' and p_course is not null)
    or p_scope not in ('course','all_courses') then raise exception 'Invalid access scope'; end if;
  if not exists(select 1 from auth.users where id=p_user) then raise exception 'User not found'; end if;
  insert into public.learning_entitlements(user_id,scope,course_id,starts_at,ends_at,code_license)
    values(p_user,p_scope,p_course,coalesce(p_starts_at,now()),p_ends_at,p_code_license) returning id into v_id;
  insert into public.learning_audit_log(actor_id,action,entity_type,entity_id,reason,details)
    values(auth.uid(),'grant_access','learning_entitlement',v_id,p_reason,jsonb_build_object('user_id',p_user,'scope',p_scope,'course_id',p_course));
  return v_id;
end $$;

create function public.admin_revoke_learning_order(p_order uuid, p_reason text)
returns void language plpgsql security definer set search_path=public as $$
declare v_order public.learning_orders;
begin
  if not public.is_admin() then raise exception 'Administrator access required'; end if;
  if p_reason is null or length(btrim(p_reason))<5 then raise exception 'A reason is required'; end if;
  select * into v_order from public.learning_orders where id=p_order for update;
  if not found or v_order.status<>'paid' then raise exception 'Only a paid learning order can be revoked'; end if;
  update public.learning_orders set status='refunded' where id=p_order;
  update public.learning_entitlements set revoked_at=now()
    where source_order_id=p_order and revoked_at is null;
  insert into public.learning_audit_log(actor_id,action,entity_type,entity_id,reason)
    values(auth.uid(),'revoke_order_access','learning_order',p_order,p_reason);
end $$;

revoke all on function public.can_access_course(uuid) from public;
revoke all on function public.can_access_lesson(uuid) from public;
grant execute on function public.can_access_course(uuid) to anon, authenticated;
grant execute on function public.can_access_lesson(uuid) to anon, authenticated;
revoke all on function public.create_pending_learning_order(uuid,uuid,char,text) from public, anon, authenticated;
revoke all on function public.fulfill_learning_order(uuid,text,jsonb) from public, anon, authenticated;
grant execute on function public.create_pending_learning_order(uuid,uuid,char,text) to service_role;
grant execute on function public.fulfill_learning_order(uuid,text,jsonb) to service_role;
revoke all on function public.admin_grant_learning_access(uuid,text,uuid,timestamptz,timestamptz,public.license_tier,text) from public, anon;
revoke all on function public.admin_revoke_learning_order(uuid,text) from public, anon;
grant execute on function public.admin_grant_learning_access(uuid,text,uuid,timestamptz,timestamptz,public.license_tier,text) to authenticated;
grant execute on function public.admin_revoke_learning_order(uuid,text) to authenticated;
revoke all on function public.save_lesson_progress(uuid,integer,boolean) from public, anon;
grant execute on function public.save_lesson_progress(uuid,integer,boolean) to authenticated;

alter table public.learning_orders add constraint learning_order_amount_currency_check
  check ((currency='XAF' and amount_minor=amount_xaf) or currency in ('EUR','USD'));

insert into storage.buckets(id,name,public) values('course-content','course-content',false) on conflict(id) do nothing;

-- The former draft commerce tables are left in place as a migration bridge;
-- the new checkout and access rules use offers, learning_orders and entitlements.
