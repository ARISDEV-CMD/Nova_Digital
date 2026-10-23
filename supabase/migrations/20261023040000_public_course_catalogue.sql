-- Public storefront needs to preview the 100 editorial course titles before
-- their lessons are ready. Expose only catalogue metadata for non-archived
-- courses; unpublished course content and inactive prices remain private.
create or replace function public.public_course_catalogue()
returns table (
  id uuid,
  code text,
  slug text,
  title text,
  category text,
  subtitle text,
  short_description text,
  level text,
  estimated_minutes integer,
  cover_image_url text,
  status text,
  price_eur numeric
)
language sql
stable
security definer
set search_path = public
as $$
  select
    c.id,
    c.code,
    c.slug,
    c.title,
    c.category::text,
    case when c.status = 'published' then c.subtitle else '' end,
    case when c.status = 'published' then c.short_description else '' end,
    case when c.status = 'published' then c.level::text else null end,
    case when c.status = 'published' then c.estimated_minutes else null end,
    case when c.status = 'published' then c.cover_image_url else null end,
    c.status::text,
    (
      select p.amount_minor::numeric / 100
      from public.offers o
      join public.offer_prices p on p.offer_id = o.id and p.currency = 'EUR'
      where o.course_id = c.id and o.kind = 'course'
      order by o.active desc, o.updated_at desc
      limit 1
    )
  from public.courses c
  where c.status <> 'archived'
  order by c.code;
$$;

revoke all on function public.public_course_catalogue() from public;
grant execute on function public.public_course_catalogue() to anon, authenticated;
