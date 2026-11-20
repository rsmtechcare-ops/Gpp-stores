const $=s=>document.querySelector(s),img=k=>/^https?:/.test(k)?k:`images/${k}.jpg`;
let term="",onlyIn=false,bag=[],wish=new Set(),user=null,sortBy="new",mode="in",ni=0;
const srt=L=>{const a=[...L];if(sortBy==="lo")a.sort((x,y)=>(x.p??1e9)-(y.p??1e9));if(sortBy==="hi")a.sort((x,y)=>(y.p??-1)-(x.p??-1));return a};
const wa=t=>`https://wa.me/${WA}${t?"?text="+encodeURIComponent(t):""}`;
const hi=()=>`Hi ${BRAND}${user?", I’m "+user.n:""}. `;
const money=p=>p==null?"Ask price":"K"+p;
const toast=m=>{const t=$("#toast");t.textContent=m;t.hidden=false;clearTimeout(toast.k);toast.k=setTimeout(()=>t.hidden=true,2200)};
const under=k=>P.filter(x=>x.pa.join("/").startsWith(k));
const stock=L=>L.filter(x=>x.ok).length;
const node=r=>{let n={k:TREE};for(const s of r){n=n.k&&n.k[s];if(!n)return null}return n};
const cntTxt=(L)=>L.length?stock(L)+" in stock":"Coming soon";
function card(x){return `<article class="card rv ${x.ok?"":"sold"}"><a class="ph" href="#" data-qv="${x.id}" aria-label="View ${x.n}"><img src="${img(x.im[0])}" alt="${x.n}" loading="lazy"><span class="price ${x.p==null?"ask":""}">${money(x.p)}</span>${x.ok?"":'<span class="stamp"><span>SOLD</span></span>'}</a>
<button class="heart" data-w="${x.id}" aria-label="Save ${x.n}">${wish.has(x.id)?"♥":"♡"}</button>
<div class="info">${lb(x)}<h3>${x.n}</h3><p>${x.c||x.d}</p><div class="st ${x.ok?"in":"out"}"><i></i>${x.ok?"In stock":"Sold"}</div>
${x.ok?`<button class="btn" data-add="${x.id}">Add to bag</button>`:`<a class="btn ghost" target="_blank" rel="noopener" href="${wa(hi()+"The "+x.n+" is sold. Can you tell me when you restock?")}">Ask for similar</a>`}</div></article>`}
function tile(r,k,v,big){const p=[...r,k],L=under(p.join("/"));
 return `<a class="tile rv ${big?"big":""} ${v.im?"has":""}" href="#/${p.join("/")}">${v.im?`<img src="${img(v.im)}" alt="" loading="lazy">`:`<span class="em">${v.e||""}</span>`}<h3>${v.t}</h3>${v.d?`<span>${v.d}</span>`:""}<span class="go">${v.k?"Choose a style":cntTxt(L)}</span></a>`}
const emptyBox=(w)=>`<div class="empty"><p>Nothing listed in ${w} yet. Tell us what you need and we’ll reply on WhatsApp.</p><a class="btn wa" target="_blank" rel="noopener" href="${wa(hi()+"Do you have anything in "+w+"?")}">Ask on WhatsApp</a></div>`;
function list(title,L,crumb){const F=srt(L.filter(x=>!onlyIn||x.ok));
 return `<div class="wrap page">${crumb||""}<div class="bar"><h2>${title}</h2><div class="row2"><select id="sort" aria-label="Sort"><option value="new" ${sortBy=="new"?"selected":""}>Newest</option><option value="lo" ${sortBy=="lo"?"selected":""}>Price, low to high</option><option value="hi" ${sortBy=="hi"?"selected":""}>Price, high to low</option></select><button class="chip" data-act="stock" aria-pressed="${onlyIn}">In stock only</button></div></div><div class="grid">${F.length?F.map(card).join(""):emptyBox(title)}</div></div>`}
