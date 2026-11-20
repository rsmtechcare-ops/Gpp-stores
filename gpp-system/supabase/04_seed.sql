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
