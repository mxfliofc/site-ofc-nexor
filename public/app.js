const $ = s => document.querySelector(s);
const page = document.body.dataset.page;
const state = {
  live: JSON.parse(localStorage.getItem("nexor_live") || "[]"),
  movies: JSON.parse(localStorage.getItem("nexor_movies") || "[]"),
  series: JSON.parse(localStorage.getItem("nexor_series") || "[]")
};

function esc(v=""){return String(v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]))}
function nav(){
  const links=[["/","Início","home"],["/live.html","TV ao vivo","live"],["/sports.html","Esportes","sports"],["/movies.html","Filmes","movies"],["/series.html","Séries","series"]];
  return `<header class="top"><a class="logo" href="/">NEX<span>O</span>R<b>.</b></a><nav class="nav">${links.map(x=>`<a class="${page===x[2]?"active":""}" href="${x[0]}">${x[1]}</a>`).join("")}</nav><input class="search" placeholder="Pesquisar..." onkeydown="if(event.key==='Enter')location='/search.html?q='+encodeURIComponent(this.value)"></header><nav class="bottom">${links.slice(0,5).map(x=>`<a class="${page===x[2]?"active":""}" href="${x[0]}"><b>●</b>${x[1]}</a>`).join("")}</nav>`;
}
function layout(content){$("#app").innerHTML=nav()+`<main class="container">${content}</main>`}
function card(item,type){
  const id=item.stream_id||item.series_id||item.id||"";
  const name=item.name||item.title||"Sem nome";
  const logo=item.stream_icon||item.cover||item.cover_big||"";
  return `<a class="card" href="/player.html?id=${encodeURIComponent(id)}&type=${type}"><div class="thumb">${logo?`<img loading="lazy" src="${esc(logo)}" onerror="this.style.display='none'">`:"<span class='muted'>NEXOR</span>"}</div><div class="card-body"><div class="card-title">${esc(name)}</div><div class="card-meta">${esc(item.category_name||type)}</div></div></a>`;
}
async function api(action, params={}){
  const u=new URL("/api/iptv",location.origin);u.searchParams.set("action",action);Object.entries(params).forEach(([k,v])=>u.searchParams.set(k,v));
  const r=await fetch(u);if(!r.ok)throw new Error((await r.json()).error||"Erro IPTV");return r.json();
}
async function home(){
  layout(`<section class="hero"><div><div class="eyebrow">NEXOR TV</div><h1>Seu conteúdo.<br>Do seu jeito.</h1><p>Uma experiência NEXOR focada em TV ao vivo, esportes, filmes e séries, alimentada pelos dados da sua fonte IPTV.</p><a class="btn" href="/live.html">Explorar ao vivo</a></div></section><section class="section"><div class="section-head"><h2>TV ao vivo</h2><a class="muted" href="/live.html">Ver tudo →</a></div><div id="liveGrid" class="grid"><div class="empty">Carregando...</div></div></section><section class="section"><div class="section-head"><h2>Filmes</h2><a class="muted" href="/movies.html">Ver tudo →</a></div><div id="movieGrid" class="grid"><div class="empty">Carregando...</div></div></section>`);
  try{
    const [l,m]=await Promise.all([api("get_live_streams",{limit:12}),api("get_vod_streams",{limit:12})]);
    $("#liveGrid").innerHTML=l.slice(0,12).map(x=>card(x,"live")).join("")||`<div class="empty">Nenhum canal encontrado.</div>`;
    $("#movieGrid").innerHTML=m.slice(0,12).map(x=>card(x,"movie")).join("")||`<div class="empty">Nenhum filme encontrado.</div>`;
  }catch(e){$(".container").insertAdjacentHTML("beforeend",`<div class="empty">Não foi possível carregar a fonte IPTV: ${esc(e.message)}</div>`)}
}
async function catalog(type){
  const action=type==="live"?"get_live_streams":type==="movies"?"get_vod_streams":"get_series";
  layout(`<section class="section" style="margin-top:5px"><div class="section-head"><div><div class="eyebrow">NEXOR</div><h2>${type==="live"?"TV AO VIVO":type==="movies"?"FILMES":"SÉRIES"}</h2></div></div><div class="pills"><span class="pill active">Todos</span><span class="pill">Favoritos</span><span class="pill">Recentes</span></div><div id="catalog" class="grid" style="margin-top:18px"><div class="empty">Carregando...</div></div></section>`);
  try{const d=await api(action,{limit:200});$("#catalog").innerHTML=d.map(x=>card(x,type==="live"?"live":type==="movies"?"movie":"series")).join("")||`<div class="empty">Nenhum conteúdo encontrado.</div>`;state[type==="live"?"live":type==="movies"?"movies":"series"]=d;localStorage.setItem("nexor_"+(type==="live"?"live":type==="movies"?"movies":"series"),JSON.stringify(d));}catch(e){$("#catalog").innerHTML=`<div class="empty">${esc(e.message)}</div>`}
}
async function sports(){
  layout(`<section class="section" style="margin-top:5px"><div class="eyebrow">NEXOR SPORTS</div><h2>Canais esportivos e jogos disponíveis na sua fonte IPTV</h2><p class="muted">A programação é baseada exclusivamente nos dados fornecidos pela fonte IPTV/EPG. Sem API externa.</p><div id="sports" class="grid"><div class="empty">Carregando...</div></div></section>`);
  try{
    const d=await api("get_live_streams",{limit:500});
    const words=/sport|esport|futebol|football|soccer|premiere|espn|sportv|combate|band sports|tnt sports|arena/i;
    const s=d.filter(x=>words.test((x.name||"")+" "+(x.category_name||"")));
    $("#sports").innerHTML=s.map(x=>card(x,"live")).join("")||`<div class="empty">Nenhum canal esportivo identificado.</div>`;
  }catch(e){$("#sports").innerHTML=`<div class="empty">${esc(e.message)}</div>`}
}
function search(){
  const q=new URLSearchParams(location.search).get("q")||"";
  layout(`<section class="section" style="margin-top:5px"><div class="eyebrow">BUSCA</div><h2>Pesquisar no NEXOR</h2><input id="q" class="search" style="display:block;width:100%;margin:20px 0" value="${esc(q)}" placeholder="Digite o nome do canal, filme ou série"><div id="results" class="grid"></div></section>`);
  $("#q").addEventListener("keydown",e=>{if(e.key==="Enter")location="?q="+encodeURIComponent(e.target.value)});
  Promise.all([api("get_live_streams",{limit:500}),api("get_vod_streams",{limit:500}),api("get_series",{limit:500})]).then(([a,b,c])=>{
    const all=[...a.map(x=>({...x,_t:"live"})),...b.map(x=>({...x,_t:"movie"})),...c.map(x=>({...x,_t:"series"}))];
    const r=all.filter(x=>(x.name||x.title||"").toLowerCase().includes(q.toLowerCase()));
    $("#results").innerHTML=r.slice(0,100).map(x=>card(x,x._t)).join("")||`<div class="empty">Nenhum resultado.</div>`;
  }).catch(e=>$("#results").innerHTML=`<div class="empty">${esc(e.message)}</div>`);
}
function favorites(){layout(`<section class="section"><div class="eyebrow">NEXOR</div><h2>Favoritos</h2><div class="empty" style="margin-top:20px">Os favoritos serão armazenados neste dispositivo. Abra um conteúdo para adicioná-lo.</div></section>`)}
function settings(){layout(`<section class="section settings"><div class="eyebrow">NEXOR</div><h2>Configurações</h2><div class="setting"><span>Tema</span><b>Escuro / NEXOR Red</b></div><div class="setting"><span>Fonte de conteúdo</span><b>IPTV configurado no servidor</b></div><div class="setting"><span>Dados externos</span><b>Desativados</b></div><div class="setting"><span>Cache local</span><button class="btn secondary" onclick="localStorage.clear();location.reload()">Limpar</button></div></section>`)}
function player(){
  const p=new URLSearchParams(location.search),id=p.get("id")||"",type=p.get("type")||"live";
  layout(`<section class="section" style="margin-top:5px"><a class="muted" href="javascript:history.back()">← Voltar</a><div class="player-wrap" style="margin-top:18px"><video id="video" controls playsinline></video></div><div class="player-info"><div class="eyebrow">NEXOR PLAYER</div><h2 id="ptitle">Carregando...</h2><p class="muted">Stream ${esc(type)} · ID ${esc(id)}</p></div></section>`);
  $("#ptitle").textContent="Conteúdo NEXOR";
}
(async()=>{try{
 if(page==="home")await home(); else if(page==="live")await catalog("live"); else if(page==="movies")await catalog("movies"); else if(page==="series")await catalog("series"); else if(page==="sports")await sports(); else if(page==="search")search(); else if(page==="favorites")favorites(); else if(page==="settings")settings(); else if(page==="player")player();
}catch(e){layout(`<div class="empty">${esc(e.message)}</div>`)}
})();