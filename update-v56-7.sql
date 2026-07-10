-- Doce Encanto V56.7 - Migração segura do PIX Mercado Pago
alter table public.orders add column if not exists customer_email text;
alter table public.orders add column if not exists mp_payment_id text;
alter table public.orders add column if not exists mp_status text;
alter table public.orders add column if not exists mp_status_detail text;
alter table public.orders add column if not exists pix_qr_code text;
alter table public.orders add column if not exists pix_qr_code_base64 text;
alter table public.orders add column if not exists pix_ticket_url text;
alter table public.orders add column if not exists pix_expires_at timestamptz;
alter table public.orders add column if not exists payment_paid_at timestamptz;
alter table public.orders add column if not exists payment_updated_at timestamptz;
create index if not exists orders_mp_payment_id_idx on public.orders(mp_payment_id);
create index if not exists orders_mp_status_idx on public.orders(mp_status);
