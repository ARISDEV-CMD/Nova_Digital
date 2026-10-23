-- NovaDigital — schéma initial Supabase
-- Principes :
--   * montants en centimes d'euro (integer), jamais en float
--   * le client (anon/authenticated) ne crée NI ne modifie jamais une commande :
--     tout passe par des fonctions réservées au service_role (Edge Functions)
--   * les prix, remises et clés de licence sont calculés côté base, pas dans le navigateur

-- ───────── Types ─────────
create type public.product_category as enum ('boilerplates', 'ui', 'formations', 'ebooks', 'presets');
create type public.delivery_type    as enum ('instant', 'github', 'video', 'book');
create type public.license_tier     as enum ('standard', 'agency');
create type public.promo_type       as enum ('percent', 'fixed');
create type public.payment_method   as enum ('stripe', 'momo', 'paypal');
create type public.order_status     as enum ('pending', 'paid', 'failed', 'refunded');
create type public.user_role        as enum ('customer', 'admin');

-- ───────── Séquences (numéros lisibles) ─────────
create sequence public.order_number_seq start 9500;
create sequence public.invoice_seq      start 1;

-- ───────── Profils ─────────
create table public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  full_name  text,
  company    text,
  vat_number text,
  role       public.user_role not null default 'customer',
  created_at timestamptz not null default now()
);

create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''));
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

-- ───────── Produits ─────────
create table public.products (
  id                 uuid primary key default gen_random_uuid(),
  slug               text not null unique,            -- ex. 'nexus-saas' (ids actuels du front)
  sku                text not null unique,
  title              text not null,
  subtitle           text not null default '',
  description        text not null default '',
  category           public.product_category not null,
  category_label     text not null default '',
  price_cents        integer not null check (price_cents >= 0),
  agency_price_cents integer check (agency_price_cents >= 0),   -- remplace le 179 codé en dur
  old_price_cents    integer check (old_price_cents >= 0),
  rating             numeric(3,2) not null default 0 check (rating between 0 and 5),
  review_count       integer not null default 0,
  image_url          text,
  badge              text,
  delivery_type      public.delivery_type not null,
  format_label       text not null default '',
  file_size          text not null default '',
  tags               text[] not null default '{}',
  tech_stack         text[] not null default '{}',
  github_repo        text,
  storage_path       text,                            -- fichier livrable dans le bucket privé 'deliverables'
  is_draft           boolean not null default true,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
create index products_category_idx on public.products (category) where not is_draft;

create function public.touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;
create trigger products_touch before update on public.products
  for each row execute function public.touch_updated_at();

-- ───────── Codes promo (jamais lisibles par le public) ─────────
create table public.promo_codes (
  code                text primary key check (code = upper(code)),
  description         text not null default '',
  type                public.promo_type not null,
  value               integer not null check (value > 0),     -- % ou centimes selon type
  min_spend_cents     integer not null default 0,
  category_eligible   public.product_category,
  usage_count         integer not null default 0,
  max_usage           integer not null check (max_usage > 0),
  active              boolean not null default true,
  expires_at          timestamptz,
  created_at          timestamptz not null default now(),
  check (type <> 'percent' or value <= 100)
);

-- ───────── Commandes ─────────
create table public.orders (
  id               uuid primary key default gen_random_uuid(),
  order_number     text not null unique default ('#NOVA-' || nextval('public.order_number_seq')),
  user_id          uuid references auth.users (id) on delete set null,   -- null = achat invité
  client_email     text not null,
  client_name      text not null,
  company_name     text,
  vat_number       text,
  payment_method   public.payment_method not null,
  provider_ref     text unique,                        -- id de transaction Stripe / opérateur MoMo
  promo_code       text references public.promo_codes (code),
  subtotal_cents   integer not null check (subtotal_cents >= 0),
  discount_cents   integer not null default 0 check (discount_cents >= 0),
  total_cents      integer not null check (total_cents >= 0),
  status           public.order_status not null default 'pending',
  invoice_ref      text unique,
  created_at       timestamptz not null default now(),
  paid_at          timestamptz
);
create index orders_user_idx  on public.orders (user_id, created_at desc);
create index orders_email_idx on public.orders (lower(client_email));

create table public.order_items (
  id            uuid primary key default gen_random_uuid(),
  order_id      uuid not null references public.orders (id) on delete cascade,
  product_id    uuid not null references public.products (id),
  license_tier  public.license_tier not null default 'standard',
  price_cents   integer not null check (price_cents >= 0),   -- prix figé au moment de l'achat
  license_key   text not null unique
                default ('NOVA-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 4)) || '-' ||
                                    upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 4)) || '-' ||
                                    upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 4)) || '-AUTH'),
  revoked_at    timestamptz                                 -- remplace le state local `revokedTokens`
);
create index order_items_order_idx on public.order_items (order_id);

