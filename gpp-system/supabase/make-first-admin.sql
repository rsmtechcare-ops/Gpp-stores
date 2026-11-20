-- Run AFTER creating the owner in Authentication > Users > Add user (tick "Auto Confirm User").
-- Replace OWNER@EMAIL.COM (twice) with the owner's email, then Run.
update auth.users set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role":"admin"}'::jsonb
 where lower(email) = lower('OWNER@EMAIL.COM');
insert into public.admins(user_id, display_name) select id, email from auth.users where lower(email) = lower('OWNER@EMAIL.COM')
 on conflict do nothing;
