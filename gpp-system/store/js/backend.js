/* Supabase layer for the customer portal: catalogue, accounts, saved cart, quotes, notices */
const CFG=window.GPP_CONFIG||{},live=!!(CFG.url&&CFG.anonKey&&window.supabase);
const sb=live?supabase.createClient(CFG.url,CFG.anonKey):null;
const NOTICES=[];
if(live){P.length=0;LABELS.length=0;Object.keys(TREE).forEach(k=>delete TREE[k])}
const rowToP=(r,cp)=>({id:r.id,n:r.name,pa:cp(r.category),p:r.price==null?null:Number(r.price),im:r.images&&r.images.length?r.images:["logo"],ok:r.in_stock?1:0,nw:r.is_new?1:0,c:r.colours||"",d:r.description||"",lb:r.label||"gpp"});
function buildTree(rows){const kids=p=>Object.fromEntries(rows.filter(r=>(r.parent||null)===p).sort((a,b)=>a.sort-b.sort).map(r=>{const k=kids(r.slug),n={t:r.name,d:r.descr||"",e:r.emoji||"",im:r.cover||""};if(Object.keys(k).length)n.k=k;return[r.slug,n]}));return kids(null)}
async function loadCatalog(){if(!live)return;
 const [c,l,p,n]=await Promise.all([sb.from("categories").select("*"),sb.from("labels").select("*").order("sort"),sb.from("products").select("*").order("created_at",{ascending:false}),sb.from("notices").select("*").order("created_at",{ascending:false})]);
 if(c.error||p.error){toast("Could not load the shop. Check your connection.");return}
 const by=Object.fromEntries(c.data.map(r=>[r.slug,r])),cp=s=>{const o=[];for(let r=by[s];r;r=by[r.parent])o.unshift(r.slug);return o};
 Object.keys(TREE).forEach(k=>delete TREE[k]);Object.assign(TREE,buildTree(c.data));
 LABELS.splice(0,LABELS.length,...(l.data||[]).map(x=>({...x,logo:x.logo||"logo"})));
 P.splice(0,P.length,...p.data.map(r=>rowToP(r,cp)));
 NOTICES.splice(0,NOTICES.length,...(n.data||[]))}
async function setSession(s){
 if(s){const u=s.user,m=u.user_metadata||{};
  const [pr,ca,w]=await Promise.all([sb.from("profiles").select("*").eq("id",u.id).maybeSingle(),sb.from("saved_carts").select("items").eq("user_id",u.id).maybeSingle(),sb.from("wishlists").select("product_id").eq("user_id",u.id)]);
  const pf=pr.data||{};
  user={id:u.id,email:u.email,n:pf.full_name||m.name||u.email.split("@")[0],ph:pf.phone||m.phone||"",addr:pf.address||""};
  bag=[...bag,...((ca.data&&ca.data.items)||[])];wish=new Set((w.data||[]).map(r=>r.product_id))}
 else{if(user)bag=[];user=null;wish=new Set()}
 nav();who()}
async function initAuth(){if(!live)return;
 const {data}=await sb.auth.getSession();await setSession(data.session);
 sb.auth.onAuthStateChange((e,s)=>{setTimeout(async()=>{
  if(e==="PASSWORD_RECOVERY"){const pw=prompt("Choose a new password (at least 6 characters)");if(pw){const r=await sb.auth.updateUser({password:pw});toast(r.error?r.error.message:"Password updated")}}
  if(e!=="INITIAL_SESSION")setSession(s)},0)})}
async function authSubmit(mode,email,pw,name,phone){
 if(mode==="up"){const {error}=await sb.auth.signUp({email,password:pw,options:{data:{name,phone}}});return error?error.message:""}
 const {error}=await sb.auth.signInWithPassword({email,password:pw});return error?error.message:""}
