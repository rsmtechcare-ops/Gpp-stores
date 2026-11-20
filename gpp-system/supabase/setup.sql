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
-- Admin check: needs (1) a row in admins, (2) role=admin set by the server in app_metadata,
-- (3) a second factor (aal2) as soon as that admin has turned on two-step login.
create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public, auth as $$
  select exists (select 1 from public.admins where user_id = auth.uid())
     and coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin'
     and (coalesce(auth.jwt() ->> 'aal', '') = 'aal2'
          or not exists (select 1 from auth.mfa_factors where user_id = auth.uid() and status = 'verified'))
$$;

create or replace function public.make_admin(admin_email text) returns text
language plpgsql security definer set search_path = public, auth as $$
declare uid uuid;
begin
  if not public.is_admin() then raise exception 'Only admins can add admins'; end if;
  select id into uid from auth.users where lower(email) = lower(admin_email);
  if uid is null then return 'No account with that email yet. Ask them to create an account on the store first.'; end if;
  update auth.users set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role":"admin"}'::jsonb where id = uid;
  insert into public.admins(user_id, display_name) values (uid, lower(admin_email)) on conflict do nothing;
  return 'Added. They must sign out and sign in again.';
end $$;

create or replace function public.remove_admin(admin_email text) returns text
language plpgsql security definer set search_path = public, auth as $$
declare uid uuid;
begin
  if not public.is_admin() then raise exception 'Only admins can remove admins'; end if;
  select id into uid from auth.users where lower(email) = lower(admin_email);
  if uid is null or uid = auth.uid() then return 'Not removed (you cannot remove yourself).'; end if;
  update auth.users set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) - 'role' where id = uid;
  delete from public.admins where user_id = uid;
  return 'Removed';
end $$;

-- Customers create a quote here. Prices come from the database, never from the browser.
create or replace function public.create_quote(items jsonb, cust_name text default null, cust_phone text default null, note text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare qid bigint; r text; tot numeric := 0; lines jsonb := '[]'::jsonb; it jsonb; p record; q int;
begin
  if jsonb_typeof(items) <> 'array' or jsonb_array_length(items) not between 1 and 50 then raise exception 'Empty cart'; end if;
  r := 'GPP-' || to_char(now(), 'MMDD') || '-' || upper(substr(md5(random()::text || clock_timestamp()::text), 1, 5));
  insert into public.quotes(ref, user_id, customer_name, customer_phone, note)
    values (r, auth.uid(), left(cust_name, 80), left(cust_phone, 30), left(note, 300)) returning id into qid;
  for it in select value from jsonb_array_elements(items) loop
    select id, name, price into p from public.products where id = (it ->> 'id')::bigint and in_stock;
    if found then
      q := greatest(1, least(50, coalesce((it ->> 'qty')::int, 1)));
      insert into public.quote_items(quote_id, product_id, name, unit_price, qty) values (qid, p.id, p.name, p.price, q);
      tot := tot + coalesce(p.price, 0) * q;
      lines := lines || jsonb_build_array(jsonb_build_object('name', p.name, 'qty', q, 'price', p.price));
    end if;
  end loop;
  if jsonb_array_length(lines) = 0 then raise exception 'Items no longer available'; end if;
  update public.quotes set total = tot where id = qid;
  return jsonb_build_object('ref', r, 'total', tot, 'lines', lines);
end $$;

-- Every new account gets its own profile row
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles(id, full_name, phone)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)), new.raw_user_meta_data ->> 'phone')
  on conflict do nothing;
  return new;
end $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

alter table public.categories       enable row level security;
alter table public.labels           enable row level security;
alter table public.products         enable row level security;
alter table public.notices          enable row level security;
alter table public.profiles         enable row level security;
alter table public.saved_carts      enable row level security;
alter table public.wishlists        enable row level security;
alter table public.quotes           enable row level security;
alter table public.quote_items      enable row level security;
alter table public.restock_requests enable row level security;
alter table public.admins           enable row level security;

