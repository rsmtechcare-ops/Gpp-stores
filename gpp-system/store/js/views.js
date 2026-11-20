/* Extra pages: labels, label theme, account, notices, reveal animations */
const lname=s=>(LABELS.find(l=>l.slug===s)||{}).name||"";
const lb=x=>x.lb&&x.lb!=="gpp"?`<span class="lbl">${lname(x.lb)}</span>`:"";
const isDark=h=>{const n=parseInt((h||"#000000").slice(1),16);return(.299*(n>>16)+.587*(n>>8&255)+.114*(n&255))/255<.5};
const pg=h=>`<div class="wrap page">${h}</div>`;
function lt(l){return `<a class="ltile rv" href="#/label/${l.slug}" style="--lb:${l.bg};--ac:${l.accent};color:${isDark(l.bg)?"#fff":"#2a1706"}"><img src="${img(l.logo)}" alt="" loading="lazy"><b>${l.name}</b><span>${l.tagline||""}</span></a>`}
const labelsView=()=>pg(`<h2>Our labels</h2><p class="mut" style="margin-bottom:18px">Labels in co-operation with GPP Drip Stores. Each one has its own page.</p><div class="lgrid">${LABELS.map(lt).join("")}</div>`);
function labelView(s){const l=LABELS.find(x=>x.slug===s);if(!l)return labelsView();
 return `<section class="lhero"><img src="${img(l.logo)}" alt="${l.name}"><div class="wrap lt"><h1>${l.name}</h1>${l.tagline?`<p class="tg">${l.tagline}</p>`:""}<p class="mut">${l.about||""}</p></div></section>`+list("Pieces",P.filter(x=>x.lb===s),'<div class="crumbs"><a class="chip" href="#/labels">← All labels</a></div>')}
function theme(l){const s=document.documentElement.style,ks=["--bg","--card","--line","--ink","--mut","--amber"];
 if(!l){ks.forEach(k=>s.removeProperty(k));return}
 const d=isDark(l.bg),mix=(p,c)=>`color-mix(in srgb,${l.bg} ${p}%,${c})`;
 s.setProperty("--bg",l.bg);s.setProperty("--amber",l.accent);s.setProperty("--card",mix(d?88:94,d?"#fff":"#000"));s.setProperty("--line",mix(78,d?"#fff":"#000"));
 s.setProperty("--ink",d?"#F6EEE3":"#241810");s.setProperty("--mut",d?"#B9A892":"#6B5848")}
function noticeUI(){const b=$("#notices");if(!NOTICES.length){b.hidden=true;return}
 const show=()=>{const n=NOTICES[ni%NOTICES.length];b.hidden=false;b.innerHTML=`${n.badge?`<b>${n.badge}</b>`:""}${n.title}${n.body?": "+n.body:""}`};
 show();if(!noticeUI.t&&NOTICES.length>1)noticeUI.t=setInterval(()=>{ni++;show()},5000)}
function reveal(){const els=document.querySelectorAll(".rv:not(.in)");
 if(!("IntersectionObserver" in window)){els.forEach(e=>e.classList.add("in"));return}
 const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add("in");io.unobserve(e.target)}}),{rootMargin:"0px 0px -6% 0px"});els.forEach(e=>io.observe(e))}
function accountView(){
 if(!live)return pg(`<h2>My account</h2><p class="mut">Accounts switch on once Supabase is connected (see README).</p>`);
 if(!user)return pg(`<h2>My account</h2><p class="mut" style="margin-bottom:16px">Create an account to keep your bag, saved items and quote history on every phone.</p><button class="btn" data-open="sg">Sign in or create account</button>`);
 return pg(`<h2>My account</h2><p class="mut">${user.email}</p><form id="af" class="card pf"><label>Name<input name="n" value="${user.n||""}" required></label><label>WhatsApp number<input name="ph" inputmode="tel" value="${user.ph||""}"></label><label>Delivery or pickup details<input name="addr" value="${user.addr||""}" placeholder="e.g. Kitwe, Parklands"></label><button class="btn" type="submit">Save details</button></form>
<h3 style="margin:26px 0 10px">My quote requests</h3><div id="myq" class="mut">Loading…</div><button class="btn ghost" data-act="signout" style="margin-top:20px">Sign out</button>`)}
async function loadMyQuotes(){const el=$("#myq");if(!el||!live||!user)return;
 const {data}=await sb.from("quotes").select("ref,total,status,created_at,quote_items(name,qty)").eq("user_id",user.id).order("created_at",{ascending:false}).limit(20);
 if(!$("#myq"))return;
 $("#myq").innerHTML=(data||[]).map(q=>`<div class="li"><div><b>${q.ref}</b> <span class="mut">${new Date(q.created_at).toLocaleDateString()}</span><br>${q.quote_items.map(i=>i.name+" x"+i.qty).join(", ")}<br><b>K${q.total}</b>, ${q.status}</div></div>`).join("")||"No quote requests yet."}
document.addEventListener("click",async e=>{const t=e.target.closest("[data-open],[data-act=signout]");if(!t)return;
 if(t.dataset.open)$("#"+t.dataset.open).showModal();
 if(t.dataset.act==="signout"){if(live)await sb.auth.signOut();toast("Signed out");location.hash="#/"}});
document.addEventListener("submit",async e=>{if(e.target.id!=="af")return;e.preventDefault();const f=new FormData(e.target);
 const {error}=await sb.from("profiles").upsert({id:user.id,full_name:f.get("n").trim(),phone:f.get("ph").trim(),address:f.get("addr").trim(),updated_at:new Date().toISOString()});
 if(error)return toast(error.message);user.n=f.get("n").trim();user.ph=f.get("ph").trim();user.addr=f.get("addr").trim();who();toast("Details saved")});
document.addEventListener("click",e=>{if(e.target.id==="forgot")resetPw($("#em").value.trim())});
