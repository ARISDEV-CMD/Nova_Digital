-- NovaDigital — support Notch Pay
-- Notch Pay encaisse en XAF (entiers) ; nos prix restent en centimes d'euro.
alter type public.payment_method add value if not exists 'notchpay';

alter table public.orders
  add column amount_xaf integer check (amount_xaf >= 0);   -- montant réellement demandé à Notch Pay

-- Journal d'audit des webhooks reçus (le traitement lui-même est idempotent via mark_order_paid)
create table public.webhook_events (
  id          text primary key,
  type        text not null,
  payload     jsonb not null,
  received_at timestamptz not null default now()
);
alter table public.webhook_events enable row level security;   -- aucune policy : service_role uniquement