-- ───────── Calcul de panier côté serveur ─────────
-- p_items : [{"product_id": "<uuid>", "tier": "standard"|"agency"}, ...]
create function public.quote_cart(p_items jsonb, p_promo text default null)
returns table (subtotal_cents integer, discount_cents integer, total_cents integer, promo_valid boolean, message text)
language plpgsql stable security definer set search_path = public as $$
declare
  v_subtotal integer;
  v_eligible integer;
  v_promo    public.promo_codes;
  v_discount integer := 0;
  v_valid    boolean := false;
  v_msg      text := null;
begin
  select coalesce(sum(case when (i ->> 'tier') = 'agency'
                           then coalesce(p.agency_price_cents, p.price_cents)
                           else p.price_cents end), 0)
    into v_subtotal
  from jsonb_array_elements(p_items) i
  join public.products p on p.id = (i ->> 'product_id')::uuid and not p.is_draft;

  if p_promo is not null and btrim(p_promo) <> '' then
    select * into v_promo from public.promo_codes where code = upper(btrim(p_promo));

    if not found or not v_promo.active or (v_promo.expires_at is not null and v_promo.expires_at < now()) then
      v_msg := 'Code promo inexistant ou expiré.';
    elsif v_promo.usage_count >= v_promo.max_usage then
      v_msg := 'Ce code promo a atteint son quota maximal.';
    elsif v_subtotal < v_promo.min_spend_cents then
      v_msg := format('Panier minimum de %s € requis pour ce code.', to_char(v_promo.min_spend_cents / 100.0, 'FM999990.00'));
    else
      -- base de remise : tout le panier, ou seulement la catégorie éligible
      select coalesce(sum(case when (i ->> 'tier') = 'agency'
                               then coalesce(p.agency_price_cents, p.price_cents)
                               else p.price_cents end), 0)
        into v_eligible
      from jsonb_array_elements(p_items) i
      join public.products p on p.id = (i ->> 'product_id')::uuid and not p.is_draft
      where v_promo.category_eligible is null or p.category = v_promo.category_eligible;

      v_discount := case v_promo.type
        when 'percent' then round(v_eligible * v_promo.value / 100.0)::integer
        else v_promo.value end;
      v_discount := least(v_discount, v_eligible);
      v_valid := true;
      v_msg := format('Code %s activé (-%s € offerts)', v_promo.code, to_char(v_discount / 100.0, 'FM999990.00'));
    end if;
  end if;

  return query select v_subtotal, v_discount, v_subtotal - v_discount, v_valid, v_msg;
end $$;

-- ───────── Création / validation de commande (service_role uniquement) ─────────
create function public.create_pending_order(
  p_user_id uuid, p_email text, p_name text, p_company text, p_vat text,
  p_method public.payment_method, p_items jsonb, p_promo text default null
) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  q  record;
  v_order uuid;
  v_found integer;