-- Public can read the catalogue and active notices
create policy "read categories" on public.categories for select to anon, authenticated using (true);
create policy "read labels"     on public.labels     for select to anon, authenticated using (true);
create policy "read products"   on public.products   for select to anon, authenticated using (true);
create policy "read notices"    on public.notices    for select to anon, authenticated
  using ((is_active and starts_at <= now() and (ends_at is null or ends_at > now())) or public.is_admin());
-- Only admins change catalogue and marketing data
create policy "admin categories" on public.categories for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admin labels"     on public.labels     for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admin products"   on public.products   for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admin notices"    on public.notices    for all to authenticated using (public.is_admin()) with check (public.is_admin());
-- Each customer sees only their own rows
create policy "own profile read"   on public.profiles for select to authenticated using (id = auth.uid() or public.is_admin());
create policy "own profile insert" on public.profiles for insert to authenticated with check (id = auth.uid());
create policy "own profile update" on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
create policy "own cart"     on public.saved_carts for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own wishlist" on public.wishlists   for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own quotes"   on public.quotes      for select to authenticated using (user_id = auth.uid() or public.is_admin());
create policy "admin quote status" on public.quotes for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "own quote items" on public.quote_items for select to authenticated
  using (exists (select 1 from public.quotes q where q.id = quote_id and (q.user_id = auth.uid() or public.is_admin())));
