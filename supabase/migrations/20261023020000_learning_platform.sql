-- Learning catalogue and prepaid access model for Nova Digital.
-- Material stays unpublished until editorial review and distribution rights are confirmed.

create type public.course_level as enum ('beginner', 'intermediate', 'advanced', 'all_levels');
create type public.course_status as enum ('draft', 'review', 'published', 'archived');
create type public.course_category as enum (
  'ai_automation', 'web_development', 'design_visual', 'digital_marketing',
  'video_content', 'productivity', 'data_bi', 'cybersecurity',
  'entrepreneurship', 'career'
);
create type public.lesson_type as enum ('video', 'text', 'quiz', 'project');
create type public.subscription_period as enum ('month', 'quarter', 'year');
create type public.subscription_status as enum ('pending', 'active', 'expired', 'cancelled', 'failed');
create type public.access_scope as enum ('all_courses', 'selected_courses', 'selected_categories');
create type public.learning_purchase_status as enum ('pending', 'paid', 'failed', 'refunded');

create table public.courses (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  category public.course_category not null,
  subcategory text not null default '',
  short_description text not null default '',
  description text not null default '',
  learning_objectives text[] not null default '{}',
  prerequisites text[] not null default '{}',
  level public.course_level not null default 'beginner',
  estimated_minutes integer not null default 0 check (estimated_minutes >= 0),
  language_code text not null default 'fr',
  author_name text not null default '',
  cover_image_url text,
  price_cents integer check (price_cents is null or price_cents >= 0),
  currency char(3) not null default 'EUR',
  promotional_price_cents integer check (promotional_price_cents is null or promotional_price_cents >= 0),
  teaching_format text[] not null default '{}',
  syllabus jsonb not null default '[]'::jsonb,
  final_project text not null default '',
  status public.course_status not null default 'draft',
  published_at timestamptz,
  reviewed_at timestamptz,
  rights_verified_at timestamptz,
  last_content_review_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (promotional_price_cents is null or price_cents is null or promotional_price_cents <= price_cents),
  check (status <> 'published' or (published_at is not null and reviewed_at is not null and rights_verified_at is not null))
);
create index courses_catalog_idx on public.courses(category, level) where status = 'published';
create trigger courses_touch before update on public.courses for each row execute function public.touch_updated_at();

create table public.course_chapters (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  position integer not null check (position > 0),
  title text not null,
  description text not null default '',
  created_at timestamptz not null default now(),
  unique(course_id, position),
  unique(id, course_id)
);

create table public.course_lessons (
  id uuid primary key default gen_random_uuid(),
  chapter_id uuid not null,
  course_id uuid not null,
  position integer not null check (position > 0),
  title text not null,
  lesson_type public.lesson_type not null,
  duration_minutes integer not null default 0 check (duration_minutes >= 0),
  is_free boolean not null default false,
  text_content text,
  video_storage_path text,
  quiz jsonb,
  project_instructions text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key(chapter_id, course_id) references public.course_chapters(id, course_id) on delete cascade,
  unique(chapter_id, position),
  unique(id, course_id)
);
create index course_lessons_order_idx on public.course_lessons(chapter_id, position);
create trigger lessons_touch before update on public.course_lessons for each row execute function public.touch_updated_at();

create table public.course_resources (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.course_lessons(id) on delete cascade,
  title text not null,
  storage_path text not null,
  resource_type text not null default 'download',
  created_at timestamptz not null default now()
);

