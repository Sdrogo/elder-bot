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
   * the Storyteller). Each rectangle is where a webcam crop goes in OBS, so it keeps the
   * 16:9 shape of a Discord webcam tile. Picks the column count that gives the biggest
   * tiles, centres the grid, and centres a last row that is not full. The name and Hunger
   * plates stick out above each tile, so rows leave room for them.
   */
  sceneLayout(n) {
    const W = 1920;
    const H = 1080;
    const top = 60;
    const side = 30;
    const bottom = 30;
    const gapX = 40;
    const gapY = 70;
    const ratio = 16 / 9;
    const count = Math.max(1, n);
    let best = { cols: 1, rows: 1, w: 0, h: 0 };
    for (let cols = 1; cols <= count; cols++) {
      const rows = Math.ceil(count / cols);
      const maxW = (W - 2 * side - (cols - 1) * gapX) / cols;
      const maxH = (H - top - bottom - (rows - 1) * gapY) / rows;
      const w = Math.floor(Math.min(maxW, maxH * ratio));
      if (w > best.w) best = { cols, rows, w, h: Math.floor(w / ratio) };
    }
    const { cols, rows, w, h } = best;
    const gridH = rows * h + (rows - 1) * gapY;
    const y0 = top + Math.floor((H - top - bottom - gridH) / 2);
    return Array.from({ length: n }, (_, i) => {
      const row = Math.floor(i / cols);
      const inRow = Math.min(cols, n - row * cols);
      const rowW = inRow * w + (inRow - 1) * gapX;
      const x0 = Math.floor((W - rowW) / 2);
      return { x: x0 + (i % cols) * (w + gapX), y: y0 + row * (h + gapY), w, h };
    });
  },
  /** el('div', 'a b', child, 'text') builds an element; strings become text nodes, never HTML. */
  el(tag, cls, ...children) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    for (const c of children) if (c !== null && c !== undefined) e.append(c);
    return e;
  },
};
