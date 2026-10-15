// Sincronización opcional del progreso con Supabase (compartida por las dos rutas).
// Cada página la carga con: <script src="../assets/js/sync.js" data-ruta="..." data-meta="..."></script>
// y define antes de usarla las funciones sbGet() y sbSet(s) que leen y escriben su estado.
// Sin sesión todo sigue funcionando solo con localStorage.
const SB_URL = 'https://wavrteveawmympridvbp.supabase.co';
const SB_KEY = 'sb_publishable_MHeWlA3ZUeJC3sa4X5mNPA_hbHQXp7v'; // clave pública; los datos los protege RLS
const SB_RUTA = document.currentScript.dataset.ruta;
const SB_META = document.currentScript.dataset.meta;
const SB_POLITICA = '2026-10-15';
const SB_CONSENT = '<label class="sync-consent"><input type="checkbox" required><span>Acepto la <a href="../privacidad/" target="_blank" rel="noopener">política de tratamiento de datos</a> y que mi correo, progreso y notas se guarden en Supabase (Estados Unidos).</span></label>';
let sb = null, sbUser = null, sbMsg = '', sbBusy = false, sbTimer = null, sbApplying = false, sbForm = false, sbSent = false, sbDialogShown = false;
let sbMeta = {};
try { sbMeta = JSON.parse(localStorage.getItem(SB_META) || '{}') || {}; } catch (e) { sbMeta = {}; }
function sbSaveMeta(){ try { localStorage.setItem(SB_META, JSON.stringify(sbMeta)); } catch (e) {} }
function sbDirty(){
  if (sbApplying) return;
  sbMeta.dirty = true; sbSaveMeta();
  if (sbUser) { clearTimeout(sbTimer); sbTimer = setTimeout(sbPush, 1500); }
}
function sbBox(){
  const box = document.getElementById('sync-box');
  if (box) box.innerHTML = syncBoxHtml();
  const d = document.getElementById('sync-dialog');
  if (d && d.open) { if (sbUser || sbSnoozed()) d.close(); else d.innerHTML = syncBannerInner(); }
}
// Ventana emergente al empezar la ruta: aparece una vez hasta que la persona inicia sesión o la descarta.
// "Ahora no" silencia el aviso 7 días; después vuelve a ofrecerse si no iniciaste sesión.
function sbSnoozed(){ return (sbMeta.avisoHasta || 0) > Date.now(); }
function sbDismiss(){ sbMeta.avisoHasta = Date.now() + 7 * 864e5; sbSaveMeta(); }
function sbDialog(){
  let d = document.getElementById('sync-dialog');
  if (!d) {
    d = document.createElement('dialog');
    d.id = 'sync-dialog'; d.className = 'sync-dialog';
    d.setAttribute('aria-label', 'Guardar tu progreso en la nube');
    d.addEventListener('cancel', sbDismiss);
    d.addEventListener('click', e => { if (e.target === d) { sbDismiss(); d.close(); } });
    document.body.appendChild(d);
  }
  return d;
}
function sbOpenDialog(){
  if (!sb || sbUser || sbSnoozed() || sbDialogShown || typeof HTMLDialogElement === 'undefined') return;
  sbDialogShown = true;
  const d = sbDialog();
  d.innerHTML = syncBannerInner();
  if (!d.open) d.showModal();
}
function syncBannerInner(){
  if (!sb || sbUser || sbSnoozed()) return '';
  if (sbSent) return '<div class="sync-banner" role="status"><h2>Revisá tu correo</h2><p>' + esc(sbMsg) + '</p><div class="sync-row"><button class="reset" type="button" id="sync-later">Cerrar</button></div></div>';
  return '<form class="sync-form sync-banner"><h2>Guardá tu progreso en la nube</h2>'
    + '<p>Iniciá sesión con tu correo y tu avance y tus notas te siguen en cualquier dispositivo. Es opcional: sin cuenta todo se guarda en este navegador.</p>'
    + SB_CONSENT + '<div class="sync-row"><input type="email" required autocomplete="email" placeholder="nombre@correo.com" aria-label="Tu correo"><button class="reset" type="submit">Enviarme el enlace</button><button class="reset" type="button" id="sync-later">Ahora no</button></div>'
    + (sbMsg ? '<p role="status">' + esc(sbMsg) + '</p>' : '')
    + '</form>';
}
function syncBoxHtml(){
  if (!sb) return '';
  const msg = sbMsg ? '<span class="sync-msg" role="status">' + esc(sbMsg) + '</span>' : '';
  if (sbUser) return '<span class="mono">Sincronizado como ' + esc(sbUser.email || '') + '</span>' + msg + '<button class="reset" type="button" id="sync-out">Cerrar sesión</button><button class="reset" type="button" id="sync-del">Borrar mis datos de la nube</button>';
  if (sbForm) return '<form class="sync-form sync-box"><label class="start-field"><span class="mono">Tu correo</span><input type="email" id="sync-email" required autocomplete="email" placeholder="nombre@correo.com"></label>' + SB_CONSENT + '<button class="reset" type="submit">Enviarme el enlace</button></form>' + msg;
  return '<button class="reset" type="button" id="sync-open">Iniciar sesión para sincronizar</button>' + msg;
}
function sbMerge(l, r){
  // En conflicto gana lo local; lo que solo existe en la nube se conserva.
  return {progreso: Object.assign({}, r.progreso, l.progreso), notas: Object.assign({}, r.notas, l.notas), config: Object.assign({}, r.config, l.config)};
}
async function sbDelete(){
  if (!sb || !sbUser) return;
  if (!confirm('Esto borra de la nube tu progreso y tus notas de todas las rutas y cierra tu sesión. Lo que tenés en este navegador no se toca. ¿Continuar?')) return;
  clearTimeout(sbTimer);
  const {error} = await sb.from('progreso').delete().eq('user_id', sbUser.id);
  if (error) { sbMsg = 'No se pudo borrar. Intentá de nuevo.'; sbBox(); return; }
  sbMeta = {avisoHasta: sbMeta.avisoHasta}; sbSaveMeta();
  await sb.auth.signOut();
  sbMsg = 'Borramos tus datos de la nube. Si también querés eliminar tu correo, pedilo desde la política de privacidad.';
  sbBox();
}
async function sbPush(){
  if (!sb || !sbUser || sbBusy) return;
  sbBusy = true;
  const s = sbGet();
  try {
    const {data, error} = await sb.from('progreso').upsert(
      {user_id: sbUser.id, ruta: SB_RUTA, progreso: s.progreso, notas: s.notas, config: s.config},
      {onConflict: 'user_id,ruta'}).select('updated_at');
    if (error || !data || !data[0]) throw error || new Error('sin datos');
    sbMeta = Object.assign(sbMeta, {uid: sbUser.id, at: data[0].updated_at, dirty: false}); sbSaveMeta();
    sbMsg = 'Guardado en la nube.';
  } catch (e) {
    sbMsg = 'No se pudo guardar. Reintento en unos segundos.';
    clearTimeout(sbTimer); sbTimer = setTimeout(sbPush, 30000);
  } finally { sbBusy = false; sbBox(); }
}
async function sbPull(){
  if (!sb || !sbUser) return;
  try {
    const {data, error} = await sb.from('progreso').select('progreso,notas,config,updated_at').eq('ruta', SB_RUTA).maybeSingle();
    if (error) throw error;
    const linked = sbMeta.uid === sbUser.id && sbMeta.at;
    if (!data) { sbMeta = Object.assign(sbMeta, {uid: sbUser.id, dirty: true}); sbSaveMeta(); await sbPush(); return; }
    if (linked && sbMeta.at === data.updated_at) {
      if (sbMeta.dirty) await sbPush(); else { sbMsg = 'Todo al día.'; sbBox(); }
      return;
    }
    const remote = {progreso: data.progreso || {}, notas: data.notas || {}, config: data.config || {}};
    if (linked && !sbMeta.dirty) {
      sbSet(remote); sbMeta = Object.assign(sbMeta, {uid: sbUser.id, at: data.updated_at, dirty: false}); sbSaveMeta();
      sbMsg = 'Cargamos tu progreso guardado.'; renderAll();
    } else {
      sbSet(sbMerge(sbGet(), remote)); sbMeta = Object.assign(sbMeta, {uid: sbUser.id, at: data.updated_at, dirty: true}); sbSaveMeta();
      sbMsg = 'Combinamos tu progreso de este equipo con el guardado.'; renderAll(); await sbPush();
    }
  } catch (e) { sbMsg = 'No se pudo conectar con la nube. Tu progreso local está a salvo.'; sbBox(); }
}
function sbInit(){
  if (!window.supabase) return;
  sb = window.supabase.createClient(SB_URL, SB_KEY);
  sb.auth.onAuthStateChange((ev, session) => {
    sbUser = session ? session.user : null;
    sbBox();
    if (sbUser && (ev === 'SIGNED_IN' || ev === 'INITIAL_SESSION')) setTimeout(sbPull, 0);
    if (!sbUser && ev === 'INITIAL_SESSION') setTimeout(sbOpenDialog, 600);
  });
  sbBox();
}
document.addEventListener('click', async e => {
  if (!sb) return;
  if (e.target.closest('#sync-open')) { sbForm = true; sbMsg = ''; sbBox(); const i = document.getElementById('sync-email'); if (i) i.focus(); }
  else if (e.target.closest('#sync-later')) { sbMeta.avisoHasta = Date.now() + 7 * 864e5; sbSaveMeta(); sbBox(); }
  else if (e.target.closest('#sync-del')) { await sbDelete(); }
  else if (e.target.closest('#sync-out')) { clearTimeout(sbTimer); await sb.auth.signOut(); sbMsg = 'Sesión cerrada. Tu progreso sigue en este navegador.'; sbBox(); }
});
document.addEventListener('submit', async e => {
  if (!e.target.classList || !e.target.classList.contains('sync-form') || !sb) return;
  e.preventDefault();
  const email = e.target.querySelector('input[type=email]').value.trim();
  sbMsg = 'Enviando…'; sbBox();
  const {error} = await sb.auth.signInWithOtp({email: email, options: {emailRedirectTo: location.origin + location.pathname, data: {politica_aceptada: new Date().toISOString(), politica_version: SB_POLITICA}}});
  sbForm = !!error; sbSent = !error;
  sbMsg = error ? 'No se pudo enviar el enlace. Esperá unos minutos e intentá de nuevo.' : 'Te enviamos un enlace a ' + email + '. Abrilo en este mismo navegador para terminar.';
  sbBox();
});
(function(){
  const s = document.createElement('script');
  s.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.min.js';
  s.integrity = 'sha384-GFr3yTh5lJznCbZfpTtXnwboFsxqtTQoeTZCRHhE0579KrRmlCzen5AA8ohaB5ug';
  s.crossOrigin = 'anonymous';
  s.onload = sbInit;
  document.head.appendChild(s);
})();
