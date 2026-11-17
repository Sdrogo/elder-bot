/* global window, document */
// Shared by the frame and the dock: clan and sect names, colours, and a tiny DOM helper.
'use strict';

window.ELDER = {
  CLANS: {
    banuhaqim: { name: 'Banu Haqim', hue: '#2f8f83' },
    brujah: { name: 'Brujah', hue: '#c0262d' },
    gangrel: { name: 'Gangrel', hue: '#b0702a' },
    hecata: { name: 'Hecata', hue: '#7f8c8d' },
    lasombra: { name: 'Lasombra', hue: '#5a4f8a' },
    malkavian: { name: 'Malkavian', hue: '#6f9c3d' },
    ministry: { name: 'Ministry', hue: '#c99a2e' },
    nosferatu: { name: 'Nosferatu', hue: '#6b7b5a' },
    ravnos: { name: 'Ravnos', hue: '#b4532a' },
    salubri: { name: 'Salubri', hue: '#d2b45a' },
    toreador: { name: 'Toreador', hue: '#b3446c' },
    tremere: { name: 'Tremere', hue: '#7d4ab0' },
    tzimisce: { name: 'Tzimisce', hue: '#6d3b5e' },
    ventrue: { name: 'Ventrue', hue: '#3d63b0' },
    caitiff: { name: 'Caitiff', hue: '#8a8580' },
    thinblood: { name: 'Thin-blood', hue: '#a8a29a' },
  },
  SECTS: {
    camarilla: 'Camarilla',
    'camarilla-v5': 'Camarilla',
    anarch: 'Anarch',
    sabbat: 'Sabbat',
    none: '',
  },
  /** el('div', 'a b', child, 'text') builds an element; strings become text nodes, never HTML. */
  el(tag, cls, ...children) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    for (const c of children) if (c !== null && c !== undefined) e.append(c);
    return e;
  },
};
