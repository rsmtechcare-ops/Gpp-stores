/* ===== EDIT HERE: business details, menu structure and products =====
   p: price in kwacha (null shows "Ask price")   ok: 1 = in stock, 0 = sold
   im: image names in the /images folder (no .jpg)   nw: 1 = listed under New arrivals */
const WA = "260778799099", PHONE = "+260 778 799 099", BRAND = "GPP Drip Stores";
const TREE = {
  clothes: { t: "Clothes", d: "Street wear and smart wear", e: "👕", im: "ny", k: {
    street: { t: "Street wear", d: "T-shirts, joggers, jeans and jackets", im: "koris2", k: {
      tees: { t: "T-shirts & vests", im: "mtn" }, joggers: { t: "Joggers", im: "jog1" },
      jeans: { t: "Jeans", im: "blk" }, jackets: { t: "Jackets", im: "jkt1" } } },
    smart: { t: "Smart wear", d: "Suits and knitwear", im: "suit", k: {
      suits: { t: "Suits", im: "suit" }, knits: { t: "Cardigans", im: "card1" } } } } },
  shoes: { t: "Shoes", d: "Sneakers and boots", e: "👟", im: "af1b" },
  phones: { t: "Phones & accessories", d: "Phones, chargers, cases, earphones", e: "📱" },
  makeup: { t: "Makeup", d: "Makeup sets and lip care", e: "💄", im: "make" }
};
const P = [
 {id:1,n:"Cowrie Print Tee",pa:["clothes","street","tees"],p:null,im:["koris1","koris2","koris3"],ok:1,nw:1,c:"Red, yellow, black, white, rust",d:"Oversized cotton tee with a cowrie shell print."},
 {id:2,n:"Don’t Look Back Tee",pa:["clothes","street","tees"],p:null,im:["dlb"],ok:1,nw:1,c:"Black, pink, brown, blue, white",d:"Heavy cotton tee with a rear-view mirror print."},
 {id:3,n:"Mountain Heartbeat Tee",pa:["clothes","street","tees"],p:null,im:["mtn"],ok:1,nw:1,c:"Navy, green, blue, red, brown",d:"Soft tee with a white mountain pulse print."},
 {id:4,n:"Scissors Print Tee",pa:["clothes","street","tees"],p:null,im:["sci"],ok:1,nw:1,c:"Rust, blue, black, orange, tan",d:"Bold graphic tee in strong colours."},
 {id:5,n:"Earth Stripe Tee",pa:["clothes","street","tees"],p:null,im:["strp"],ok:1,nw:1,c:"Black, brown, rust",d:"Fine multi-stripe tee with a contrast collar and heart badge."},
 {id:6,n:"Wide Stripe Tee",pa:["clothes","street","tees"],p:null,im:["bold"],ok:1,nw:1,c:"Red, teal",d:"Bold wide stripes with a small button patch."},
 {id:7,n:"Vests, 3 Colours",pa:["clothes","street","tees"],p:null,im:["vest"],ok:1,nw:1,c:"Black, white, grey",d:"Everyday cotton vests."},
 {id:8,n:"Script Print Joggers",pa:["clothes","street","joggers"],p:null,im:["jog1","jog2","jog3"],ok:1,nw:1,c:"Black, navy, cream",d:"Thick fleece joggers with a script leg print and elastic cuffs."},
 {id:9,n:"Sport Logo Joggers",pa:["clothes","street","joggers"],p:null,im:["jogn"],ok:1,nw:1,c:"Black",d:"Soft fleece joggers with a pink chest logo."},
 {id:10,n:"Zip-Cuff Joggers",pa:["clothes","street","joggers"],p:null,im:["jogz"],ok:1,nw:1,c:"Black",d:"Black fleece joggers with zip cuffs and gold script logo."},
 {id:11,n:"Varsity Patch Jeans, Black",pa:["clothes","street","jeans"],p:300,im:["blk","blkflat"],ok:1,c:"Black",d:"Washed black wide-leg with varsity letter patches."},
 {id:12,n:"NY Lightning Jeans",pa:["clothes","street","jeans"],p:300,im:["ny"],ok:1,c:"Mustard wash",d:"Wide leg, NY outline letters and red and white bolts."},
 {id:13,n:"Sage Distressed Jeans",pa:["clothes","street","jeans"],p:300,im:["sage"],ok:1,c:"Sage",d:"Soft sage wash with rips and varsity patches."},
 {id:14,n:"Women’s Biker Jacket",pa:["clothes","street","jackets"],p:null,im:["jkt1","jkt2"],ok:1,nw:1,c:"Black",d:"Cropped black biker jacket with belt and zips."},
 {id:15,n:"Emerald Evening Suit",pa:["clothes","smart","suits"],p:null,im:["suit"],ok:1,nw:1,c:"Emerald with black trousers",d:"Shimmer jacket with velvet lapel, trousers and bow tie."},
 {id:16,n:"Women’s Knit Cardigan",pa:["clothes","smart","knits"],p:null,im:["card1","card2"],ok:1,nw:1,c:"Cream, red, brown",d:"Patterned button cardigan. Pairs with black jeans."},
 {id:17,n:"Air Force 1, White",pa:["shoes"],p:350,im:["af1w"],ok:1,c:"White",d:"Clean all-white leather sneaker."},
 {id:18,n:"Air Force 1, Black & White",pa:["shoes"],p:350,im:["af1b"],ok:1,c:"Black, white",d:"Low-cut pairs in triple black and triple white."},
 {id:19,n:"Brown Timberland Boots",pa:["shoes"],p:1500,im:["tim"],ok:0,c:"Wheat",d:"Waterproof nubuck boots. Sold. Ask when the next pair lands."},
 {id:20,n:"Makeup Set",pa:["makeup"],p:750,im:["make"],ok:1,d:"Palette, contour set, brushes, lashes, lip colours and more."},
 {id:21,n:"Arabian Lip Oil",pa:["makeup"],p:50,im:["lip"],ok:1,d:"Hydrating, smoothing and moisturizing. 9ml."}
];
/* Partner labels (demo-mode copy; the live site reads them from the database) */
const LABELS = [
 {slug:"gpp",name:"GPP Drip Stores",tagline:"Holy drip since 2024",about:"Our own store: street wear, smart wear, shoes and makeup.",logo:"logo",accent:"#F2B84B",bg:"#1B120D",sort:0},
 {slug:"elevated-saints",name:"Elevated Saints",tagline:"Partner label",about:"Elevated Saints pieces, stocked with GPP Drip Stores. New drops are added here as they land.",logo:"es-logo",accent:"#7FA3BF",bg:"#0C0F12",sort:1},
 {slug:"elevated-saints-beauty",name:"Elevated Saints Beauty",tagline:"Beauty",about:"Elevated Saints Beauty, stocked with GPP Drip Stores. New products are added here as they land.",logo:"esb-logo",accent:"#B8893A",bg:"#F6E8DD",sort:2},
 {slug:"2fly-labels",name:"2FLY Labels",tagline:"We are not saying we are the best. Simply better than the rest.",about:"2FLY Labels, in co-operation with GPP Drip Stores. New pieces are added here as they land.",logo:"2fly-logo",accent:"#CFC6E8",bg:"#1E1E22",sort:3}
];