create table public.course_packs (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  description text not null default '',
  category public.course_category,
  price_cents integer not null check (price_cents >= 0),
  promotional_price_cents integer check (promotional_price_cents is null or (promotional_price_cents >= 0 and promotional_price_cents <= price_cents)),
  currency char(3) not null default 'EUR',
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger packs_touch before update on public.course_packs for each row execute function public.touch_updated_at();

create table public.course_pack_items (
  pack_id uuid not null references public.course_packs(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete restrict,
  primary key(pack_id, course_id)
);

create table public.subscription_plans (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text not null default '',
  period public.subscription_period not null,
  period_count integer not null default 1 check (period_count > 0),
  price_cents integer not null check (price_cents >= 0),
  currency char(3) not null default 'EUR',
  access_scope public.access_scope not null default 'all_courses',
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger plans_touch before update on public.subscription_plans for each row execute function public.touch_updated_at();

create table public.plan_course_access (
  plan_id uuid not null references public.subscription_plans(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  primary key(plan_id, course_id)
);
create table public.plan_category_access (
  plan_id uuid not null references public.subscription_plans(id) on delete cascade,
  category public.course_category not null,
  primary key(plan_id, category)
);

-- These are prepaid periods. `ends_at` is fixed when a payment succeeds;
-- renewal means purchasing a new period, not an automatic card/MoMo charge.
create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan_id uuid not null references public.subscription_plans(id),
  status public.subscription_status not null default 'pending',
  starts_at timestamptz,
  ends_at timestamptz,
  amount_paid_cents integer not null check (amount_paid_cents >= 0),
  currency char(3) not null default 'EUR',
  payment_method public.payment_method not null default 'notchpay',
  provider_ref text unique,
  created_at timestamptz not null default now(),
  check ((status <> 'active') or (starts_at is not null and ends_at is not null and ends_at > starts_at))
);
create index subscriptions_user_active_idx on public.subscriptions(user_id, ends_at desc) where status = 'active';

create table public.learning_purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  course_id uuid references public.courses(id) on delete restrict,
  pack_id uuid references public.course_packs(id) on delete restrict,
  status public.learning_purchase_status not null default 'pending',
  amount_paid_cents integer not null check (amount_paid_cents >= 0),
  currency char(3) not null default 'EUR',
  payment_method public.payment_method not null default 'notchpay',
  provider_ref text unique,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  check ((course_id is null) <> (pack_id is null))
);
create index learning_purchases_user_idx on public.learning_purchases(user_id, status);

create table public.lesson_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  lesson_id uuid not null references public.course_lessons(id) on delete cascade,
  is_completed boolean not null default false,
  completed_at timestamptz,
  last_position_seconds integer not null default 0 check (last_position_seconds >= 0),
  updated_at timestamptz not null default now(),
  primary key(user_id, lesson_id),
  check ((is_completed and completed_at is not null) or (not is_completed))
);

create function public.can_access_course(p_course uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.subscriptions s
    join public.subscription_plans sp on sp.id = s.plan_id and sp.is_published
    where s.user_id = auth.uid() and s.status = 'active' and s.starts_at <= now() and s.ends_at > now()
      and (sp.access_scope = 'all_courses'
        or (sp.access_scope = 'selected_courses' and exists(select 1 from public.plan_course_access a where a.plan_id=sp.id and a.course_id=p_course))
        or (sp.access_scope = 'selected_categories' and exists(select 1 from public.plan_category_access a join public.courses c on c.id=p_course where a.plan_id=sp.id and a.category=c.category)))
  ) or exists (
    select 1 from public.learning_purchases p where p.user_id=auth.uid() and p.status='paid'
      and (p.course_id=p_course or exists(select 1 from public.course_pack_items pi where pi.pack_id=p.pack_id and pi.course_id=p_course))
  );
$$;

alter table public.courses enable row level security;
alter table public.course_chapters enable row level security;
alter table public.course_lessons enable row level security;
alter table public.course_resources enable row level security;
alter table public.course_packs enable row level security;
alter table public.course_pack_items enable row level security;
alter table public.subscription_plans enable row level security;
alter table public.plan_course_access enable row level security;
alter table public.plan_category_access enable row level security;
alter table public.subscriptions enable row level security;
alter table public.learning_purchases enable row level security;
alter table public.lesson_progress enable row level security;

create policy courses_public_read on public.courses for select using (status='published' or public.is_admin());
create policy courses_admin_write on public.courses for all using (public.is_admin()) with check (public.is_admin());
create policy chapters_public_read on public.course_chapters for select using (exists(select 1 from public.courses c where c.id=course_id and (c.status='published' or public.is_admin())));
create policy chapters_admin_write on public.course_chapters for all using (public.is_admin()) with check (public.is_admin());
create policy lessons_access_read on public.course_lessons for select using (
  exists(select 1 from public.courses c where c.id=course_id and c.status='published')
  and (is_free or public.can_access_course(course_id) or public.is_admin())
);
create policy lessons_admin_write on public.course_lessons for all using (public.is_admin()) with check (public.is_admin());
create policy resources_access_read on public.course_resources for select using (
  exists(select 1 from public.course_lessons l join public.courses c on c.id=l.course_id where l.id=lesson_id and c.status='published' and (l.is_free or public.can_access_course(l.course_id) or public.is_admin()))
);
create policy resources_admin_write on public.course_resources for all using (public.is_admin()) with check (public.is_admin());
create policy packs_public_read on public.course_packs for select using (is_published or public.is_admin());
create policy packs_admin_write on public.course_packs for all using (public.is_admin()) with check (public.is_admin());
create policy pack_items_public_read on public.course_pack_items for select using (exists(select 1 from public.course_packs p where p.id=pack_id and p.is_published));
create policy pack_items_admin_write on public.course_pack_items for all using (public.is_admin()) with check (public.is_admin());
create policy plans_public_read on public.subscription_plans for select using (is_published or public.is_admin());
create policy plans_admin_write on public.subscription_plans for all using (public.is_admin()) with check (public.is_admin());
create policy plan_course_public_read on public.plan_course_access for select using (exists(select 1 from public.subscription_plans p where p.id=plan_id and p.is_published));
create policy plan_course_admin_write on public.plan_course_access for all using (public.is_admin()) with check (public.is_admin());
create policy plan_category_public_read on public.plan_category_access for select using (exists(select 1 from public.subscription_plans p where p.id=plan_id and p.is_published));
create policy plan_category_admin_write on public.plan_category_access for all using (public.is_admin()) with check (public.is_admin());
create policy subscriptions_own_read on public.subscriptions for select using (user_id=auth.uid() or public.is_admin());
create policy learning_purchases_own_read on public.learning_purchases for select using (user_id=auth.uid() or public.is_admin());
create policy progress_own_all on public.lesson_progress for all using (user_id=auth.uid()) with check (
  user_id=auth.uid() and exists(select 1 from public.course_lessons l where l.id=lesson_id and (l.is_free or public.can_access_course(l.course_id)))
);

insert into storage.buckets(id,name,public) values ('course-content','course-content',false) on conflict(id) do nothing;
alter table public.subscriptions add column amount_xaf integer check (amount_xaf is null or amount_xaf >= 0);

create function public.create_pending_subscription(p_user uuid, p_plan uuid, p_amount_xaf integer)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_subscription uuid; v_plan public.subscription_plans;
begin
  if p_user is null then raise exception 'Utilisateur invalide'; end if;
  if p_amount_xaf <= 0 then raise exception 'Montant invalide'; end if;
  select * into v_plan from public.subscription_plans where id=p_plan and is_published;
  if not found then raise exception 'Offre indisponible'; end if;
  insert into public.subscriptions(user_id,plan_id,amount_paid_cents,currency,amount_xaf)
  values(p_user,p_plan,v_plan.price_cents,v_plan.currency,p_amount_xaf)
  returning id into v_subscription;
  return v_subscription;
end $$;

create function public.activate_subscription(p_subscription uuid, p_provider_ref text)
returns void language plpgsql security definer set search_path = public as $$
declare v_row public.subscriptions; v_period public.subscription_period; v_period_count integer; v_start timestamptz;
begin
  select * into v_row from public.subscriptions where id=p_subscription and status='pending' for update;
  if not found then return; end if;
  select period, period_count into v_period, v_period_count from public.subscription_plans where id=v_row.plan_id;
  select greatest(now(), coalesce(max(ends_at), now())) into v_start
  from public.subscriptions where user_id=v_row.user_id and plan_id=v_row.plan_id and status='active';
  update public.subscriptions set status='active', starts_at=v_start,
    ends_at=v_start + case v_period when 'month' then make_interval(months=>v_period_count) when 'quarter' then make_interval(months=>3*v_period_count) when 'year' then make_interval(years=>v_period_count) end,
    provider_ref=p_provider_ref
  where id=p_subscription and status='pending';
end $$;

revoke all on function public.create_pending_subscription(uuid,uuid,integer) from public, anon, authenticated;
revoke all on function public.can_access_course(uuid) from public;
grant execute on function public.can_access_course(uuid) to anon, authenticated;
revoke all on function public.activate_subscription(uuid,text) from public, anon, authenticated;
grant execute on function public.create_pending_subscription(uuid,uuid,integer) to service_role;
grant execute on function public.activate_subscription(uuid,text) to service_role;
alter table public.learning_purchases add column amount_xaf integer check (amount_xaf is null or amount_xaf >= 0);
create function public.validate_course_publication() returns trigger
language plpgsql set search_path = public as $$
begin
  if new.status = 'published' and (
    cardinality(new.learning_objectives) = 0 or length(btrim(new.description)) = 0 or new.estimated_minutes <= 0
    or not exists(select 1 from public.course_chapters ch join public.course_lessons le on le.chapter_id=ch.id where ch.course_id=new.id)
  ) then
    raise exception 'Une formation publiée doit avoir des objectifs, une description, une durée et au moins une leçon';
  end if;
  return new;
end $$;
create trigger course_publication_guard before insert or update of status on public.courses
  for each row execute function public.validate_course_publication();

create function public.validate_pack_publication() returns trigger
language plpgsql set search_path = public as $$
begin
  if new.is_published and not exists(
    select 1 from public.course_pack_items pi join public.courses c on c.id=pi.course_id
    where pi.pack_id=new.id and c.status='published'
  ) then raise exception 'Un pack publié doit contenir au moins une formation publiée'; end if;
  return new;
end $$;
create trigger pack_publication_guard before insert or update of is_published on public.course_packs
  for each row execute function public.validate_pack_publication();

create function public.validate_plan_publication() returns trigger
language plpgsql set search_path = public as $$
begin
  if new.is_published and new.access_scope='selected_courses' and not exists(select 1 from public.plan_course_access where plan_id=new.id) then
    raise exception 'Une offre doit inclure au moins une formation';
  end if;
  if new.is_published and new.access_scope='selected_categories' and not exists(select 1 from public.plan_category_access where plan_id=new.id) then
    raise exception 'Une offre doit inclure au moins une categorie';
  end if;
  return new;
end $$;
create trigger plan_publication_guard before insert or update of is_published on public.subscription_plans
  for each row execute function public.validate_plan_publication();

create or replace policy pack_items_public_read on public.course_pack_items for select using (
  exists(select 1 from public.course_packs p where p.id=pack_id and p.is_published)
  and exists(select 1 from public.courses c where c.id=course_id and c.status='published')
);