begin
  if jsonb_array_length(p_items) = 0 then raise exception 'Panier vide'; end if;

  -- tout article doit exister et être publié : sinon il serait ignoré en silence (panier à 0 €)
  select count(*) into v_found
  from jsonb_array_elements(p_items) i
  join public.products p on p.id = (i ->> 'product_id')::uuid and not p.is_draft;
  if v_found <> jsonb_array_length(p_items) then
    raise exception 'Un ou plusieurs produits sont indisponibles';
  end if;

  select * into q from public.quote_cart(p_items, p_promo);
  if p_promo is not null and btrim(p_promo) <> '' and not q.promo_valid then
    raise exception '%', q.message;
  end if;

  insert into public.orders (user_id, client_email, client_name, company_name, vat_number,
                             payment_method, promo_code, subtotal_cents, discount_cents, total_cents)
  values (p_user_id, lower(btrim(p_email)), btrim(p_name), nullif(btrim(p_company), ''), nullif(btrim(p_vat), ''),
          p_method, case when q.promo_valid then upper(btrim(p_promo)) end,
          q.subtotal_cents, q.discount_cents, q.total_cents)
  returning id into v_order;

  insert into public.order_items (order_id, product_id, license_tier, price_cents)
  select v_order, p.id, (i ->> 'tier')::public.license_tier,
         case when (i ->> 'tier') = 'agency' then coalesce(p.agency_price_cents, p.price_cents) else p.price_cents end
  from jsonb_array_elements(p_items) i
  join public.products p on p.id = (i ->> 'product_id')::uuid and not p.is_draft;

  return v_order;
end $$;

-- À appeler uniquement depuis le webhook de paiement (signature vérifiée).
create function public.mark_order_paid(p_order uuid, p_provider_ref text) returns void
language plpgsql security definer set search_path = public as $$
declare v_promo text;
begin
  update public.orders
     set status = 'paid', paid_at = now(), provider_ref = p_provider_ref,
         invoice_ref = 'FAC-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('public.invoice_seq')::text, 4, '0')
   where id = p_order and status = 'pending'
   returning promo_code into v_promo;

  if not found then return; end if;     -- idempotent : un webhook rejoué ne fait rien

  if v_promo is not null then
    update public.promo_codes set usage_count = usage_count + 1 where code = v_promo;
  end if;
end $$;

revoke all on function public.create_pending_order(uuid, text, text, text, text, public.payment_method, jsonb, text) from public, anon, authenticated;
revoke all on function public.mark_order_paid(uuid, text) from public, anon, authenticated;
grant execute on function public.create_pending_order(uuid, text, text, text, text, public.payment_method, jsonb, text) to service_role;
grant execute on function public.mark_order_paid(uuid, text) to service_role;
grant execute on function public.quote_cart(jsonb, text) to anon, authenticated;   -- validation promo côté UI

-- ───────── RLS ─────────
alter table public.profiles    enable row level security;
alter table public.products    enable row level security;
alter table public.promo_codes enable row level security;
alter table public.orders      enable row level security;
alter table public.order_items enable row level security;

-- profiles : chacun voit et édite le sien, sans pouvoir changer son rôle
create policy profiles_select_own on public.profiles for select
  using (id = auth.uid() or public.is_admin());
create policy profiles_update_own on public.profiles for update
  using (id = auth.uid())
  with check (id = auth.uid() and role = (select p.role from public.profiles p where p.id = auth.uid()));

-- products : catalogue public (hors brouillons), CRUD admin
create policy products_public_read on public.products for select
  using (not is_draft or public.is_admin());
create policy products_admin_write on public.products for all
  using (public.is_admin()) with check (public.is_admin());

-- promo_codes : aucune lecture publique (sinon fuite des codes) ; admin seulement
create policy promos_admin_all on public.promo_codes for all
  using (public.is_admin()) with check (public.is_admin());

-- orders / order_items : lecture de ses propres commandes ; aucune écriture côté client
create policy orders_select_own on public.orders for select
  using (user_id = auth.uid() or public.is_admin());
create policy order_items_select_own on public.order_items for select
  using (exists (select 1 from public.orders o
                 where o.id = order_id and (o.user_id = auth.uid() or public.is_admin())));
-- l'admin peut révoquer une licence
create policy order_items_admin_update on public.order_items for update
  using (public.is_admin()) with check (public.is_admin());

-- ───────── Stockage des livrables (bucket privé, accès par URL signée via Edge Function) ─────────
insert into storage.buckets (id, name, public) values ('deliverables', 'deliverables', false)
on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('product-images', 'product-images', true)
on conflict (id) do nothing;