-- Restock requests: anyone can ask, only admins read
create policy "ask restock"   on public.restock_requests for insert to anon, authenticated with check (user_id is null or user_id = auth.uid());
create policy "admin restock" on public.restock_requests for select to authenticated using (public.is_admin());
create policy "admin clears restock" on public.restock_requests for delete to authenticated using (public.is_admin());
-- Admin list
create policy "admin reads admins"   on public.admins for select to authenticated using (public.is_admin());
create policy "admin removes admins" on public.admins for delete to authenticated using (public.is_admin() and user_id <> auth.uid());
-- Quotes are created only through create_quote(); nobody inserts into quotes directly.
-- Photo bucket: anyone can view, only admins upload
insert into storage.buckets(id, name, public) values ('products', 'products', true) on conflict (id) do nothing;
create policy "public reads photos"  on storage.objects for select using (bucket_id = 'products');
create policy "admin uploads photos" on storage.objects for insert to authenticated with check (bucket_id = 'products' and public.is_admin());
create policy "admin edits photos"   on storage.objects for update to authenticated using (bucket_id = 'products' and public.is_admin());
create policy "admin deletes photos" on storage.objects for delete to authenticated using (bucket_id = 'products' and public.is_admin());
-- Live updates for the store
alter publication supabase_realtime add table public.products, public.notices, public.categories;
-- Starter data (photos come from the store/images folder). Edit or delete everything later in the admin dashboard.
insert into public.labels(slug,name,tagline,about,logo,accent,bg,sort) values
('gpp','GPP Drip Stores','Holy drip since 2024','Our own store: street wear, smart wear, shoes and makeup.','logo','#F2B84B','#1B120D',0),
('elevated-saints','Elevated Saints','Partner label','Elevated Saints pieces, stocked with GPP Drip Stores. New drops are added here as they land.','es-logo','#7FA3BF','#0C0F12',1),
('elevated-saints-beauty','Elevated Saints Beauty','Beauty','Elevated Saints Beauty, stocked with GPP Drip Stores. New products are added here as they land.','esb-logo','#B8893A','#F6E8DD',2),
('2fly-labels','2FLY Labels','We are not saying we are the best. Simply better than the rest.','2FLY Labels, in co-operation with GPP Drip Stores. New pieces are added here as they land.','2fly-logo','#CFC6E8','#1E1E22',3);
insert into public.categories(slug,name,parent,descr,emoji,cover,sort) values
('clothes','Clothes',null,'Street wear and smart wear','👕','ny',0),
('street','Street wear','clothes','T-shirts, joggers, jeans and jackets',null,'koris2',0),
('tees','T-shirts & vests','street',null,null,'mtn',0),
('joggers','Joggers','street',null,null,'jog1',1),
('jeans','Jeans','street',null,null,'blk',2),
('jackets','Jackets','street',null,null,'jkt1',3),
('smart','Smart wear','clothes','Suits and knitwear',null,'suit',1),
('suits','Suits','smart',null,null,'suit',0),
('knits','Cardigans','smart',null,null,'card1',1),
('shoes','Shoes',null,'Sneakers and boots','👟','af1b',1),
('phones','Phones & accessories',null,'Phones, chargers, cases, earphones','📱',null,2),
('makeup','Makeup',null,'Makeup sets and lip care','💄','make',3);
insert into public.products(name,description,price,category,label,colours,images,in_stock,is_new) values
('Cowrie Print Tee','Oversized cotton tee with a cowrie shell print.',null,'tees','gpp','Red, yellow, black, white, rust',array['koris1','koris2','koris3'],true,true),
('Don’t Look Back Tee','Heavy cotton tee with a rear-view mirror print.',null,'tees','gpp','Black, pink, brown, blue, white',array['dlb'],true,true),
('Mountain Heartbeat Tee','Soft tee with a white mountain pulse print.',null,'tees','gpp','Navy, green, blue, red, brown',array['mtn'],true,true),
('Scissors Print Tee','Bold graphic tee in strong colours.',null,'tees','gpp','Rust, blue, black, orange, tan',array['sci'],true,true),
('Earth Stripe Tee','Fine multi-stripe tee with a contrast collar and heart badge.',null,'tees','gpp','Black, brown, rust',array['strp'],true,true),
('Wide Stripe Tee','Bold wide stripes with a small button patch.',null,'tees','gpp','Red, teal',array['bold'],true,true),
('Vests, 3 Colours','Everyday cotton vests.',null,'tees','gpp','Black, white, grey',array['vest'],true,true),
('Script Print Joggers','Thick fleece joggers with a script leg print and elastic cuffs.',null,'joggers','gpp','Black, navy, cream',array['jog1','jog2','jog3'],true,true),
('Sport Logo Joggers','Soft fleece joggers with a pink chest logo.',null,'joggers','gpp','Black',array['jogn'],true,true),
('Zip-Cuff Joggers','Black fleece joggers with zip cuffs and gold script logo.',null,'joggers','gpp','Black',array['jogz'],true,true),
('Varsity Patch Jeans, Black','Washed black wide-leg with varsity letter patches.',300,'jeans','gpp','Black',array['blk','blkflat'],true,false),
('NY Lightning Jeans','Wide leg, NY outline letters and red and white bolts.',300,'jeans','gpp','Mustard wash',array['ny'],true,false),
('Sage Distressed Jeans','Soft sage wash with rips and varsity patches.',300,'jeans','gpp','Sage',array['sage'],true,false),
('Women’s Biker Jacket','Cropped black biker jacket with belt and zips.',null,'jackets','gpp','Black',array['jkt1','jkt2'],true,true),
('Emerald Evening Suit','Shimmer jacket with velvet lapel, trousers and bow tie.',null,'suits','gpp','Emerald with black trousers',array['suit'],true,true),
('Women’s Knit Cardigan','Patterned button cardigan. Pairs with black jeans.',null,'knits','gpp','Cream, red, brown',array['card1','card2'],true,true),
('Air Force 1, White','Clean all-white leather sneaker.',350,'shoes','gpp','White',array['af1w'],true,false),
('Air Force 1, Black & White','Low-cut pairs in triple black and triple white.',350,'shoes','gpp','Black, white',array['af1b'],true,false),
('Brown Timberland Boots','Waterproof nubuck boots. Sold. Ask when the next pair lands.',1500,'shoes','gpp','Wheat',array['tim'],false,false),
('Makeup Set','Palette, contour set, brushes, lashes, lip colours and more.',750,'makeup','gpp',null,array['make'],true,false),
('Arabian Lip Oil','Hydrating, smoothing and moisturizing. 9ml.',50,'makeup','gpp',null,array['lip'],true,false);
insert into public.notices(kind,title,body,badge) values ('announcement','Welcome to GPP Drip Stores','New arrivals just landed. Add to your bag and request a quote on WhatsApp.','NEW');
