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
