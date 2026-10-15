-- Execute uma vez no SQL Editor do projeto Supabase da Enquadraria.
create table if not exists public.shop_catalog (id text primary key, data jsonb not null, created_at timestamptz not null default now());
create table if not exists public.shop_settings (id text primary key, data jsonb not null, created_at timestamptz not null default now());
create table if not exists public.shop_orders (id text primary key, data jsonb not null, created_at timestamptz not null default now());
alter table public.shop_catalog enable row level security;
alter table public.shop_settings enable row level security;
alter table public.shop_orders enable row level security;
-- Sem políticas públicas: somente o servidor com service_role acessa os registros.
revoke all on public.shop_catalog, public.shop_settings, public.shop_orders from anon, authenticated;
grant all on public.shop_catalog, public.shop_settings, public.shop_orders to service_role;
insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types) values
('catalog-images','catalog-images',false,3500000,array['image/jpeg','image/png','image/webp']),
('order-photos','order-photos',false,3500000,array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;
