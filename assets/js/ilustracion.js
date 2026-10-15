// Ilustración propia para cada noticia: color y siglas de la fuente + un icono según el tema del titular.
// Se dibuja en el navegador con SVG; no descarga imágenes de ningún sitio externo.
(function () {
  const NS = 'http://www.w3.org/2000/svg';

  // Iconos de trazo simple (24x24), dibujados para este sitio.
  const ICONOS = {
    escudo: 'M12 3l7 3v5c0 5-3 8-7 10-4-2-7-5-7-10V6z M9 12l2 2 4-4',
    candado: 'M7 11V8a5 5 0 0110 0v3 M5 11h14v9H5z M12 15v2',
    sobre: 'M4 6h16v12H4z M4 7l8 6 8-6',
    llave: 'M8 11.5a3.5 3.5 0 100 7 3.5 3.5 0 000-7z M10.5 13L20 3.5 M16.5 7l2.5 2.5 M13.5 10l2 2',
    ojo: 'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z M12 9a3 3 0 100 6 3 3 0 000-6z',
    chip: 'M7 7h10v10H7z M9 3v4 M15 3v4 M9 17v4 M15 17v4 M3 9h4 M3 15h4 M17 9h4 M17 15h4',
    bicho: 'M9 8a3 3 0 016 0v1H9z M8 9h8v6a4 4 0 01-8 0z M4 11h4 M16 11h4 M4 17h4 M16 17h4 M12 9v10',
    alerta: 'M12 3l10 18H2z M12 10v5 M12 18v.5',
  };
  // Primera coincidencia gana. Se compara sobre el título en minúsculas y sin acentos.
  const TEMAS = [
    ['candado', /ransom|cifrad|encrypt|extors|lockbit/],
    ['sobre', /phish|estaf|scam|fraud|enga[nñ]|smish|vishing|spam|correo/],
    ['llave', /passw|contrase|credential|credencial|passkey|\b2fa\b|\bmfa\b|login/],
    ['ojo', /privacy|privacidad|spyware|espion|vigilan|surveil|tracking|rastre/],
    ['chip', /\bai\b|\bia\b|inteligencia artificial|\bllm\b|openai|chatgpt|gpt-|anthropic|copilot|gemini|firmware|kernel/],
    ['bicho', /vulnerab|cve-|exploit|zero-day|0-day|\brce\b|patch|parche|\bbug\b|flaw|malware|backdoor|botnet|trojan|troyano|virus|rootkit|stealer/],
  ];
  // Color (matiz HSL) y siglas por fuente; si aparece una fuente nueva se calcula a partir de su id.
  const FUENTES = {
    cisa: [215, 'CISA'], 'incibe-avisos': [8, 'INCIBE'], 'incibe-blog': [28, 'INCIBE'], hispasec: [150, 'UAD'],
    welivesecurity: [165, 'ESET'], 'segu-info': [262, 'SEGU'], thehackernews: [345, 'THN'], bleepingcomputer: [198, 'BC'],
    krebs: [95, 'KREBS'], 'sans-isc': [48, 'SANS'], schneier: [285, 'SCHNEIER'],
  };
  function hash(s) { let h = 0; for (const c of String(s)) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h; }
  function sinAcentos(s) { return String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); }

  function iconoPara(fuente, titulo) {
    if (fuente && fuente.tipo === 'avisos') return 'alerta';
    const t = sinAcentos(titulo);
    const hit = TEMAS.find(([, re]) => re.test(t));
    return hit ? hit[0] : 'escudo';
  }

  // Devuelve un <div class="ilus"> decorativo para la fuente y el titular dados.
  window.crearIlustracion = function (fuente, titulo) {
    const id = fuente ? fuente.id : '';
    const def = FUENTES[id];
    const matiz = def ? def[0] : hash(id || titulo) % 360;
    const siglas = def ? def[1] : String((fuente && fuente.nombre) || '?').replace(/[^A-Za-z0-9]/g, '').slice(0, 5).toUpperCase();

    const box = document.createElement('div');
    box.className = 'ilus';
    box.setAttribute('aria-hidden', 'true');
    box.style.setProperty('--h', String(matiz));

    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('focusable', 'false');
    for (const d of ICONOS[iconoPara(fuente, titulo)].split(' M').map((p, i) => (i ? 'M' + p : p))) {
      const p = document.createElementNS(NS, 'path');
      p.setAttribute('d', d);
      svg.append(p);
    }
    const sig = document.createElement('span');
    sig.className = 'sigla';
    sig.textContent = siglas;
    box.append(svg, sig);
    return box;
  };
})();
