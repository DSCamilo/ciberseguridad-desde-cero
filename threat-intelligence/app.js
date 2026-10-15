// Lógica de la ruta de Threat Intelligence: estado, renderizado y eventos.
const KEY='ruta-ti-v1', NKEY='ruta-ti-notas', VKEY='ruta-ti-view';
function load(k,d){ try { return JSON.parse(localStorage.getItem(k)) || d; } catch (e) { return d; } }
function store(k,v){ try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} if (k === KEY || k === NKEY) sbDirty(); }
let progress = load(KEY, {});
let notas = load(NKEY, {});
let view = load(VKEY, {phase:'f1', tab:'temas'});
if (!R.phases.some(p=>p.id===view.phase)) view = {phase:'f1', tab:'temas'};

const phases = R.phases;
const total = phases.reduce((a,p)=>a+p.temas.length+p.labs.length,0);
const pct = (d,n)=> n ? Math.round(d/n*100) : 0;
const esc = s => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const doneTotal = ()=> Object.keys(progress).filter(k=>progress[k] && !k.endsWith('-w')).length;
function phaseCounts(p){
  let d = 0;
  p.temas.forEach((_,i)=>{ if (progress[p.id+'-t-'+i]) d++; });
  p.labs.forEach((_,i)=>{ if (progress[p.id+'-l-'+i]) d++; });
  return {d, n: p.temas.length + p.labs.length};
}
const chevron = `<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

function quiz(qs){
  if (!qs || !qs.length) return '';
  return `<div class="quiz"><h4>Preguntas de repaso</h4><ol>${qs.map(([q,a])=>`<li><p>${q}</p><details><summary>Ver respuesta</summary><p>${a}</p></details></li>`).join('')}</ol></div>`;
}

function card(key, i, title, body){
  const done = !!progress[key];
  const wip = !!progress[key+'-w'];
  return `<article class="card ${done?'done':''} ${wip&&!done?'wip':''}" data-card="${key}">
  <div class="card-head">
    <label class="check"><input type="checkbox" data-k="${key}" aria-label="Marcar como hecho: ${esc(title)}" ${done?'checked':''}></label>
    <button class="card-toggle" type="button" aria-expanded="false" aria-controls="b-${key}" data-toggle="${key}">
      <span class="idx">${String(i+1).padStart(2,'0')}</span>
      <span class="card-title">${title}</span>
      ${chevron}
    </button>
    <button class="wip-btn" type="button" aria-pressed="${wip}" data-wip="${key}">En curso</button>
  </div>
  <div class="card-body" id="b-${key}" hidden>${body}<div class="notes"><label class="mono" for="n-${key}">Mis notas</label><textarea id="n-${key}" data-note="${key}" rows="3" placeholder="Conclusiones, dudas, fuentes...">${esc(notas[key]||'')}</textarea></div></div>
