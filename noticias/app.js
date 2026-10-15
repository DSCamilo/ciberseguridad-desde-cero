// Página de noticias: lee datos.json (lo genera tools/actualizar-noticias.js) y lo muestra con filtros.
// Todo el contenido externo se inserta con textContent: nunca como HTML.
(function () {
  const $ = id => document.getElementById(id);
  const lista = $('lista'), estado = $('estado');
  let fuentes = new Map(), items = [];

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
    lista.replaceChildren(...vis.map(tarjeta));
    estado.textContent = vis.length
      ? 'Mostrando ' + vis.length + ' de ' + items.length + ' noticias.'
      : 'No hay noticias con esos filtros. Probá quitar alguno.';
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
      for (const id of ['q', 'idioma', 'tipo', 'fuente']) $(id).addEventListener(id === 'q' ? 'input' : 'change', pintar);
      pintar();
    })
    .catch(() => { estado.textContent = 'No pudimos cargar las noticias ahora. Intentá de nuevo en unos minutos.'; });
})();
