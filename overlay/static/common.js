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
  /**
   * Fixed slots of the /scena page on a 1920×1080 canvas, one per frame (characters, then
   * the Storyteller). Each rectangle is where the webcam crop goes in OBS; the name and
   * Hunger plates stick out above it, so rows leave room for them.
   */
  sceneLayout(n) {
    const W = 1920;
    const H = 1080;
    const top = 60;
    const side = 30;
    const bottom = 30;
    const gapX = 40;
    const gapY = 70;
    const cols = n <= 4 ? 2 : 3;
    const rows = Math.max(1, Math.ceil(n / cols));
    const w = Math.floor((W - 2 * side - (cols - 1) * gapX) / cols);
    const h = Math.floor((H - top - bottom - (rows - 1) * gapY) / rows);
    return Array.from({ length: n }, (_, i) => ({
      x: side + (i % cols) * (w + gapX),
      y: top + Math.floor(i / cols) * (h + gapY),
      w,
      h,
    }));
  },
  /** el('div', 'a b', child, 'text') builds an element; strings become text nodes, never HTML. */
  el(tag, cls, ...children) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    for (const c of children) if (c !== null && c !== undefined) e.append(c);
    return e;
  },
};
