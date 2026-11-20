/* GPP Admin: separate from the store. Admin role + optional two-step login, all enforced again by the database (RLS). */
const CFG=window.GPP_CONFIG||{},$=s=>document.querySelector(s),app=$("#app");
const esc=s=>String(s??"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const toast=m=>{const t=$("#toast");t.textContent=m;t.hidden=false;clearTimeout(toast.k);toast.k=setTimeout(()=>t.hidden=true,2600)};
if(!CFG.url||!CFG.anonKey||!window.supabase){app.innerHTML='<div class="login"><p>Add your Supabase URL and anon key in <b>js/config.js</b> (see README.txt).</p></div>';throw new Error("not configured")}
const sb=supabase.createClient(CFG.url,CFG.anonKey);
let me=null,tab=(location.hash||"#overview").slice(1),editing=null,adding=false,C={cats:[],labels:[]};
const src=u=>/^https?:/.test(u)?u:(CFG.storeUrl||"").replace(/\/$/,"")+"/images/"+u+".jpg";
const slug=s=>String(s||"").toLowerCase().trim().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
const toLocal=v=>{const d=new Date(v);return new Date(d-d.getTimezoneOffset()*6e4).toISOString().slice(0,16)};
const KIND=[["announcement","Announcement"],["promotion","Promotion"],["discount","Discount"]];
/* ---------- resources: one config drives list + add + edit + delete ---------- */
const R={
 products:{title:"Products",pk:"id",order:["created_at",false],label:r=>r.name,sub:r=>`${r.price==null?"Ask price":"K"+r.price}, ${esc(catName(r.category))}, ${esc(r.label)}`,thumb:r=>(r.images||[])[0],pill:r=>r.in_stock?["In stock","ok"]:["Sold","no"],
  fields:[["name","Name","text",1],["category","Category","cat"],["label","Label (brand)","label"],["price","Price in K (empty shows Ask price)","number"],["colours","Colours or sizes","text"],["description","Description","area"],["images","Photos (pick several)","images"],["in_stock","In stock","check",0,true],["is_new","Show under New arrivals","check",0,false]],
  acts:[["Mark sold / back in stock",r=>({in_stock:!r.in_stock})]]},
 categories:{title:"Categories",pk:"slug",order:["sort",true],label:r=>r.name,sub:r=>"Inside: "+(r.parent?catName(r.parent):"top level"),thumb:r=>r.cover,
  fields:[["name","Name","text",1],["slug","Short id (letters only, e.g. street)","slug"],["parent","Inside","parent"],["emoji","Emoji icon","text"],["cover","Cover photo","image"],["descr","Short description","text"],["sort","Order number","number",0,0]]},
 labels:{title:"Labels",pk:"slug",order:["sort",true],label:r=>r.name,sub:r=>r.tagline||"",thumb:r=>r.logo,
  fields:[["name","Label name","text",1],["slug","Short id (letters only)","slug"],["tagline","Tagline","text"],["about","About this label","area"],["logo","Logo or banner picture","image"],["accent","Accent colour","color",0,"#F2B84B"],["bg","Background colour","color",0,"#1B120D"],["sort","Order number","number",0,0]]},
 notices:{title:"Notices",pk:"id",order:["created_at",false],label:r=>r.title,sub:r=>`${r.kind}${r.badge?", "+r.badge:""}`,pill:r=>r.is_active?["Showing","ok"]:["Hidden","no"],
  fields:[["title","Title (e.g. 50% off this weekend)","text",1],["kind","Type","kind"],["badge","Badge (e.g. 50% OFF)","text"],["body","More details","area"],["starts_at","Starts","dt"],["ends_at","Ends (empty = no end)","dt"],["is_active","Show on the store","check",0,true]],
  acts:[["Show / hide",r=>({is_active:!r.is_active})]]}
};
const catName=s=>(C.cats.find(c=>c.slug===s)||{}).name||s;
const catPath=s=>{const o=[];for(let c=C.cats.find(x=>x.slug===s);c;c=C.cats.find(x=>x.slug===c.parent))o.unshift(c.name);return o.join(" › ")};
const opts=t=>t==="cat"?C.cats.filter(c=>!C.cats.some(k=>k.parent===c.slug)).map(c=>[c.slug,catPath(c.slug)]):t==="parent"?C.cats.map(c=>[c.slug,catPath(c.slug)]):t==="label"?C.labels.map(l=>[l.slug,l.name]):KIND;
function inp(f,v){const [n,l,t,req]=f,val=v??"";
 if(t==="area")return `<label>${l}<textarea name="${n}" rows="3">${esc(val)}</textarea></label>`;
 if(t==="check")return `<label class="ck"><input type="checkbox" name="${n}" ${v?"checked":""}> ${l}</label>`;
 if(["cat","label","parent","kind"].includes(t))return `<label>${l}<select name="${n}">${t==="parent"?'<option value="">(top level)</option>':""}${opts(t).map(([a,b])=>`<option value="${esc(a)}" ${a===val?"selected":""}>${esc(b)}</option>`).join("")}</select></label>`;
 if(t==="image"||t==="images"){const cur=[].concat(v||[]).filter(Boolean);return `<label>${l}${cur.length?`<div class="th">${cur.map(u=>`<img src="${esc(src(u))}" alt="">`).join("")}</div>`:""}<input type="file" name="${n}" accept="image/*" ${t==="images"?"multiple":""}></label>${t==="images"&&cur.length?`<label class="ck"><input type="checkbox" name="${n}_replace"> Replace the existing photos</label>`:""}`}
 if(t==="dt")return `<label>${l}<input type="datetime-local" name="${n}" value="${val?toLocal(val):""}"></label>`;
 if(t==="slug")return editing?"":`<label>${l}<input name="${n}" placeholder="auto from the name" pattern="[a-z0-9-]*"></label>`;
 return `<label>${l}<input name="${n}" type="${t==="number"?"number":t==="color"?"color":"text"}" ${t==="number"?'step="any" min="0"':""} ${req?"required":""} value="${esc(val)}"></label>`}
const shrink=f=>new Promise((res,rej)=>{const im=new Image(),u=URL.createObjectURL(f);im.onload=()=>{const s=Math.min(1,1200/Math.max(im.width,im.height)),c=document.createElement("canvas");c.width=im.width*s;c.height=im.height*s;c.getContext("2d").drawImage(im,0,0,c.width,c.height);URL.revokeObjectURL(u);c.toBlob(b=>b?res(b):rej(new Error("Image error")),"image/jpeg",.82)};im.onerror=()=>rej(new Error("Could not read that image"));im.src=u});
async function up(file){const path=`${Date.now()}-${Math.random().toString(36).slice(2,8)}.jpg`,{error}=await sb.storage.from("products").upload(path,await shrink(file),{contentType:"image/jpeg"});if(error)throw error;return sb.storage.from("products").getPublicUrl(path).data.publicUrl}
async function loadRef(){const [c,l]=await Promise.all([sb.from("categories").select("*").order("sort"),sb.from("labels").select("*").order("sort")]);C.cats=c.data||[];C.labels=l.data||[]}
/* ---------- screens ---------- */
function login(msg){app.innerHTML=`<div class="login"><form id="lf"><h1>GPP Admin</h1><p class="mut">Owner and staff only.</p><input type="email" id="e" placeholder="Email" autocomplete="username" required><input type="password" id="p" placeholder="Password" autocomplete="current-password" required><button class="btn">Sign in</button>${msg?`<p style="color:var(--red)">${msg}</p>`:""}</form></div>`;
 $("#lf").onsubmit=async e=>{e.preventDefault();const {error}=await sb.auth.signInWithPassword({email:$("#e").value.trim(),password:$("#p").value});if(error)return login("Invalid login.");boot()}}
async function mfaStep(){const f=((await sb.auth.mfa.listFactors()).data.totp||[]).find(x=>x.status==="verified");
 app.innerHTML=`<div class="login"><form id="mf"><h1>Two-step login</h1><p class="mut">Enter the 6-digit code from your authenticator app.</p><input id="c" inputmode="numeric" maxlength="6" autocomplete="one-time-code" required><button class="btn">Verify</button><button type="button" class="btn ghost" id="so">Cancel</button></form></div>`;
 $("#so").onclick=async()=>{await sb.auth.signOut();login()};
 $("#mf").onsubmit=async e=>{e.preventDefault();const ch=await sb.auth.mfa.challenge({factorId:f.id}),v=await sb.auth.mfa.verify({factorId:f.id,challengeId:ch.data.id,code:$("#c").value.trim()});if(v.error)return toast("Wrong code");boot()}}
async function boot(){const {data:{session}}=await sb.auth.getSession();if(!session)return login();
 const a=(await sb.auth.mfa.getAuthenticatorAssuranceLevel()).data;
 if(a&&a.nextLevel==="aal2"&&a.currentLevel!=="aal2")return mfaStep();
 const ok=(await sb.rpc("is_admin")).data;if(!ok){await sb.auth.signOut();return login("Invalid login.")}
 me=session.user;await loadRef();shell()}
function shell(){const T=[["overview","Overview"],["products","Products"],["categories","Categories"],["labels","Labels"],["notices","Notices"],["quotes","Quotes"],["requests","Restock asks"],["team","Team"]];
 app.innerHTML=`<header class="top"><div class="r"><h2>GPP Admin</h2><span class="mut">${esc(me.email)}</span><button class="btn ghost" id="so">Sign out</button></div><nav class="tabs">${T.map(([k,n])=>`<a href="#${k}" class="${tab===k?"on":""}">${n}</a>`).join("")}</nav></header><main id="pane">Loading…</main>`;
 $("#so").onclick=async()=>{await sb.auth.signOut();location.reload()};pane()}
addEventListener("hashchange",()=>{tab=(location.hash||"#overview").slice(1);editing=null;adding=false;if(me)shell()});
async function pane(){const p=$("#pane");
 try{if(R[tab])return await listPane(p);
  if(tab==="quotes")return await quotesPane(p);if(tab==="requests")return await reqPane(p);if(tab==="team")return await teamPane(p);return await overview(p)}
 catch(e){p.innerHTML=`<p style="color:var(--red)">${esc(e.message||e)}</p>`}}
async function overview(p){const n=async(t,f)=>{let q=sb.from(t).select("*",{count:"exact",head:true});if(f)q=f(q);return (await q).count||0};
 const [a,b,c,d,e]=await Promise.all([n("products"),n("products",q=>q.eq("in_stock",true)),n("notices",q=>q.eq("is_active",true)),n("quotes",q=>q.eq("status","new")),n("restock_requests")]);
 p.innerHTML=`<div class="stats"><div><b>${a}</b>Products</div><div><b>${b}</b>In stock</div><div><b>${a-b}</b>Sold</div><div><b>${c}</b>Active notices</div><div><b>${d}</b>New quotes</div><div><b>${e}</b>Restock asks</div></div><p class="mut" style="margin-top:18px">Use the tabs above to add products, categories, labels and notices. Changes appear on the store straight away.</p>`}
async function listPane(p){const r=R[tab];await loadRef();
 const {data,error}=await sb.from(tab).select("*").order(r.order[0],{ascending:r.order[1]});if(error)throw error;
 const form=(adding||editing)?`<form class="f" id="ef"><h3>${editing?"Edit":"Add"} ${r.title.toLowerCase().replace(/s$/,"")}</h3>${r.fields.map(f=>inp(f,editing?editing[f[0]]:f[4])).join("")}<div style="display:flex;gap:10px"><button class="btn" type="submit">Save</button><button type="button" class="btn ghost" data-a="cancel">Cancel</button></div></form>`:"";
 p.innerHTML=`<div class="bar"><h3>${r.title} (${data.length})</h3>${adding||editing?"":`<button class="btn" data-a="add">Add new</button>`}</div>${form}${data.map(x=>{const t=r.thumb&&r.thumb(x),pl=r.pill&&r.pill(x);return `<div class="row">${t?`<img src="${esc(src(t))}" alt="">`:""}<div><b>${esc(r.label(x))}</b> ${pl?`<span class="pill ${pl[1]}">${pl[0]}</span>`:""}<br><span class="mut">${r.sub(x)}</span></div><div class="a">${(r.acts||[]).map((a,i)=>`<button data-a="act" data-i="${i}" data-id="${esc(x[r.pk])}">${a[0]}</button>`).join("")}<button data-a="edit" data-id="${esc(x[r.pk])}">Edit</button><button class="d" data-a="del" data-id="${esc(x[r.pk])}">Delete</button></div></div>`}).join("")||'<p class="mut">Nothing here yet.</p>'}`;
 p._rows=data}
async function quotesPane(p){const {data,error}=await sb.from("quotes").select("*,quote_items(*)").order("created_at",{ascending:false}).limit(50);if(error)throw error;
 p.innerHTML=`<h3 style="margin-bottom:14px">Quote requests (${data.length})</h3>`+(data.map(q=>`<div class="row"><div><b>${esc(q.ref)}</b> <span class="mut">${new Date(q.created_at).toLocaleString()}</span><br>${esc(q.customer_name||"Guest")}${q.customer_phone?` <a target="_blank" rel="noopener" href="https://wa.me/${String(q.customer_phone).replace(/\D/g,"")}?text=${encodeURIComponent("Hi, about your GPP Drip Stores quote "+q.ref+".")}">${esc(q.customer_phone)}</a>`:""}<br>${q.quote_items.map(i=>esc(i.name)+" x"+i.qty).join(", ")}<br><b>K${q.total}</b></div><select data-a="qs" data-id="${q.id}" style="width:auto">${["new","contacted","accepted","completed","cancelled"].map(s=>`<option ${q.status===s?"selected":""}>${s}</option>`).join("")}</select></div>`).join("")||'<p class="mut">No quote requests yet.</p>')}
async function reqPane(p){const {data,error}=await sb.from("restock_requests").select("*,products(name)").order("created_at",{ascending:false});if(error)throw error;
 p.innerHTML=`<h3 style="margin-bottom:14px">Restock asks (${data.length})</h3>`+(data.map(r=>`<div class="row"><div><b>${esc(r.products?r.products.name:"(deleted)")}</b><br>${esc(r.name||"Guest")} <a target="_blank" rel="noopener" href="https://wa.me/${String(r.phone||"").replace(/\D/g,"")}?text=${encodeURIComponent("Good news, the "+(r.products?r.products.name:"item")+" is back in stock at GPP Drip Stores.")}">Tell them on WhatsApp</a></div><div class="a"><button data-a="rq" data-id="${r.id}">Done</button></div></div>`).join("")||'<p class="mut">No requests yet.</p>')}
async function teamPane(p){const [ad,fa]=await Promise.all([sb.from("admins").select("*"),sb.auth.mfa.listFactors()]);const f=((fa.data||{}).totp||[]).filter(x=>x.status==="verified");
 p.innerHTML=`<h3 style="margin-bottom:12px">Admins</h3>${(ad.data||[]).map(a=>`<div class="row"><div>${esc(a.display_name||a.user_id)}</div>${a.user_id===me.id?'<span class="pill">you</span>':`<div class="a"><button class="d" data-a="rmadmin" data-id="${esc(a.display_name)}">Remove</button></div>`}</div>`).join("")}
 <form class="f" id="af"><h3>Add another admin</h3><p class="mut">They must already have an account on the store. Type the email they used.</p><input type="email" name="e" placeholder="their@email.com" required><button class="btn">Make admin</button></form>
 <h3 style="margin:22px 0 10px">Two-step login</h3>${f.length?`<p>Two-step login is <b>on</b> for this account.</p><button class="btn ghost" data-a="unenroll" data-id="${f[0].id}">Turn off</button>`:`<p class="mut">Adds a 6-digit code from an authenticator app to your login. Strongly recommended.</p><button class="btn" data-a="enroll">Turn on two-step login</button><div id="enr"></div>`}`}
/* ---------- actions ---------- */
document.addEventListener("click",async e=>{const b=e.target.closest("[data-a]");if(!b||b.tagName==="SELECT")return;const a=b.dataset.a,id=b.dataset.id,r=R[tab],rows=$("#pane")&&$("#pane")._rows;
 try{
 if(a==="add"){adding=true;editing=null;pane()}
 if(a==="cancel"){adding=false;editing=null;pane()}
 if(a==="edit"){editing=rows.find(x=>String(x[r.pk])===id);adding=false;await pane();scrollTo(0,0)}
 if(a==="act"){const x=rows.find(v=>String(v[r.pk])===id),{error}=await sb.from(tab).update(r.acts[+b.dataset.i][1](x)).eq(r.pk,x[r.pk]);if(error)throw error;toast("Updated");pane()}
 if(a==="del"&&confirm("Delete this for good?")){const {error}=await sb.from(tab).delete().eq(r.pk,id);if(error)throw new Error(/foreign key/i.test(error.message)?"It is still used by products or sub-categories. Move or delete those first.":error.message);toast("Deleted");pane()}
 if(a==="rq"){await sb.from("restock_requests").delete().eq("id",id);pane()}
 if(a==="rmadmin"){const {data,error}=await sb.rpc("remove_admin",{admin_email:id});toast(error?error.message:data);pane()}
 if(a==="unenroll"){const {error}=await sb.auth.mfa.unenroll({factorId:id});toast(error?error.message:"Turned off");pane()}
 if(a==="enroll"){const {data,error}=await sb.auth.mfa.enroll({factorType:"totp",friendlyName:"Phone "+Date.now()});if(error)throw error;
  $("#enr").innerHTML=`<p class="mut">Scan with Google Authenticator or similar, then type the code.</p><img class="qr" src="${data.totp.qr_code}" alt="QR code"><p class="mut">Or type this key: <b>${esc(data.totp.secret)}</b></p><form id="vf" data-f="${data.id}" class="f"><input name="c" inputmode="numeric" maxlength="6" placeholder="6-digit code" required><button class="btn">Turn on</button></form>`}
 }catch(err){toast(err.message||"Something went wrong")}});
document.addEventListener("change",async e=>{if(e.target.dataset.a==="qs"){const {error}=await sb.from("quotes").update({status:e.target.value}).eq("id",+e.target.dataset.id);toast(error?error.message:"Status updated")}});
document.addEventListener("submit",async e=>{const f=e.target;
 if(f.id==="ef"){e.preventDefault();const r=R[tab],fd=new FormData(f),row={},btn=f.querySelector("[type=submit]");btn.disabled=true;btn.textContent="Saving…";
  try{for(const [n,,t] of r.fields){
    if(t==="check")row[n]=fd.has(n);
    else if(t==="number")row[n]=fd.get(n)===""?null:+fd.get(n);
    else if(t==="image"){const x=fd.get(n);row[n]=x&&x.size?await up(x):(editing&&editing[n])||null}
    else if(t==="images"){const xs=fd.getAll(n).filter(x=>x.size),u=[];for(const x of xs)u.push(await up(x));row[n]=[...(editing&&!fd.has(n+"_replace")?editing[n]||[]:[]),...u]}
    else if(t==="dt")row[n]=fd.get(n)?new Date(fd.get(n)).toISOString():null;
    else if(t==="slug")row[n]=editing?editing[n]:(slug(fd.get(n))||slug(fd.get("name")));
    else if(t==="parent")row[n]=fd.get(n)||null;
    else row[n]=(fd.get(n)||"").toString().trim()}
   if("starts_at" in row&&!row.starts_at)row.starts_at=new Date().toISOString();
   const {error}=editing?await sb.from(tab).update(row).eq(r.pk,editing[r.pk]):await sb.from(tab).insert(row);
   if(error)throw error;toast("Saved");adding=false;editing=null;pane()}
  catch(err){toast(err.message||"Could not save");btn.disabled=false;btn.textContent="Try again"}}
 if(f.id==="af"){e.preventDefault();const {data,error}=await sb.rpc("make_admin",{admin_email:new FormData(f).get("e")});toast(error?error.message:data);pane()}
 if(f.id==="vf"){e.preventDefault();const id=f.dataset.f,ch=await sb.auth.mfa.challenge({factorId:id}),v=await sb.auth.mfa.verify({factorId:id,challengeId:ch.data.id,code:new FormData(f).get("c").trim()});toast(v.error?"Wrong code":"Two-step login is on");pane()}});
boot();