async function resetPw(email){if(!email)return toast("Type your email first");
 const {error}=await sb.auth.resetPasswordForEmail(email,{redirectTo:location.href.split("#")[0]});toast(error?error.message:"Check your email for the reset link")}
async function toggleWish(id,on){if(!live||!user)return;
 on?await sb.from("wishlists").insert({user_id:user.id,product_id:id}):await sb.from("wishlists").delete().match({user_id:user.id,product_id:id})}
function saveCart(){if(!live||!user)return;clearTimeout(saveCart.t);
 saveCart.t=setTimeout(()=>sb.from("saved_carts").upsert({user_id:user.id,items:bag,updated_at:new Date().toISOString()}).then(()=>{}),600)}
function waQuote(lines,ref){const K=n=>"K"+Number(n).toLocaleString("en-ZM",{maximumFractionDigits:2});let tot=0,ask=0;
 const rows=lines.map((l,i)=>{if(l.price==null){ask++;return `${i+1}. ${l.name} x${l.qty} (price on request)`}tot+=l.price*l.qty;return `${i+1}. ${l.name} x${l.qty} @ ${K(l.price)} = ${K(l.price*l.qty)}`});
 return [hi()+"I’d like a quote for:",...rows,"","Estimated total: "+K(tot)+(ask?` (+ ${ask} item${ask>1?"s":""} on request)`:""),...(user&&user.addr?["Delivery or pickup: "+user.addr]:[]),...(user&&user.ph?["My number: "+user.ph]:[]),"Quote ref: "+ref].join("\n")}
async function sendQuote(){
 if(!bag.length)return;
 const w=window.open("","_blank"),qty={};bag.forEach(i=>qty[i]=(qty[i]||0)+1);
 const items=Object.entries(qty).map(([id,q])=>({id:+id,qty:q}));
 let ref="DEMO",lines=items.map(i=>{const x=P.find(p=>p.id==i.id);return {name:x.n,qty:i.qty,price:x.p}});
 if(live){const {data,error}=await sb.rpc("create_quote",{items,cust_name:user?user.n:null,cust_phone:user?user.ph:null,note:null});
  if(error){if(/available|Empty/.test(error.message)){w&&w.close();return toast("Those items are no longer available")}toast("Could not save the quote, sending it anyway")}
  else{ref=data.ref;lines=data.lines}}
 const url=wa(waQuote(lines,ref));w?w.location.href=url:location.href=url;
 bag=[];bagUI();$("#bg").close();toast("Quote request opened in WhatsApp. Ref "+ref)}
async function notifyMe(id){const ph=(user&&user.ph)||prompt("Your WhatsApp number? We’ll message you when it’s back.");if(!ph)return;
 if(!live)return toast("Saved. We’ll message you when it’s back");
 const {error}=await sb.from("restock_requests").insert({product_id:id,user_id:user?user.id:null,name:user?user.n:null,phone:ph});
 toast(error?"Could not save. Try again":"Done. We’ll message you when it’s back")}
function shareP(id){const x=P.find(v=>v.id==id),url=location.href.split("#")[0]+"#/p/"+id;
 if(navigator.share)navigator.share({title:x.n,text:x.n+" at "+BRAND,url}).catch(()=>{});
 else navigator.clipboard.writeText(url).then(()=>toast("Link copied"),()=>toast(url))}
function subscribeCatalog(){if(!live)return;
 const f=async()=>{await loadCatalog();nav();render()};
 sb.channel("shop").on("postgres_changes",{event:"*",schema:"public",table:"products"},f).on("postgres_changes",{event:"*",schema:"public",table:"notices"},f).subscribe()}
let dip;addEventListener("beforeinstallprompt",e=>{e.preventDefault();dip=e;$("#inst").hidden=false});
function registerSW(){$("#inst").onclick=()=>dip&&dip.prompt();
 if("serviceWorker" in navigator&&location.protocol.startsWith("http"))navigator.serviceWorker.register("sw.js").catch(()=>{})}
