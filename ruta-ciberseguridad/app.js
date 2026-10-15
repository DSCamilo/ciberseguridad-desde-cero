// Lógica de la Ruta SOC Analyst: estado, renderizado y eventos.
function herramientasPanel(p){
  const lista = HERRAMIENTAS[p.id] || [];
  const aviso = `<p class="goal">Descargá solo desde el sitio o repositorio oficial y revisá la licencia de cada herramienta. Ejecutá malware únicamente en máquinas virtuales aisladas.</p>`;
  return aviso + `<div class="res-grid">${lista.map(h=>`<a class="res-card" href="${h[2]}" target="_blank" rel="noopener"><span class="mono">${h[3]}</span><b>${h[0]}</b><span class="res-desc">${h[1]}</span><span class="res-link">${h[2].replace(/^https?:\/\//,'').replace(/\/$/,'')} ↗</span></a>`).join('')}</div>`;
}

const PKEY = 'ruta-ciber-v2';
const VKEY = 'ruta-ciber-view';
const NKEY = 'ruta-ciber-notas';
const CKEY = 'ruta-ciber-config';
let notas = {};
let config = {};
try { notas = JSON.parse(localStorage.getItem(NKEY) || '{}'); } catch (e) { notas = {}; }
try { config = JSON.parse(localStorage.getItem(CKEY) || '{}'); } catch (e) { config = {}; }
function saveNotas(){ try { localStorage.setItem(NKEY, JSON.stringify(notas)); } catch (e) {} sbDirty(); }
function saveConfig(){ try { localStorage.setItem(CKEY, JSON.stringify(config)); } catch (e) {} sbDirty(); }
function esc(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function wipKey(k){ return k+'-w'; }
function semanaTxt(){
  if (!config.start) return '';
  const d = (Date.now() - new Date(config.start+'T00:00:00').getTime()) / 86400000;
  const s = Math.floor(d/7) + 1;
  if (s < 1) return 'La ruta empieza el '+config.start;
  return `Semana ${s} de la ruta · 20 a 27 semanas en total`;
}
let progress = {};
let view = {phase:'f1', tab:'temas'};
try { progress = JSON.parse(localStorage.getItem(PKEY) || '{}'); } catch (e) { progress = {}; }
try { const v = JSON.parse(localStorage.getItem(VKEY) || '{}'); if (v.phase && phases.some(p=>p.id===v.phase)) view = {phase:v.phase, tab:v.tab || 'temas'}; } catch (e) {}
function saveProgress(){ try { localStorage.setItem(PKEY, JSON.stringify(progress)); } catch (e) {} sbDirty(); }
function saveView(){ try { localStorage.setItem(VKEY, JSON.stringify(view)); } catch (e) {} }

const total = phases.reduce((a,p)=>a+p.temas.length+p.labs.length,0);
const pct = (d,n)=> n ? Math.round(d/n*100) : 0;
function phaseCounts(p){
  let d = 0;
  p.temas.forEach((_,i)=>{ if(progress[p.id+'-t-'+i]) d++; });
  p.labs.forEach((_,i)=>{ if(progress[p.id+'-l-'+i]) d++; });
  return {d, n: p.temas.length + p.labs.length};
}
function doneTotal(){ return Object.keys(progress).filter(k=>progress[k] && !k.endsWith('-w')).length; }

function quizBlock(key){
  const qs = quizzes[key];
  if (!qs) return '';
  return `<div class="quiz"><h4>Preguntas de repaso</h4><ol>${qs.map(([q,a])=>`<li><p>${q}</p><details><summary>Ver respuesta</summary><p>${a}</p></details></li>`).join('')}</ol></div>`;
}

const chevron = `<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

function card(key, idx, title, bodyHTML){
  const done = !!progress[key];
  const wip = !!progress[wipKey(key)];
  return `<article class="card ${done?'done':''} ${wip&&!done?'wip':''}" data-card="${key}">
  <div class="card-head">
    <label class="check"><input type="checkbox" data-k="${key}" aria-label="Marcar como hecho: ${title}" ${done?'checked':''}></label>
    <button class="card-toggle" type="button" aria-expanded="false" aria-controls="b-${key}" data-toggle="${key}">
      <span class="idx">${String(idx+1).padStart(2,'0')}</span>
      <span class="card-title">${title}</span>
      ${chevron}
    </button>
    <button class="wip-btn" type="button" aria-pressed="${wip}" data-wip="${key}">En curso</button>
  </div>
  <div class="card-body" id="b-${key}" hidden>${bodyHTML}<div class="notes"><label class="mono" for="n-${key}">Mis notas</label><textarea id="n-${key}" data-note="${key}" rows="3" placeholder="Conclusiones, comandos que funcionaron, dudas...">${esc(notas[key]||'')}</textarea></div></div>
</article>`;
}

function renderAside(){
  const d = doneTotal();
  const navItems = phases.map(p=>{
    const c = phaseCounts(p);
    return `<button class="nav-item" type="button" data-phase="${p.id}" aria-current="${view.phase===p.id}">
      <span class="nav-top"><span class="nav-name">${p.n}: ${p.name}</span><span class="mono" data-nav-count="${p.id}">${c.d}/${c.n}</span></span>
      <span class="pbar"><span data-nav-bar="${p.id}" style="width:${pct(c.d,c.n)}%"></span></span>
    </button>`;
  }).join('');
  return `
  <div>
    <a class="back" href="../">${iconoHtml('arrow-left')} Todas las rutas</a>
    <p class="brand" style="margin-top:12px">Ruta SOC Analyst</p>
    <p class="brand-sub">De Fundamentos a Pentesting · 10 h por semana</p>
  </div>
  <div class="overall">
    <div class="mono" id="overall-text">${d} de ${total} completados · ${pct(d,total)}%</div>
    <div class="pbar"><span id="overall-bar" style="width:${pct(d,total)}%"></span></div>
  </div>
  <label class="aside-search"><span class="mono">Buscar en la ruta</span><input id="qsearch" type="search" placeholder="Tema, laboratorio o sigla" value="${esc(view.q||'')}"></label>
  <nav class="nav" aria-label="Fases">${navItems}<button class="nav-item" type="button" data-phase="glosario" aria-current="${view.phase==='glosario'}"><span class="nav-top"><span class="nav-name">Glosario</span><span class="mono">${GLOSARIO.reduce((a,g)=>a+g.items.length,0)}</span></span><span class="brand-sub">Términos y siglas</span></button></nav>
  <div class="aside-foot">
    <label class="start-field"><span class="mono">Fecha de inicio</span><input type="date" id="start-date" value="${config.start||''}"></label>
    <button class="reset" type="button" id="copy">Copiar resumen</button>
    <div class="sync-box" id="sync-box">${syncBoxHtml()}</div>
    <button class="reset" type="button" id="reset">Reiniciar progreso</button>
    <span class="mono">Tu progreso se guarda en este navegador.</span>
    <a class="priv" href="../privacidad/">Política de tratamiento de datos</a>
  </div>`;
}

function renderGlossary(){
  const cats = GLOSARIO.map(g=>`<section class="g-cat"><h3>${g.cat}</h3><dl class="g-list">${g.items.map(([t,d])=>`<div class="g-item" data-term="${(t+' '+d).toLowerCase()}"><dt>${t}</dt><dd>${d}</dd></div>`).join('')}</dl></section>`).join('');
  return `<div class="wrap">
  <section class="hero"><span class="mono">Referencia</span><h1>Glosario</h1><p>Términos y abreviaciones de la ruta, agrupados por tema.</p></section>
  <div class="g-search"><input id="gsearch" type="search" placeholder="Buscar término o sigla..." aria-label="Buscar en el glosario"></div>
  <div id="glist">${cats}</div>
  </div>`;
}

function filterGlossary(q){
  q = q.trim().toLowerCase();
  document.querySelectorAll('.g-item').forEach(el=>{ el.hidden = !!q && !el.dataset.term.includes(q); });
  document.querySelectorAll('.g-cat').forEach(s=>{ s.hidden = ![...s.querySelectorAll('.g-item')].some(i=>!i.hidden); });
}

function pager(p){
  const i = phases.findIndex(x=>x.id===p.id);
  const prev = phases[i-1], next = phases[i+1];
  return `<nav class="pager" aria-label="Cambiar de fase">${prev?`<button class="reset" type="button" data-phase="${prev.id}">← ${prev.n}: ${prev.name}</button>`:'<span></span>'}${next?`<button class="reset" type="button" data-phase="${next.id}">${next.n}: ${next.name} →</button>`:'<span></span>'}</nav>`;
}

function renderSearch(){
  const q = view.q.trim().toLowerCase();
  const hits = [];
  phases.forEach(p=>{
    p.temas.forEach(x=>{
      const txt = (x.t+' '+x.c+' '+(x.p||[]).join(' ')).toLowerCase();
      if (txt.includes(q)) hits.push({where:`${p.n} · Temas`, t:x.t, go:`${p.id}|temas`});
    });
    p.labs.forEach(l=>{
      const txt = (l.t+' '+l.pasos.join(' ')).toLowerCase();
      if (txt.includes(q)) hits.push({where:`${p.n} · Laboratorios`, t:l.t, go:`${p.id}|labs`});
    });
  });
  GLOSARIO.forEach(g=>g.items.forEach(([t,d])=>{
    if ((t+' '+d).toLowerCase().includes(q)) hits.push({where:'Glosario', t, d, go:'glosario|'});
  }));
  const list = hits.length
    ? hits.map(h=>`<button class="s-item" type="button" data-goto="${h.go}"><span class="mono">${h.where}</span><b>${h.t}</b>${h.d?`<span class="res-desc">${h.d}</span>`:''}</button>`).join('')
    : `<p class="goal">No encontré resultados para “${esc(view.q)}”.</p>`;
  return `<div class="wrap">
  <section class="hero"><span class="mono">Búsqueda</span><h1>${hits.length} resultado${hits.length===1?'':'s'}</h1><p>Para “${esc(view.q)}”. Hacé clic en un resultado para abrirlo.</p></section>
  <div class="s-list" style="margin-top:20px">${list}</div>
  </div>`;
}

function renderMain(){
  if (view.q && view.q.trim()) return renderSearch();
  if (view.phase === 'glosario') return renderGlossary();
  const p = phases.find(x=>x.id===view.phase);
  const c = phaseCounts(p);
  const TAB_ICONOS = {temas:'book-open', labs:'flask-conical', herramientas:'wrench', recursos:'library'};
  const tabs = [['temas','Temas',p.temas.length],['labs','Laboratorios',p.labs.length],['herramientas','Herramientas',(HERRAMIENTAS[p.id]||[]).length],['recursos','Recursos',p.recursos.length]];
  const seg = tabs.map(([k,l,n])=>`<button type="button" role="tab" aria-selected="${view.tab===k}" data-tab="${k}">${iconoHtml(TAB_ICONOS[k])} ${l} · ${n}</button>`).join('');

  let panel = '';
  if (view.tab === 'temas') {
    panel = p.temas.map((x,i)=>card(p.id+'-t-'+i, i, x.t, `<p>${x.c}</p>${x.p?`<ul>${x.p.map(q=>`<li>${q}</li>`).join('')}</ul>`:''}${quizBlock(p.id+'-t-'+i)}`)).join('');
  } else if (view.tab === 'herramientas') {
    panel = herramientasPanel(p);
  } else if (view.tab === 'labs') {
    panel = p.labs.map((l,i)=>card(p.id+'-l-'+i, i, l.t, `<ol class="steps">${l.pasos.map(s=>`<li><span>${s}</span></li>`).join('')}</ol>`)).join('');
  } else {
    panel = `<div class="res-grid">${p.recursos.map(r=>`<a class="res-card" href="${r[2]}" target="_blank" rel="noopener"><b>${r[0]}</b><span class="res-desc">${r[1]}</span><span class="res-link">${r[2].replace(/^https?:\/\//,'').replace(/\/$/,'')} ↗</span></a>`).join('')}</div>`;
  }

  return `<div class="wrap">
  <section class="hero">
    <span class="mono">${p.n} · ${p.weeks}</span>
    <h1>${p.name}</h1>
    <p>${p.goal}</p>
    ${semanaTxt() ? `<p class="mono">${semanaTxt()}</p>` : ''}
    <div class="hero-prog"><div class="pbar"><span id="hero-bar" style="width:${pct(c.d,c.n)}%"></span></div><span class="mono" id="hero-text">${c.d} de ${c.n}</span></div>
  </section>
  <div class="seg" role="tablist" aria-label="Contenido de la fase">${seg}</div>
  <div role="tabpanel">${panel}</div>
  ${pager(p)}
  <div class="note"><strong>Regla básica:</strong> practicá solo en máquinas propias o en plataformas autorizadas como TryHackMe, HackTheBox y los laboratorios locales. Atacar sistemas ajenos es delito en Colombia (Ley 1273 de 2009).</div>
  </div>`;
}

function copyResumen(btn){
  const d = doneTotal();
  const lines = ['Ruta SOC Analyst: de Fundamentos a Pentesting', `Progreso: ${d} de ${total} (${pct(d,total)}%)`];
  phases.forEach(p=>{ const c = phaseCounts(p); lines.push(`${p.n} ${p.name}: ${c.d}/${c.n}`); });
  const text = lines.join('\n');
  const ok = ()=>{ btn.textContent = 'Copiado'; setTimeout(()=>{ btn.textContent = 'Copiar resumen'; }, 2000); };
  const fail = ()=>{ btn.textContent = 'No se pudo copiar'; setTimeout(()=>{ btn.textContent = 'Copiar resumen'; }, 2500); };
  try { navigator.clipboard.writeText(text).then(ok, fail); } catch (e) { fail(); }
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
  if (!cur) return;
  const c = phaseCounts(cur);
  const hb = document.getElementById('hero-bar'); if (hb) hb.style.width = pct(c.d,c.n)+'%';
  const ht = document.getElementById('hero-text'); if (ht) ht.textContent = `${c.d} de ${c.n}`;
}

const root = document.getElementById('app');

root.addEventListener('input', e=>{
  const t = e.target;
  if (t.id === 'gsearch') { filterGlossary(t.value); return; }
  if (t.id === 'qsearch') {
    view.q = t.value;
    const mainEl = document.querySelector('main');
    if (mainEl) mainEl.innerHTML = renderMain();
    return;
  }
  if (t.dataset && t.dataset.note) { notas[t.dataset.note] = t.value; saveNotas(); }
});

root.addEventListener('change', e=>{
  if (e.target.id === 'start-date') {
    config.start = e.target.value;
    saveConfig();
    renderAll();
    return;
  }
  const input = e.target.closest('input[type=checkbox][data-k]');
  if (!input) return;
  progress[input.dataset.k] = input.checked;
  saveProgress();
  const cardEl = input.closest('.card');
  if (cardEl) cardEl.classList.toggle('done', input.checked);
  updateCounts();
});

root.addEventListener('click', e=>{
  const gotoBtn = e.target.closest('[data-goto]');
  if (gotoBtn) {
    const [ph, tab] = gotoBtn.dataset.goto.split('|');
    view = {phase: ph, tab: ph === 'glosario' ? 'temas' : (tab === 'labs' ? 'labs' : 'temas'), q: ''};
    saveView(); renderAll(); return;
  }
  const wipBtn = e.target.closest('[data-wip]');
  if (wipBtn) {
    const k = wipBtn.dataset.wip;
    const on = !progress[wipKey(k)];
    progress[wipKey(k)] = on;
    saveProgress();
    wipBtn.setAttribute('aria-pressed', String(on));
    const cardEl = wipBtn.closest('.card');
    if (cardEl) cardEl.classList.toggle('wip', on && !progress[k]);
    return;
  }
  const copyBtn = e.target.closest('#copy');
  if (copyBtn) { copyResumen(copyBtn); return; }
  const phaseBtn = e.target.closest('[data-phase]');
  if (phaseBtn) {
    view = {phase: phaseBtn.dataset.phase, tab: 'temas'};
    saveView(); renderAll(); return;
  }
  const tabBtn = e.target.closest('[data-tab]');
  if (tabBtn) {
    view.tab = tabBtn.dataset.tab;
    saveView(); renderAll(); return;
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
      progress = {}; saveProgress(); renderAll();
    } else {
      reset.dataset.armed = '1';
      reset.textContent = 'Confirmar reinicio';
      setTimeout(()=>{ reset.dataset.armed = ''; reset.textContent = 'Reiniciar progreso'; }, 4000);
    }
  }
});

// Estado que sincroniza assets/js/sync.js
function sbGet(){ return {progreso: progress, notas: notas, config: config}; }
function sbSet(s){ sbApplying = true; try { progress = s.progreso || {}; notas = s.notas || {}; config = s.config || {}; saveProgress(); saveNotas(); saveConfig(); } finally { sbApplying = false; } }

// Abrir una fase desde un enlace con ancla (por ejemplo ruta-ciberseguridad/#f3)
function applyHash(){
  const m = /^#(f\d+)$/.exec(location.hash);
  if (!m || !phases.some(p => p.id === m[1])) return false;
  view = {phase: m[1], tab: 'temas'};
  saveView();
  return true;
}
window.addEventListener('hashchange', () => { if (applyHash()) renderAll(); });
applyHash();
renderAll();
