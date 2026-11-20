-- GPP DRIP SYSTEM: run 01 to 03 in order in Supabase > SQL Editor, on a fresh project (or run setup.sql once)
create table public.categories(
  slug text primary key, name text not null,
  parent text references public.categories(slug) on delete cascade,
  descr text, emoji text, cover text, sort int not null default 0);
create table public.labels(
  slug text primary key, name text not null, tagline text, about text, logo text,
  accent text not null default '#F2B84B', bg text not null default '#1B120D', sort int not null default 0);
create table public.products(
  id bigint generated always as identity primary key,
  name text not null, description text, price numeric(10,2),
  category text not null references public.categories(slug) on update cascade,
  label text not null default 'gpp' references public.labels(slug) on update cascade,
  colours text, images text[] not null default '{}',
  in_stock boolean not null default true, is_new boolean not null default false,
  created_at timestamptz not null default now());
create table public.notices(
  id bigint generated always as identity primary key,
  kind text not null default 'announcement' check (kind in ('announcement','promotion','discount')),
  title text not null, body text, badge text,
  starts_at timestamptz not null default now(), ends_at timestamptz,
  is_active boolean not null default true, created_at timestamptz not null default now());
create table public.profiles(
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text, phone text, address text, updated_at timestamptz not null default now());
create table public.saved_carts(
  user_id uuid primary key references auth.users(id) on delete cascade,
  items jsonb not null default '[]', updated_at timestamptz not null default now());
create table public.wishlists(
  user_id uuid references auth.users(id) on delete cascade,
  product_id bigint references public.products(id) on delete cascade,
  primary key(user_id, product_id));
create table public.quotes(
  id bigint generated always as identity primary key,
  ref text unique not null, user_id uuid references auth.users(id) on delete set null,
  customer_name text, customer_phone text, note text, total numeric(10,2) not null default 0,
  status text not null default 'new' check (status in ('new','contacted','accepted','completed','cancelled')),
  created_at timestamptz not null default now());
create table public.quote_items(
  id bigint generated always as identity primary key,
  quote_id bigint not null references public.quotes(id) on delete cascade,
  product_id bigint references public.products(id) on delete set null,
  name text not null, unit_price numeric(10,2), qty int not null check (qty > 0));
create table public.restock_requests(
  id bigint generated always as identity primary key,
  product_id bigint references public.products(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  name text, phone text, created_at timestamptz not null default now());
create table public.admins(
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text, created_at timestamptz not null default now());
create index on public.products(category);
create index on public.products(label);
create index on public.quotes(user_id);
create index on public.quote_items(quote_id);