function contact(){return `<div class="wrap page"><div class="contact"><div><h2>Talk to GPP Drip Stores</h2><p class="mut" style="margin-bottom:18px">Ask about sizes, colours, prices or the next restock. We reply on WhatsApp.</p><div class="row2"><a class="btn wa" target="_blank" rel="noopener" href="${wa(hi()+"I’d like to ask about your items.")}">Message on WhatsApp</a><a class="btn ghost" href="tel:+${WA}">Call us</a></div></div><div><div class="num">${PHONE}</div><button class="btn ghost" data-act="copy">Copy number</button></div></div></div>`}
function home(){const n=stock(P);
 return `<section class="hero"><img src="images/logo.jpg" alt="GPP drip stores, holy drip since 2024"></section>
<div class="wrap"><div class="cta"><a class="btn" href="#/clothes">Shop clothes</a><a class="btn wa" target="_blank" rel="noopener" href="${wa(hi()+"I’d like to ask about your items.")}">Order on WhatsApp</a><div class="live"><span class="dot"></span>${n} items in stock, ${P.length-n} just sold</div></div></div>
<div class="strip" aria-hidden="true"><div>${Array(6).fill(LABELS.map(l=>l.name.toUpperCase()).join(" ✦ ")+" ✦ ").join("")}</div></div>
<section class="sec"><div class="wrap"><div class="bar"><h2>Our labels</h2><a class="chip" href="#/labels">All labels</a></div><div class="hs lbs">${LABELS.map(lt).join("")}</div></div></section>
<section class="sec"><div class="wrap"><h2>Shop by section</h2><div class="tiles">${Object.entries(TREE).map(([k,v])=>tile([],k,v,1)).join("")}</div></div></section>
<section class="sec"><div class="wrap"><div class="bar"><h2>New arrivals</h2><a class="chip" href="#/new">See all</a></div><div class="hs">${P.filter(x=>x.nw).map(card).join("")}</div></div></section>
<section class="sec"><div class="wrap"><h2>How to order</h2><div class="steps"><div><h3>Pick your items</h3><p>Open the menu, choose a section and tap Add to bag on anything In stock.</p></div><div><h3>Send the order</h3><p>Open your bag and tap Send order on WhatsApp. Your list fills in for you.</p></div><div><h3>Confirm with us</h3><p>We reply to confirm price, size and pickup.</p></div></div></div></section>
<section class="sec"><div class="wrap">${contact().replace('<div class="wrap page">','<div>')}</div></section>`}
function render(){
 const r=location.hash.replace(/^#\/?/,"").split("/").filter(Boolean),h=r[0]||"";let html;theme(h==="label"?LABELS.find(l=>l.slug===r[1]):null);
 if(term){const L=P.filter(x=>x.n.toLowerCase().includes(term)||(x.c||"").toLowerCase().includes(term));html=list("Search results",L)}
 else if(!h)html=home();
 else if(h==="new")html=list("New arrivals",P.filter(x=>x.nw));
 else if(h==="saved")html=list("Saved items",P.filter(x=>wish.has(x.id)));else if(h==="labels")html=labelsView();else if(h==="label")html=labelView(r[1]);else if(h==="account")html=accountView();else if(h==="p"){html=home();setTimeout(()=>qv(r[1]),0)}else if(h==="contact")html=contact();
 else{const n=node(r);
  if(!n)html=home();
  else{const names=[],cr=['<a href="#/">Home</a>'];let c={k:TREE};
   r.forEach((s,i)=>{c=c.k[s];names.push(c.t);cr.push(i<r.length-1?`<a href="#/${r.slice(0,i+1).join("/")}">${c.t}</a>`:`<b>${c.t}</b>`)});
   const crumb=`<div class="crumbs"><a class="chip" href="#/${r.slice(0,-1).join("/")}">← Back</a> ${cr.join(" › ")}</div>`;
   html=n.k?`<div class="wrap page">${crumb}<h2>${n.t}</h2><div class="tiles">${Object.entries(n.k).map(([k,v])=>tile(r,k,v)).join("")}</div></div>`:list(n.t,under(r.join("/")),crumb);}}
 $("#main").innerHTML=html;noticeUI();reveal();document.querySelectorAll(".bt a").forEach(x=>x.classList.toggle("on",x.getAttribute("href")==="#/"+r.join("/")||(!!h&&x.getAttribute("href")==="#/"+h)));if(h==="account")loadMyQuotes();
 const cur=r.join("/");document.querySelectorAll(".tab").forEach(a=>a.classList.toggle("on",a.getAttribute("href")==="#/"+cur||(cur===""&&a.getAttribute("href")==="#/")));
 document.title=(r.length&&node(r)?node(r).t+" | ":"")+BRAND;
}
function nav(){const t=[["","Home","🏠"],["new","New arrivals","✨"],["labels","Labels","🏷️"],["saved","Saved items","♥"],["account","My account","👤"]];
 let h=t.map(([p,n,e])=>`<li><a class="tab" href="#/${p}"><i>${e}</i>${n}${p==="new"?`<em>${P.filter(x=>x.nw).length}</em>`:""}</a></li>`).join("");
 for(const [k,v] of Object.entries(TREE)){h+=`<li><a class="tab" href="#/${k}"><i>${v.e}</i>${v.t}<em>${under(k).length}</em></a></li>`;
  if(v.k)for(const [k2,v2] of Object.entries(v.k))h+=`<li><a class="tab sub" href="#/${k}/${k2}">${v2.t}</a></li>`}
 h+=`<li><a class="tab" href="#/contact"><i>☎️</i>Contact</a></li>`;$("#tabs").innerHTML=h}
function menu(o){document.body.classList.toggle("m",o);$("#nav").inert=!o;$("#menu").setAttribute("aria-expanded",o);if(o)$("#nav .tab.on,#nav .tab").focus()}
function bagUI(){const it=bag.map(id=>P.find(x=>x.id==id)),tot=it.reduce((s,x)=>s+(x.p||0),0),ask=it.some(x=>x.p==null);
 $("#bn").textContent=bag.length||"";
 $("#bl").innerHTML=it.length?it.map((x,i)=>`<div class="li"><img src="${img(x.im[0])}" alt=""><div><b>${x.n}</b><br>${money(x.p)}</div><button data-rm="${i}">Remove</button></div>`).join(""):'<p class="empty">Your bag is empty. Add something from the menu sections.</p>';
 $("#bt").textContent="K"+tot;$("#bnote").textContent=ask?"Items marked Ask price are not in the total. We’ll confirm their price on WhatsApp.":"";
 $("#send").disabled=!it.length;saveCart();
}
function qv(id){const x=P.find(v=>v.id==id);
 const show=k=>{$("#qimg").src=img(k);$("#qimg").alt=x.n;[...$("#qth").children].forEach(i=>i.classList.toggle("on",i.dataset.k==k))};
 $("#qth").innerHTML=x.im.length>1?x.im.map(k=>`<img src="${img(k)}" data-k="${k}" alt="Photo of ${x.n}">`).join(""):"";
 $("#qth").onclick=e=>e.target.dataset.k&&show(e.target.dataset.k);show(x.im[0]);
 $("#qn").textContent=x.n+" · "+money(x.p);$("#qd").textContent=x.d;$("#qc").textContent=x.c?"Colours: "+x.c:"";
 $("#qs").className="st "+(x.ok?"in":"out");$("#qs").innerHTML="<i></i>"+(x.ok?"In stock":"Sold");
 $("#qa").innerHTML=x.ok?`<button class="btn" data-add="${x.id}">Add to bag</button><a class="btn wa" target="_blank" rel="noopener" href="${wa(hi()+"I’d like the "+x.n+(x.p==null?". What is the price?":" ("+money(x.p)+")."))}">Order now</a>`:`<a class="btn ghost" target="_blank" rel="noopener" href="${wa(hi()+"The "+x.n+" is sold. Can you find me another?")}">Ask for similar</a>`;
 $("#qa").insertAdjacentHTML("beforeend",`${x.ok?"":`<button class="btn" data-notify="${x.id}">Notify me</button>`}<button class="btn ghost" data-share="${x.id}">Share</button>`);
 $("#qv").showModal()}
function who(){sgUI();$("#ubtn").setAttribute("aria-label",user?"Signed in as "+user.n:"Sign in");
 ["#fab","#navwa"].forEach(s=>$(s).href=wa(hi()+"I’d like to ask about your items."));bagUI();render()}
document.addEventListener("click",e=>{const t=e.target.closest("[data-qv],[data-add],[data-rm],[data-w],[data-act],[data-close],[data-notify],[data-share],.tab,.tile,.brand");if(!t)return;
 const d=t.dataset;
 if(d.qv){e.preventDefault();qv(d.qv)}
 if(d.add){bag.push(+d.add);bagUI();toast("Added to your bag");$("#qv").close()}
 if(d.rm){bag.splice(+d.rm,1);bagUI()}
 if(d.w){const id=+d.w;wish.has(id)?wish.delete(id):wish.add(id);t.textContent=wish.has(id)?"♥":"♡";toggleWish(id,wish.has(id))}
 if(d.act==="stock"){onlyIn=!onlyIn;render()}
 if(d.act==="copy"){navigator.clipboard.writeText(PHONE).then(()=>toast("Number copied"),()=>toast(PHONE))}
 if(d.close!==undefined)t.closest("dialog").close();
 if(d.notify)notifyMe(+d.notify);
 if(d.share)shareP(+d.share);
 if(t.matches(".tab,.brand"))menu(false)});
document.addEventListener("change",e=>{if(e.target.id==="sort"){sortBy=e.target.value;render()}});
$("#menu").onclick=()=>menu(true);$("#mx").onclick=()=>menu(false);$("#scrim").onclick=()=>menu(false);
addEventListener("keydown",e=>{if(e.key==="Escape"&&document.body.classList.contains("m"))menu(false)});
$("#sbtn").onclick=()=>{document.body.classList.toggle("s");if(document.body.classList.contains("s"))$("#q").focus()};
$("#q").oninput=e=>{term=e.target.value.trim().toLowerCase();render()};
$("#bbtn").onclick=()=>$("#bg").showModal();$("#ubtn").onclick=()=>$("#sg").showModal();
function sgUI(){const up=mode==="up",sh=(s,b)=>$(s).hidden=!b;
 $("#sgt").textContent=user?"Signed in as "+user.n:up&&live?"Create account":"Sign in";
 sh("#fn",!user&&(!live||up));sh("#fe",!user&&live);sh("#fp",!user&&live);sh("#fh",!user&&(!live||up));sh("#go",!user);
 $("#go").textContent=up&&live?"Create account":"Sign in";sh("#mode",!user&&live);$("#mode").textContent=up?"I already have an account":"New here? Create an account";
 sh("#demo",!user&&!live);sh("#forgot",!user&&live&&!up);sh("#out",!!user);
 $("#sgp").textContent=live?"Sign in to save items and send orders with your name.":"Demo sign-in: no password needed. Your name is added to your WhatsApp order."}
$("#sgf").onsubmit=async e=>{e.preventDefault();
 if(!live){const n=$("#nm").value.trim();if(!n)return toast("Enter your name to sign in");user={n,ph:$("#ph").value.trim()};who();$("#sg").close();return toast("Signed in as "+n)}
 const err=await authSubmit(mode,$("#em").value.trim(),$("#pw").value,$("#nm").value.trim(),$("#ph").value.trim());
 if(err)return toast(err);
 if(mode==="up"){mode="in";sgUI();toast("Account created. Check your email to confirm, then sign in")}else{$("#sg").close();toast("Signed in")}};
$("#mode").onclick=()=>{mode=mode==="in"?"up":"in";sgUI()};
$("#demo").onclick=()=>{user={n:"Manuel",ph:""};who();$("#sg").close();toast("Signed in as Manuel (demo)")};
$("#out").onclick=async()=>{if(live)await sb.auth.signOut();else{user=null;who()}$("#sg").close();toast("Signed out")};
$("#send").onclick=sendQuote;
$("#qv").addEventListener("close",()=>{if(location.hash.startsWith("#/p/"))location.hash="#/"});
addEventListener("hashchange",()=>{term="";$("#q").value="";menu(false);const go=()=>{render();scrollTo(0,0)};document.startViewTransition&&!matchMedia("(prefers-reduced-motion: reduce)").matches?document.startViewTransition(go):go()});
nav();who();loadCatalog().then(()=>{nav();render()});initAuth();subscribeCatalog();registerSW();
