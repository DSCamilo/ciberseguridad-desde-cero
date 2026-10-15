// Verifica los enlaces externos de las rutas.  Uso: node tools/check-links.js
// Requiere Node 18+ (fetch integrado). No cambia ningún archivo.
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const pages = ['ruta-ciberseguridad/datos.js', 'threat-intelligence/datos.js'];
const urls = new Map();
for (const p of pages) {
  const s = fs.readFileSync(path.join(root, p), 'utf8');
  for (const m of s.matchAll(/'(https?:\/\/[^']+)'/g)) {
    if (!urls.has(m[1])) urls.set(m[1], []);
    urls.get(m[1]).push(p);
  }
}

async function check(url) {
  const opts = {redirect: 'follow', signal: AbortSignal.timeout(15000),
    headers: {'user-agent': 'Mozilla/5.0 (verificador-enlaces)'}};
  try {
    let r = await fetch(url, {...opts, method: 'HEAD'});
    if (r.status >= 400) r = await fetch(url, {...opts, method: 'GET'});
    return {url, status: r.status, final: r.url};
  } catch (e) {
    return {url, status: 'ERROR', final: String(e.cause?.code || e.message)};
  }
}

(async () => {
  const list = [...urls.keys()];
  const results = [];
  for (let i = 0; i < list.length; i += 6) {
    results.push(...await Promise.all(list.slice(i, i + 6).map(check)));
  }
  let bad = 0;
  for (const r of results) {
    const ok = typeof r.status === 'number' && r.status < 400;
    // 403/429 suelen ser bloqueo anti-bot, no enlace roto: revisalos a mano.
    const soft = r.status === 403 || r.status === 429;
    if (!ok) bad++;
    console.log(`${ok ? 'OK   ' : soft ? 'REVISAR' : 'FALLA '} ${r.status} ${r.url}${r.final !== r.url && ok ? ' -> ' + r.final : ''}${ok ? '' : ' (' + r.final + ')'}`);
  }
  console.log(`\n${results.length} enlaces, ${bad} con problemas.`);
  process.exit(bad ? 1 : 0);
})();
