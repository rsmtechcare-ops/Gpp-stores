-- Photo bucket: anyone can view, only admins upload
insert into storage.buckets(id, name, public) values ('products', 'products', true) on conflict (id) do nothing;
create policy "public reads photos"  on storage.objects for select using (bucket_id = 'products');
create policy "admin uploads photos" on storage.objects for insert to authenticated with check (bucket_id = 'products' and public.is_admin());
create policy "admin edits photos"   on storage.objects for update to authenticated using (bucket_id = 'products' and public.is_admin());
create policy "admin deletes photos" on storage.objects for delete to authenticated using (bucket_id = 'products' and public.is_admin());
-- Live updates for the store
alter publication supabase_realtime add table public.products, public.notices, public.categories;
