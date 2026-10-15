// Adelanto de noticias en la landing: 2 en español y 2 en inglés, tomadas de noticias/datos.json.
// El contenido externo se inserta con textContent, nunca como HTML.
(function () {
  const ul = document.getElementById('news-preview');
  if (!ul) return;
  const fmt = new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'short', timeZone: 'America/Bogota' });
  const seguro = u => { try { const x = new URL(u); return x.protocol === 'https:' ? x.href : null; } catch (e) { return null; } };

  fetch('noticias/datos.json')
    .then(r => { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then(d => {
      const fuentes = new Map(d.fuentes.map(f => [f.id, f]));
      const validas = d.items.filter(i => i && typeof i.titulo === 'string' && seguro(i.url) && !isNaN(new Date(i.fecha)) && fuentes.get(i.fuente) && fuentes.get(i.fuente).tipo === 'noticias');
      const pick = idioma => validas.filter(i => fuentes.get(i.fuente).idioma === idioma).slice(0, 2);
      const elegidas = [...pick('es'), ...pick('en')].sort((a, b) => b.fecha.localeCompare(a.fecha));
      if (!elegidas.length) throw new Error('sin noticias');
      ul.replaceChildren(...elegidas.map(i => {
        const li = document.createElement('li');
        li.className = 'news-card';
        const meta = document.createElement('span');
        meta.className = 'mono';
        meta.textContent = fuentes.get(i.fuente).nombre + ' · ' + fmt.format(new Date(i.fecha));
        const a = document.createElement('a');
        a.href = seguro(i.url); a.target = '_blank'; a.rel = 'noopener noreferrer';
        a.textContent = i.titulo;
        li.append(crearIlustracion(fuentes.get(i.fuente), i.titulo), meta, a);
        return li;
      }));
    })
    .catch(() => {
      const li = document.createElement('li');
      li.className = 'news-vacio';
      li.append('No pudimos cargar las noticias ahora. ');
      const a = document.createElement('a'); a.href = 'noticias/'; a.textContent = 'Probá en la página de noticias.';
      li.append(a);
      ul.replaceChildren(li);
    });
})();
