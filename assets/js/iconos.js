// Iconos de Lucide (ISC) desde el sprite local assets/icons/sprite.svg. No descarga nada de terceros.
// icono('bug') devuelve un <svg>; iconoHtml('bug') devuelve el mismo icono como texto para plantillas.
(function () {
  const NS = 'http://www.w3.org/2000/svg';
  const SPRITE = new URL('../icons/sprite.svg', document.currentScript.src).href;
  window.iconoUrl = nombre => SPRITE + '#' + nombre;
  window.icono = function (nombre, clase) {
    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('class', 'icono' + (clase ? ' ' + clase : ''));
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('focusable', 'false');
    const u = document.createElementNS(NS, 'use');
    u.setAttribute('href', SPRITE + '#' + nombre);
    svg.append(u);
    return svg;
  };
  window.iconoHtml = function (nombre, clase) {
    return '<svg class="icono' + (clase ? ' ' + clase : '') + '" aria-hidden="true" focusable="false"><use href="' + SPRITE + '#' + nombre + '"></use></svg>';
  };
})();