</article>`;
}

function herrPanel(p){
  const lista = p.herr || [];
  return `<p class="intro">Descargá solo desde el sitio o repositorio oficial. Algunas herramientas tienen planes gratuitos con límites; revisalos antes de usarlas.</p><div class="res-grid">${lista.map(h=>`<a class="res-card" href="${h[2]}" target="_blank" rel="noopener"><span class="mono">${h[3]}</span><b>${h[0]}</b><span class="res-desc">${h[1]}</span><span class="res-link">${h[2].replace(/^https?:\/\//,'').replace(/\/$/,'')} ↗</span></a>`).join('')}</div>`;
}

function pager(p){
  const i = phases.findIndex(x=>x.id===p.id);
  const prev = phases[i-1], next = phases[i+1];
  return `<nav class="pager" aria-label="Cambiar de fase">${prev?`<button class="reset" type="button" data-phase="${prev.id}">← ${prev.n}: ${prev.name}</button>`:'<span></span>'}${next?`<button class="reset" type="button" data-phase="${next.id}">${next.n}: ${next.name} →</button>`:'<span></span>'}</nav>`;
}

function renderAside(){
  const d = doneTotal();
  const items = phases.map(p=>{
    const c = phaseCounts(p);
    return `<button class="nav-item" type="button" data-phase="${p.id}" aria-current="${view.phase===p.id}">
      <span class="nav-top"><span class="nav-name">${p.n}: ${p.name}</span><span class="mono" data-nav-count="${p.id}">${c.d}/${c.n}</span></span>
      <span class="pbar"><span data-nav-bar="${p.id}" style="width:${pct(c.d,c.n)}%"></span></span>
    </button>`;
  }).join('');
  return `
  <div>
    <a class="back" href="../">${iconoHtml('arrow-left')} Todas las rutas</a>
    <p class="brand" style="margin-top:12px">Threat Intelligence</p>
    <p class="mono" style="margin-top:4px">Nivel 2 · 3 fases</p>
  </div>
  <div class="overall">
    <div class="mono" id="overall-text">${d} de ${total} completados · ${pct(d,total)}%</div>
    <div class="pbar"><span id="overall-bar" style="width:${pct(d,total)}%"></span></div>
  </div>
  <label class="aside-search"><span class="mono">Buscar en la ruta</span><input id="qsearch" type="search" placeholder="Tema, laboratorio o término" value="${esc(view.q||'')}"></label>
  <nav class="nav" aria-label="Fases">${items}</nav>
  <div class="aside-foot">
    <div class="sync-box" id="sync-box">${syncBoxHtml()}</div>
    <button class="reset" type="button" id="reset">Reiniciar progreso</button>
    <span class="mono">Tu progreso se guarda en este navegador.</span>
    <a class="priv" href="../privacidad/">Política de tratamiento de datos</a>
  </div>`;
}

function renderSearch(){
  const q = view.q.trim().toLowerCase();
  const hits = [];
  phases.forEach(p=>{
    p.temas.forEach(x=>{
      if ((x.t+' '+x.c+' '+(x.p||[]).join(' ')).toLowerCase().includes(q)) hits.push({where:`${p.n} · Temas`, t:x.t, go:`${p.id}|temas`});
    });
    p.labs.forEach(l=>{
      if ((l.t+' '+l.pasos.join(' ')).toLowerCase().includes(q)) hits.push({where:`${p.n} · Laboratorios`, t:l.t, go:`${p.id}|labs`});
    });
  });
  const list = hits.length
    ? hits.map(h=>`<button class="s-item" type="button" data-goto="${h.go}"><span class="mono">${h.where}</span><b>${h.t}</b></button>`).join('')
    : `<p class="intro">No encontré resultados para “${esc(view.q)}”.</p>`;
  return `<div class="wrap"><section class="hero"><span class="mono">Búsqueda</span><h1>${hits.length} resultado${hits.length===1?'':'s'}</h1><p>Hacé clic en un resultado para abrirlo.</p></section><div class="s-list">${list}</div></div>`;
}

function renderMain(){
  if (view.q && view.q.trim()) return renderSearch();
  const p = phases.find(x=>x.id===view.phase);
  const c = phaseCounts(p);
  const TAB_ICONOS = {temas:'book-open', labs:'flask-conical', herramientas:'wrench', recursos:'library'};
  const tabs = [['temas','Temas',p.temas.length],['labs','Laboratorios',p.labs.length],['herramientas','Herramientas',(p.herr||[]).length],['recursos','Recursos',p.recursos.length]];
  const seg = tabs.map(([k,l,n])=>`<button type="button" role="tab" aria-selected="${view.tab===k}" data-tab="${k}">${iconoHtml(TAB_ICONOS[k])} ${l} · ${n}</button>`).join('');
  let panel = '';
  if (view.tab === 'temas') {
    panel = p.temas.map((x,i)=>card(p.id+'-t-'+i, i, x.t, `<p>${x.c}</p>${x.p?`<ul>${x.p.map(q=>`<li>${q}</li>`).join('')}</ul>`:''}${quiz(x.q)}`)).join('');
  } else if (view.tab === 'labs') {
    panel = p.labs.map((l,i)=>card(p.id+'-l-'+i, i, l.t, `<ol class="steps">${l.pasos.map(s=>`<li><span>${s}</span></li>`).join('')}</ol>`)).join('');
  } else if (view.tab === 'herramientas') {
    panel = herrPanel(p);
  } else {
    panel = `<div class="res-grid">${p.recursos.map(r=>`<a class="res-card" href="${r[2]}" target="_blank" rel="noopener"><b>${r[0]}</b><span class="res-desc">${r[1]}</span><span class="res-link">${r[2].replace(/^https?:\/\//,'').replace(/\/$/,'')} ↗</span></a>`).join('')}</div>`;
  }
  return `<div class="wrap">
  <section class="hero">
    <span class="mono">${p.n} · ${p.weeks}</span>
    <h1>${p.name}</h1>
    <p>${p.goal}</p>
    <div class="hero-prog"><div class="pbar"><span id="hero-bar" style="width:${pct(c.d,c.n)}%"></span></div><span class="mono" id="hero-text">${c.d} de ${c.n}</span></div>
  </section>
  <div class="seg" role="tablist" aria-label="Contenido de la fase">${seg}</div>
  <div role="tabpanel">${panel}</div>
  ${pager(p)}
  <div class="note"><strong>Regla básica:</strong> analizá amenazas solo con fuentes públicas o autorizadas. Acceder a sistemas de terceros es delito en Colombia (Ley 1273 de 2009).</div>
  </div>`;
}

function renderAll(){
  document.getElementById('app').innerHTML = `<div class="app"><aside>${renderAside()}</aside><main id="main" tabindex="-1">${renderMain()}</main></div>`;
}

function updateCounts(){
  const d = doneTotal();
  const ob = document.getElementById('overall-bar'); if (ob) ob.style.width = pct(d,total)+'%';
  const ot = document.getElementById('overall-text'); if (ot) ot.textContent = `${d} de ${total} completados · ${pct(d,total)}%`;
  phases.forEach(p=>{
    const c = phaseCounts(p);
    const nb = document.querySelector(`[data-nav-bar="${p.id}"]`); if (nb) nb.style.width = pct(c.d,c.n)+'%';
    const nc = document.querySelector(`[data-nav-count="${p.id}"]`); if (nc) nc.textContent = `${c.d}/${c.n}`;
  });
  const cur = phases.find(x=>x.id===view.phase);
  if (cur) {
    const c = phaseCounts(cur);
    const hb = document.getElementById('hero-bar'); if (hb) hb.style.width = pct(c.d,c.n)+'%';
    const ht = document.getElementById('hero-text'); if (ht) ht.textContent = `${c.d} de ${c.n}`;
  }
}

const root = document.getElementById('app');

root.addEventListener('input', e=>{
  const t = e.target;
  if (t.id === 'qsearch') {
    view.q = t.value;
    const mainEl = document.querySelector('main');
    if (mainEl) mainEl.innerHTML = renderMain();
    return;
  }
  if (t.dataset && t.dataset.note) { notas[t.dataset.note] = t.value; store(NKEY, notas); }
});

root.addEventListener('change', e=>{
  const input = e.target.closest('input[type=checkbox][data-k]');
  if (!input) return;
  progress[input.dataset.k] = input.checked;
  store(KEY, progress);
  const cardEl = input.closest('.card');
  if (cardEl) cardEl.classList.toggle('done', input.checked);
  updateCounts();
});

root.addEventListener('click', e=>{
  const gotoBtn = e.target.closest('[data-goto]');
  if (gotoBtn) {
    const [ph, tab] = gotoBtn.dataset.goto.split('|');
    view = {phase: ph, tab: tab === 'labs' ? 'labs' : 'temas', q: ''};
    store(VKEY, {phase: view.phase, tab: view.tab}); renderAll(); return;
  }
  const wipBtn = e.target.closest('[data-wip]');
  if (wipBtn) {
    const k = wipBtn.dataset.wip + '-w';
    progress[k] = !progress[k];
    store(KEY, progress);
    wipBtn.setAttribute('aria-pressed', String(!!progress[k]));
    const cardEl = wipBtn.closest('.card');
    if (cardEl) cardEl.classList.toggle('wip', !!progress[k] && !progress[wipBtn.dataset.wip]);
    return;
  }
  const phaseBtn = e.target.closest('[data-phase]');
  if (phaseBtn) {
    view = {phase: phaseBtn.dataset.phase, tab: 'temas', q: ''};
    store(VKEY, {phase: view.phase, tab: view.tab}); renderAll(); return;
  }
  const tabBtn = e.target.closest('[data-tab]');
  if (tabBtn) {
    view.tab = tabBtn.dataset.tab;
    store(VKEY, {phase: view.phase, tab: view.tab}); renderAll(); return;
  }
  const toggle = e.target.closest('[data-toggle]');
  if (toggle) {
    const body = document.getElementById('b-'+toggle.dataset.toggle);
    const open = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-expanded', String(!open));
    if (body) body.hidden = open;
    return;
  }
  const reset = e.target.closest('#reset');
  if (reset) {
    if (reset.dataset.armed === '1') {
      progress = {}; store(KEY, progress); renderAll();
    } else {
      reset.dataset.armed = '1';
      reset.textContent = 'Confirmar reinicio';
      setTimeout(()=>{ reset.dataset.armed = ''; reset.textContent = 'Reiniciar progreso'; }, 4000);
    }
  }
});

// Estado que sincroniza assets/js/sync.js
function sbGet(){ return {progreso: progress, notas: notas, config: {}}; }
function sbSet(s){ sbApplying = true; try { progress = s.progreso || {}; notas = s.notas || {}; store(KEY, progress); store(NKEY, notas); } finally { sbApplying = false; } }

renderAll();
