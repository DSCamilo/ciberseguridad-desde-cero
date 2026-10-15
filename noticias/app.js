// Página de noticias: lee datos.json (lo genera tools/actualizar-noticias.js) y lo muestra con filtros.
// Todo el contenido externo se inserta con textContent: nunca como HTML.
(function () {
  const $ = id => document.getElementById(id);
  const lista = $('lista'), estado = $('estado');
  const POR_PAGINA = 12;
  let fuentes = new Map(), items = [], pagina = paginaDesdeUrl();

  const fmt = new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'America/Bogota' });
  const idiomaTxt = { es: 'Español', en: 'Inglés' };
  // Una fecha inválida no debe romper la página.
  function fechaTxt(s) { const d = new Date(s); return isNaN(d) ? '' : fmt.format(d); }

  function enlaceSeguro(u) {
    try { const x = new URL(u); return x.protocol === 'https:' ? x.href : null; } catch (e) { return null; }
  }
  function el(tag, cls, txt) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (txt != null) n.textContent = txt;
    return n;
  }
  function normalizar(s) { return String(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''); }

  function tarjeta(i) {
    const f = fuentes.get(i.fuente);
    const li = el('li', 'nota');
    const cuerpo = el('div', 'cuerpo');
    const meta = el('div', 'meta');
    meta.append(el('span', 'fuente', f ? f.nombre : i.fuente));
    const t = el('time', null, fechaTxt(i.fecha));
    t.dateTime = i.fecha;
    meta.append(t);
    if (f) {
      meta.append(el('span', 'etiqueta', idiomaTxt[f.idioma] || f.idioma));
      if (f.tipo === 'avisos') meta.append(el('span', 'etiqueta aviso-tipo', 'Aviso'));
    }
    const a = el('a', 'titulo', i.titulo);
    a.href = enlaceSeguro(i.url) || '#';
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.append(' ', icono('external-link', 'externo'));
    a.title = 'Se abre en una pestaña nueva';
    cuerpo.append(meta, a);
    li.append(crearIlustracion(f, i.titulo), cuerpo);
    return li;
  }

  function pintar() {
    const q = normalizar($('q').value.trim());
    const idioma = $('idioma').value, tipo = $('tipo').value, fuente = $('fuente').value;
    const vis = items.filter(i => {
      const f = fuentes.get(i.fuente);
      if (idioma && (!f || f.idioma !== idioma)) return false;
      if (tipo && (!f || f.tipo !== tipo)) return false;
      if (fuente && i.fuente !== fuente) return false;
      if (q && !normalizar(i.titulo).includes(q)) return false;
      return true;
    });
    const paginas = Math.max(1, Math.ceil(vis.length / POR_PAGINA));
    pagina = Math.min(Math.max(1, pagina), paginas);
    const desde = (pagina - 1) * POR_PAGINA;
    lista.replaceChildren(...vis.slice(desde, desde + POR_PAGINA).map(tarjeta));
    estado.textContent = vis.length
      ? 'Mostrando ' + (desde + 1) + ' a ' + Math.min(desde + POR_PAGINA, vis.length) + ' de ' + vis.length + ' noticias' + (vis.length !== items.length ? ' (filtradas de ' + items.length + ')' : '') + '.'
      : 'No hay noticias con esos filtros. Probá quitar alguno.';
    pintarPaginacion(paginas);
  }

  // Página guardada en la dirección (#pagina-3) para poder compartir o recargar.
  function paginaDesdeUrl() {
    const m = /^#pagina-(\d{1,3})$/.exec(location.hash);
    return m ? parseInt(m[1], 10) : 1;
  }
  function irA(n) {
    pagina = n;
    history.replaceState(null, '', n > 1 ? '#pagina-' + n : location.pathname + location.search);
    pintar();
    estado.focus({ preventScroll: true });
    window.scrollTo({ top: Math.max(0, estado.getBoundingClientRect().top + window.scrollY - 90), behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  }
  // Muestra siempre la primera, la última y la actual con sus vecinas; el resto se resume con "…".
  function numerosVisibles(total) {
    const set = new Set([1, total, pagina - 1, pagina, pagina + 1]);
    const nums = [...set].filter(n => n >= 1 && n <= total).sort((a, b) => a - b);
    const out = [];
    nums.forEach((n, i) => { if (i && n - nums[i - 1] > 1) out.push('…'); out.push(n); });
    return out;
  }
  function boton(texto, n, opts = {}) {
    const b = el('button', 'pag');
    b.type = 'button';
    if (opts.icono) { opts.antes ? b.append(icono(opts.icono), ' ', texto) : b.append(texto, ' ', icono(opts.icono)); } else b.textContent = texto;
    if (opts.etiqueta) b.setAttribute('aria-label', opts.etiqueta);
    if (opts.actual) b.setAttribute('aria-current', 'page');
    if (opts.deshabilitado) b.disabled = true; else b.addEventListener('click', () => irA(n));
    return b;
  }
  function pintarPaginacion(total) {
    const nav = $('paginacion');
    if (total <= 1) { nav.hidden = true; nav.replaceChildren(); return; }
    const partes = [boton('Anterior', pagina - 1, { icono: 'arrow-left', antes: true, deshabilitado: pagina === 1, etiqueta: 'Página anterior' })];
    for (const n of numerosVisibles(total)) {
      if (n === '…') partes.push(el('span', 'pag-puntos', '…'));
      else partes.push(boton(String(n), n, { actual: n === pagina, etiqueta: 'Página ' + n + (n === pagina ? ' (actual)' : '') }));
    }
    partes.push(boton('Siguiente', pagina + 1, { icono: 'arrow-right', deshabilitado: pagina === total, etiqueta: 'Página siguiente' }));
    nav.replaceChildren(...partes);
    nav.hidden = false;
  }

  function listaFuentes(datos) {
    const ul = $('fuentes-lista');
    for (const f of datos.fuentes) {
      const li = el('li');
      const href = enlaceSeguro(f.sitio);
      if (href) {
        const a = el('a', null, f.nombre);
        a.href = href; a.target = '_blank'; a.rel = 'noopener noreferrer';
        li.append(a);
      } else li.append(f.nombre);
      li.append(' ', el('span', 'idioma', '· ' + (idiomaTxt[f.idioma] || f.idioma)));
      ul.append(li);
    }
    $('fuentes').hidden = false;
  }

  // Si cambia solo el #pagina-N (por ejemplo al pegar otro enlace con la página abierta), se sigue la dirección.
  window.addEventListener('hashchange', () => { if (!items.length) return; pagina = paginaDesdeUrl(); pintar(); });

  fetch('datos.json', { cache: 'no-cache' })
    .then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
    .then(datos => {
      fuentes = new Map(datos.fuentes.map(f => [f.id, f]));
      items = (Array.isArray(datos.items) ? datos.items : []).filter(i => i && typeof i.titulo === 'string' && enlaceSeguro(i.url) && fechaTxt(i.fecha));
      const sel = $('fuente');
      for (const f of datos.fuentes) sel.append(new Option(f.nombre, f.id));
      listaFuentes(datos);
      $('actualizado').textContent = 'Última actualización: ' + fechaTxt(datos.actualizado);
      document.querySelector('.filtros').hidden = false;
      for (const id of ['q', 'idioma', 'tipo', 'fuente']) $(id).addEventListener(id === 'q' ? 'input' : 'change', () => { pagina = 1; history.replaceState(null, '', location.pathname + location.search); pintar(); });
      pintar();
    })
    .catch(() => { estado.textContent = 'No pudimos cargar las noticias ahora. Intentá de nuevo en unos minutos.'; });
})();
