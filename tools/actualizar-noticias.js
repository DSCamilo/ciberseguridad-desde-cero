// Descarga los feeds RSS/Atom de las fuentes y genera noticias/datos.json.
// Uso: node tools/actualizar-noticias.js        (Node 18+, sin dependencias)
// Lo ejecuta .github/workflows/noticias.yml cada día. Solo guarda título, enlace, fecha y fuente:
// el contenido de las notas no se copia, el sitio enlaza al original.
const fs = require('fs');
const path = require('path');

const SALIDA = path.join(__dirname, '..', 'noticias', 'datos.json');
const POR_FUENTE = 8;        // máximo de notas recientes por fuente
const MAX_TOTAL = 120;       // máximo de notas en el archivo
const MAX_DIAS = 60;         // se descartan las más viejas
const MAX_BYTES = 5 * 1024 * 1024;

// Todas verificadas con respuesta 200 y contenido RSS/Atom válido.
const FUENTES = [
  { id: 'cisa', nombre: 'CISA', idioma: 'en', tipo: 'avisos', feed: 'https://www.cisa.gov/cybersecurity-advisories/all.xml', sitio: 'https://www.cisa.gov/news-events/cybersecurity-advisories', max: 5 },
  { id: 'incibe-avisos', nombre: 'INCIBE-CERT · Avisos', idioma: 'es', tipo: 'avisos', feed: 'https://www.incibe.es/incibe-cert/alerta-temprana/avisos/feed', sitio: 'https://www.incibe.es/incibe-cert/alerta-temprana/avisos', max: 5 },
  { id: 'incibe-blog', nombre: 'INCIBE-CERT · Blog', idioma: 'es', tipo: 'noticias', feed: 'https://www.incibe.es/incibe-cert/blog/feed', sitio: 'https://www.incibe.es/incibe-cert/blog' },
  { id: 'hispasec', nombre: 'Una al día (Hispasec)', idioma: 'es', tipo: 'noticias', feed: 'https://unaaldia.hispasec.com/feed', sitio: 'https://unaaldia.hispasec.com' },
  { id: 'welivesecurity', nombre: 'WeLiveSecurity (ESET)', idioma: 'es', tipo: 'noticias', feed: 'https://www.welivesecurity.com/la-es/feed/', sitio: 'https://www.welivesecurity.com/la-es/' },
  { id: 'segu-info', nombre: 'Segu-Info', idioma: 'es', tipo: 'noticias', feed: 'https://blog.segu-info.com.ar/feeds/posts/default', sitio: 'https://blog.segu-info.com.ar' },
  { id: 'thehackernews', nombre: 'The Hacker News', idioma: 'en', tipo: 'noticias', feed: 'https://feeds.feedburner.com/TheHackersNews', sitio: 'https://thehackernews.com' },
  { id: 'bleepingcomputer', nombre: 'BleepingComputer', idioma: 'en', tipo: 'noticias', feed: 'https://www.bleepingcomputer.com/feed/', sitio: 'https://www.bleepingcomputer.com' },
  { id: 'krebs', nombre: 'Krebs on Security', idioma: 'en', tipo: 'noticias', feed: 'https://krebsonsecurity.com/feed/', sitio: 'https://krebsonsecurity.com' },
  { id: 'sans-isc', nombre: 'SANS Internet Storm Center', idioma: 'en', tipo: 'noticias', feed: 'https://isc.sans.edu/rssfeed.xml', sitio: 'https://isc.sans.edu' },
  { id: 'schneier', nombre: 'Schneier on Security', idioma: 'en', tipo: 'noticias', feed: 'https://www.schneier.com/feed/atom/', sitio: 'https://www.schneier.com' },
];

