// Ilustración propia para cada noticia: color y siglas de la fuente + un icono según el tema del titular.
// Se dibuja en el navegador con SVG y los iconos de Lucide del sprite local (assets/js/iconos.js).
// No descarga imágenes de ningún sitio externo.
(function () {
  // Primera coincidencia gana. Se compara sobre el título en minúsculas y sin acentos.
  const TEMAS = [
    ['lock', /ransom|cifrad|encrypt|extors|lockbit/],
    ['mail', /phish|estaf|scam|fraud|enga[nñ]|smish|vishing|spam|correo/],
    ['key-round', /passw|contrase|credential|credencial|passkey|\b2fa\b|\bmfa\b|login/],
    ['eye', /privacy|privacidad|spyware|espion|vigilan|surveil|tracking|rastre/],
    ['cpu', /\bai\b|\bia\b|inteligencia artificial|\bllm\b|openai|chatgpt|gpt-|anthropic|copilot|gemini|firmware|kernel/],
    ['bug', /vulnerab|cve-|exploit|zero-day|0-day|\brce\b|patch|parche|\bbug\b|flaw|malware|backdoor|botnet|trojan|troyano|virus|rootkit|stealer/],
  ];
  // Color (matiz HSL) y siglas por fuente; si aparece una fuente nueva se calcula a partir de su id.
  const FUENTES = {
    cisa: [215, 'CISA'], 'incibe-avisos': [8, 'INCIBE'], 'incibe-blog': [28, 'INCIBE'], hispasec: [150, 'UAD'],
    welivesecurity: [165, 'ESET'], 'segu-info': [262, 'SEGU'], thehackernews: [345, 'THN'], bleepingcomputer: [198, 'BC'],
    krebs: [95, 'KREBS'], 'sans-isc': [48, 'SANS'], schneier: [285, 'SCHNEIER'],
  };
  function hash(s) { let h = 0; for (const c of String(s)) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h; }
  function sinAcentos(s) { return String(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''); }

  function iconoPara(fuente, titulo) {
    if (fuente && fuente.tipo === 'avisos') return 'triangle-alert';
    const t = sinAcentos(titulo);
    const hit = TEMAS.find(([, re]) => re.test(t));
    return hit ? hit[0] : 'shield-check';
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

    const svg = icono(iconoPara(fuente, titulo));
    const sig = document.createElement('span');
    sig.className = 'sigla';
    sig.textContent = siglas;
    box.append(svg, sig);
    return box;
  };
})();
