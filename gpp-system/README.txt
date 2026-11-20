GPP DRIP SYSTEM
===============
Two separate websites that share one Supabase project (database, logins, photos):

  store/   Customer portal. Browse, labels, notices, saved items, accounts, "Request quote on WhatsApp".
  admin/   Owner dashboard. Its own address and login. Products, categories, labels, notices, quotes.
  supabase/  The database: tables, security rules, photo bucket, quote function, starter data.

Supabase holds all data and logins. The two websites are plain files (no build step), so they upload to
Cloudflare Pages exactly as they are. (Supabase itself does not host websites.)

STEP 1: DATABASE (10 minutes)
1. supabase.com > New project (any region near you). Wait for it to finish.
2. SQL Editor > New query > paste ALL of supabase/setup.sql > Run. Run it once on a fresh project.
   (If you ever need to start over, delete the project's tables or make a new project, then run it again.)
3. Project Settings > API: copy the Project URL and the anon / publishable key. NEVER use the service_role key.

STEP 2: CREATE THE OWNER (admin) ACCOUNT
1. Authentication > Users > Add user > Create new user. Type the owner's email and a strong password,
   and tick "Auto Confirm User".
2. SQL Editor: open supabase/make-first-admin.sql, replace OWNER@EMAIL.COM (twice) with that email, Run.
   (This marks the account as admin in two places. Both must match, so customers can never become admins.)
More admins later: admin dashboard > Team > Add another admin (they first create an account on the store).

STEP 3: CONNECT THE TWO SITES
Open store/js/config.js and admin/js/config.js. Paste the URL and anon key into both.
In admin/js/config.js also set storeUrl to your store address after STEP 4 (so starter photos show in admin).

STEP 4: PUT THEM ONLINE (Cloudflare Pages, free)
1. dash.cloudflare.com > Workers & Pages > Create > Pages > Upload assets.
2. Project 1 name e.g. gpp-store: upload the store folder contents. Project 2 e.g. gpp-admin: upload admin folder contents.
   (Upload the files inside the folder so index.html sits at the top.) No build command needed.
3. You get two addresses, e.g. https://gpp-store.pages.dev and https://gpp-admin.pages.dev.
   Keep the admin address private. Optional: protect it with Cloudflare Zero Trust > Access (free for a few users).

STEP 5: TELL SUPABASE THE ADDRESSES
Authentication > URL Configuration: Site URL = the store address. Redirect URLs: add the store address and the admin address.
Authentication > Sign In / Providers: Email must be on. Keep "Confirm email" ON for real customers
(emails use Supabase's free sender, which is rate limited. For many customers set up your own SMTP under Authentication > SMTP).

STEP 6: TEST
- Store: create a customer account, add items, tap Request quote on WhatsApp. It opens WhatsApp to +260 778 799 099 with the list and total.
- Admin: sign in, add a product with photos, mark it sold, add a notice. The store updates live.
- Admin > Team > Turn on two-step login (authenticator app). From then the database also demands the code.

HOW THE TWO LOGINS STAY SEPARATE
- Different websites and addresses, so different sessions.
- Admin needs: a row in the admins table AND role=admin set on the account by the server (customers cannot edit this).
- Once two-step login is on, the database refuses admin actions without the code.
- Even if someone edited the store page in their browser, row-level security stops them writing products or notices.
- Quote prices are calculated inside the database, so a customer cannot change a price.

DAILY USE (admin)
Products: add, edit, delete, photos (shrunk on the phone before upload), mark sold. Categories: build the menu
(for example Clothes > Smart wear > Suits). Labels: partner brands with their own colours and logo page.
Notices: banners such as "50% off this weekend" with start and end times. Quotes: see requests, set status, message the customer.

NOTES
- WhatsApp number is in store/js/products.js (WA and PHONE). Currently +260 778 799 099.
- Starter photos are in store/images. New photos you upload in admin are stored in Supabase Storage.
- Quote requests and restock requests can be made by guests. Add Cloudflare rate limiting if you ever see spam.