const ENTIDADES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };
function decodificar(s) {
  return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e) => {
    if (e[0] === '#') {
      const n = e[1].toLowerCase() === 'x' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
      return n > 0 && n < 0x110000 ? String.fromCodePoint(n) : '';
    }
    return ENTIDADES[e.toLowerCase()] ?? m;
  });
}
// Texto plano: quita CDATA, etiquetas y entidades; el resultado nunca se interpreta como HTML.
function limpiar(s, max = 220) {
  if (!s) return '';
  let t = s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1');
  t = decodificar(t);
  t = t.replace(/<[^>]*>/g, ' ');
  // segunda decodificación (&amp;lt; -> &lt; -> <) y nueva pasada por si aparecen etiquetas
  t = decodificar(t).replace(/<[^>]*>/g, ' ').replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim();
  return t.length > max ? t.slice(0, max - 1).trimEnd() + '…' : t;
}
function etiqueta(bloque, nombre) {
  const m = bloque.match(new RegExp(`<${nombre}(?:\\s[^>]*)?>([\\s\\S]*?)</${nombre}>`, 'i'));
  return m ? m[1] : '';
}
function enlaceAtom(bloque) {
  const links = [...bloque.matchAll(/<link\b([^>]*)\/?>/gi)].map(m => m[1]);
  const alt = links.find(a => /rel=["']alternate["']/i.test(a)) || links.find(a => !/rel=/i.test(a)) || links[0];
  const h = alt && alt.match(/href=["']([^"']+)["']/i);
  return h ? decodificar(h[1]) : '';
}
function urlSegura(u, fuente) {
  try {
    const url = new URL(u.trim());
    // Algunos feeds (Blogger) publican http://; solo se sube a https si el dominio es el de la propia fuente.
    if (url.protocol === 'http:' && fuente && url.hostname === new URL(fuente.sitio).hostname) url.protocol = 'https:';
    if (url.protocol !== 'https:') return null;
    return url.href.length <= 500 ? url.href : null;
  } catch (e) { return null; }
}
function fechaIso(s) {
  const d = new Date(limpiar(s, 80));
  return isNaN(d) ? null : d;
}
function parsear(xml, fuente) {
  const bloques = [...xml.matchAll(/<(item|entry)\b[^>]*>([\s\S]*?)<\/\1>/gi)].map(m => m[2]);
  const ahora = Date.now();
  const items = [];
  for (const b of bloques) {
    const titulo = limpiar(etiqueta(b, 'title'));
    const crudo = limpiar(etiqueta(b, 'link'), 600) || enlaceAtom(b);
    const url = urlSegura(crudo, fuente);
    const fecha = fechaIso(etiqueta(b, 'pubDate') || etiqueta(b, 'dc:date') || etiqueta(b, 'published') || etiqueta(b, 'updated'));
    if (!titulo || !url || !fecha) continue;
    if (fecha.getTime() > ahora + 864e5) continue; // fechas futuras: error del feed
    items.push({ titulo, url, fecha: fecha.toISOString(), fuente: fuente.id });
  }
  return items.sort((a, b) => b.fecha.localeCompare(a.fecha)).slice(0, fuente.max || POR_FUENTE);
}
async function descargar(url) {
  const r = await fetch(url, { redirect: 'follow', signal: AbortSignal.timeout(25000), headers: { 'user-agent': 'Mozilla/5.0 (compatible; ciberseguridad-desde-cero news bot)', accept: 'application/rss+xml, application/atom+xml, text/xml, */*' } });
  if (!r.ok) throw new Error('HTTP ' + r.status);
  const buf = Buffer.from(await r.arrayBuffer());
  if (buf.length > MAX_BYTES) throw new Error('feed demasiado grande');
  return buf.toString('utf8');
}

(async () => {
  let previo = { items: [] };
  try { previo = JSON.parse(fs.readFileSync(SALIDA, 'utf8')); } catch (e) {}
  let todos = [];
  const fallos = [];
  for (const f of FUENTES) {
    try {
      const items = parsear(await descargar(f.feed), f);
      if (!items.length) throw new Error('sin notas válidas');
      todos.push(...items);
      console.log(`OK    ${f.id}: ${items.length}`);
    } catch (e) {
      // un fallo puntual no borra lo que ya teníamos de esa fuente
      const guardadas = (previo.items || []).filter(i => i.fuente === f.id);
      todos.push(...guardadas);
      fallos.push(f.id);
      console.log(`FALLA ${f.id}: ${e.message} (se conservan ${guardadas.length} guardadas)`);
    }
  }
  const limite = Date.now() - MAX_DIAS * 864e5;
  const vistos = new Set();
  const items = todos
    .filter(i => new Date(i.fecha).getTime() >= limite)
    .sort((a, b) => b.fecha.localeCompare(a.fecha))
    .filter(i => !vistos.has(i.url) && vistos.add(i.url))
    .slice(0, MAX_TOTAL);
  if (!items.length) { console.error('No hay notas: no se modifica el archivo.'); process.exit(1); }

  const fuentes = FUENTES.map(({ id, nombre, idioma, tipo, sitio }) => ({ id, nombre, idioma, tipo, sitio }));
  const mismo = JSON.stringify(previo.items) === JSON.stringify(items) && JSON.stringify(previo.fuentes) === JSON.stringify(fuentes);
  if (mismo) { console.log('Sin cambios.'); return; }
  fs.mkdirSync(path.dirname(SALIDA), { recursive: true });
  fs.writeFileSync(SALIDA, JSON.stringify({ actualizado: new Date().toISOString(), fuentes, items }, null, 1) + '\n');
  console.log(`Guardadas ${items.length} notas.${fallos.length ? ' Fuentes con fallo: ' + fallos.join(', ') : ''}`);
})();
