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
   * Slots of the /scena page, one per frame: the characters, then the Storyteller last.
   * Each rectangle is the webcam inside a frame, 16:9 like a webcam; the frame's bands add
   * about 45 px above it (name) and 70 px below it (trackers) on a 1920×1080 canvas.
   * Layouts: 'grid' (all alike, biggest tiles), 'stage' (the Storyteller large on top, the
   * players in a row below), 'sides' (players in columns left and right, the Storyteller at
   * the top centre, the middle left free for the background). Everything is worked out on a
   * 1920×1080 canvas and scaled to `width` (2560 for 2K). With `rollBox`, the bottom centre
   * is kept for the roll box.
   */
  sceneLayout(n, { layout = 'grid', width = 1920, rollBox = false } = {}) {
    const W = 1920;
    const H = 1080;
    const k = width / W;
    const ratio = 16 / 9;
    const bottom = rollBox ? 150 : 0;
    // Best-fitting grid of `count` tiles in a box that includes the frames' bands.
    const grid = (count, box) => {
      const bandTop = 50;
      const bandBottom = 75;
      const gapX = 40;
      const gapY = 135;
      let best = { cols: 1, rows: 1, w: 0, h: 0 };
      for (let cols = 1; cols <= Math.max(1, count); cols++) {
        const rows = Math.ceil(count / cols);
        const maxW = (box.w - (cols - 1) * gapX) / cols;
        const maxH = (box.h - bandTop - bandBottom - (rows - 1) * gapY) / rows;
        const w = Math.floor(Math.min(maxW, maxH * ratio, box.maxW || Infinity));
        if (w > best.w) best = { cols, rows, w, h: Math.floor(w / ratio) };
      }
      const { cols, rows, w, h } = best;
      const gridH = rows * h + (rows - 1) * gapY;
      const y0 = box.y + bandTop + Math.floor((box.h - bandTop - bandBottom - gridH) / 2);
      return Array.from({ length: count }, (_, i) => {
        const row = Math.floor(i / cols);
        const inRow = Math.min(cols, count - row * cols);
        const rowW = inRow * w + (inRow - 1) * gapX;
        const x0 = box.x + Math.floor((box.w - rowW) / 2);
        return { x: x0 + (i % cols) * (w + gapX), y: y0 + row * (h + gapY), w, h };
      });
    };
    const area = { x: 30, y: 10, w: W - 60, h: H - 10 - Math.max(bottom, 10) };
    const players = Math.max(0, n - 1);
    let slots;
    if (layout === 'stage' && players > 0) {
      const top = Math.floor(area.h * 0.56);
      slots = [
        ...grid(players, { x: area.x, y: area.y + top, w: area.w, h: area.h - top, maxW: 420 }),
        ...grid(1, { x: area.x, y: area.y, w: area.w, h: top }),
      ];
    } else if (layout === 'sides' && players > 0) {
      const colW = Math.floor(area.w * 0.26);
      const left = Math.ceil(players / 2);
      const full = { y: 10, h: H - 20 };
      slots = [
        ...grid(left, { x: area.x, ...full, w: colW }),
        ...grid(players - left, { x: area.x + area.w - colW, ...full, w: colW }),
        ...grid(1, {
          x: area.x + colW + 40,
          y: area.y,
          w: area.w - 2 * colW - 80,
          h: area.h * 0.6,
        }),
      ];
    } else {
      slots = grid(Math.max(1, n), area);
    }
    const round = (r) => ({
      x: Math.round(r.x * k),
      y: Math.round(r.y * k),
      w: Math.round(r.w * k),
      h: Math.round(r.h * k),
    });
    return slots.slice(0, n).map(round);
  },
  /** The roll box at the bottom centre of the scene, scaled like the slots. */
  rollBoxRect(width = 1920) {
    const k = width / 1920;
    const w = 860;
    const h = 120;
    return {
      x: Math.round(((1920 - w) / 2) * k),
      y: Math.round((1080 - h - 18) * k),
      w: Math.round(w * k),
      h: Math.round(h * k),
    };
  },
  /**
   * The bands of a frame around its webcam, in px of the scene (1 cqw = width / 100): the
   * name above (2.3 cqw), the trackers below (3.7 cqw), a thin edge on the sides.
   */
  frameBands(width = 1920) {
    const cqw = width / 100;
    return { top: 2.3 * cqw, side: 0.55 * cqw, bottom: 3.7 * cqw };
  },
  /**
   * A saved layout (cells of a cols × rows grid, each box the whole frame) as webcam
   * rectangles in px, like sceneLayout: players in Chronicle order (those without a box, or
   * hidden, get null), then the Storyteller; and the roll box (null when hidden).
   */
  customSlots(items, players, { width = 1920, height = 1080, cols = 32, rows = 18 } = {}) {
    const cw = width / cols;
    const ch = height / rows;
    const b = window.ELDER.frameBands(width);
    // A thin gap inside each box, so frames in neighbouring cells don't touch.
    const gap = (0.3 * width) / 100;
    const outer = (box) => ({
      x: Math.round(box.x * cw + gap),
      y: Math.round(box.y * ch + gap),
      w: Math.round(box.w * cw - 2 * gap),
      h: Math.round(box.h * ch - 2 * gap),
    });
    const cam = (box) => {
      if (!box || box.hidden) return null;
      const r = outer(box);
      return {
        x: Math.round(r.x + b.side),
        y: Math.round(r.y + b.top),
        w: Math.max(1, Math.round(r.w - 2 * b.side)),
        h: Math.max(1, Math.round(r.h - b.top - b.bottom)),
      };
    };
    const frames = Array.from({ length: players }, (_, i) => cam(items.players[i]));
    frames.push(cam(items.storyteller));
    return { frames, roll: items.roll.hidden ? null : outer(items.roll) };
  },
  /**
   * One of the automatic layouts as a starting point for the editor: each frame's whole box
   * (webcam plus bands) snapped to the cells of the grid, on a 1920×1080 scene.
   */
  presetItems(players, layout, { cols = 32, rows = 18 } = {}) {
    const E = window.ELDER;
    const W = 1920;
    const H = 1080;
    const cw = W / cols;
    const ch = H / rows;
    const b = E.frameBands(W);
    const slots = E.sceneLayout(players + 1, { layout, width: W, rollBox: true });
    // Edges snap to the nearest grid line, so neighbours share a line instead of overlapping.
    const snap = (r) => {
      const x = Math.max(0, Math.min(cols - 2, Math.round(r.x / cw)));
      const y = Math.max(0, Math.min(rows - 2, Math.round(r.y / ch)));
      const right = Math.min(cols, Math.round((r.x + r.w) / cw));
      const bottom = Math.min(rows, Math.round((r.y + r.h) / ch));
      return { x, y, w: Math.max(2, right - x), h: Math.max(2, bottom - y) };
    };
    const outer = (s) => ({
      x: s.x - b.side,
      y: s.y - b.top,
      w: s.w + 2 * b.side,
      h: s.h + b.top + b.bottom,
    });
    return {
      players: slots.slice(0, players).map((s) => snap(outer(s))),
      storyteller: snap(outer(slots[players])),
      roll: snap(E.rollBoxRect(W)),
    };
  },
  /** OBS's view of a VDO.Ninja webcam: no buttons, no sound (voices stay on Discord). */
  camUrl(id) {
    return `https://vdo.ninja/?view=${encodeURIComponent(id)}&cleanoutput&cover&noaudio&transparent`;
  },
  /** el('div', 'a b', child, 'text') builds an element; strings become text nodes, never HTML. */
  el(tag, cls, ...children) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    for (const c of children) if (c !== null && c !== undefined) e.append(c);
    return e;
  },
};
