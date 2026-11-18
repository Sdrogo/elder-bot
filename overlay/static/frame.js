/* global window, document, EventSource, Image, URLSearchParams, setTimeout */
// OBS Browser Source. /scena draws every frame on one fixed 1920×1080 page;
// /frame?pg=<id> (or ?pg=storyteller) draws a single frame that fills the source.
'use strict';

const { CLANS, SECTS, el, sceneLayout } = window.ELDER;
const sceneMode = window.location.pathname === '/scena';
const params = new URLSearchParams(window.location.search);
const pg = params.get('pg') || '';
// Numbers by default; ?stile=caselle draws the boxes of the character sheet instead.
const boxStyle = params.get('stile') === 'caselle';
// ?scala=1.2 makes plates and numbers bigger; the frame always fills the Browser Source.
const scale = Number(params.get('scala'));
if (scale >= 0.3 && scale <= 3)
  document.documentElement.style.setProperty('--scale', String(scale));
const root = document.getElementById('root');
const SVG = 'http://www.w3.org/2000/svg';

let prev = null;
const symbolOk = new Map();

function symbol(key, frame) {
  const i = el('i', 'sym');
  i.hidden = true;
  i.style.setProperty('--m', `url("/symbols/${key}.png")`);
  const show = () => (i.hidden = false);
  if (symbolOk.get(key) === true) show();
  else if (!symbolOk.has(key)) {
    // Only show the symbol once the PNG exists; otherwise the plate just has the name.
    const img = new Image();
    img.onload = () => {
      symbolOk.set(key, true);
      frame.querySelectorAll('.sym').forEach((s) => (s.hidden = false));
    };
    img.onerror = () => symbolOk.set(key, false);
    img.src = `/symbols/${key}.png`;
  }
  return i;
}

function d10(on, number) {
  const svg = document.createElementNS(SVG, 'svg');
  svg.setAttribute('viewBox', '0 0 40 46');
  svg.setAttribute('class', on ? 'hd on' : 'hd');
  const shapes = [
    ['polygon', 'o', 'points', '20,1.5 38.5,18 20,44.5 1.5,18'],
    ['polygon', 'i', 'points', '20,1.5 29,22 20,32 11,22'],
    ['path', 'l', 'd', 'M1.5,18 L11,22 M38.5,18 L29,22 M20,44.5 L20,32'],
  ];
  for (const [tag, cls, attr, value] of shapes) {
    const s = document.createElementNS(SVG, tag);
    s.setAttribute('class', cls);
    s.setAttribute(attr, value);
    svg.append(s);
  }
  if (number !== undefined) {
    const t = document.createElementNS(SVG, 'text');
    t.setAttribute('x', '20');
    t.setAttribute('y', '26');
    t.setAttribute('text-anchor', 'middle');
    t.setAttribute('dominant-baseline', 'middle');
    t.textContent = String(number);
    svg.append(t);
    svg.classList.add('big');
  }
  return svg;
}

/** Box classes for each tracker, left to right. */
function boxClasses(c) {
  const health = [];
  const usable = c.health.max - c.health.baneful;
  for (let i = 0; i < c.health.max; i++) {
    health.push(i >= usable ? 'bane' : i < c.health.current ? 'on' : '');
  }
  const fill = (t) => Array.from({ length: t.max }, (_, i) => (i < t.current ? 'on' : ''));
  const humanity = Array.from({ length: 10 }, (_, i) =>
    i < c.humanity.rank ? 'on' : i >= 10 - c.humanity.violations ? 'viol' : '',
  );
  const hunger = Array.from({ length: 5 }, (_, i) => (i < c.hunger ? 'on' : ''));
  return { health, vitae: fill(c.vitae), willpower: fill(c.willpower), humanity, hunger };
}

function track(kind, label, classes, before) {
  const boxes = el('div', 'boxes');
  classes.forEach((cls, i) => {
    const hot = before && before[i] !== cls ? ' hot' : '';
    boxes.append(el('i', `b ${cls}${hot}`));
  });
  return el('div', `trk ${kind}`, el('span', '', label), boxes);
}

function numberCell(kind, label, current, max, note, hot) {
  const value = el('span', 'nv', String(current));
  if (max !== null) value.append(el('small', '', `/${max}`));
  return el(
    'div',
    `nb ${kind}${hot ? ' hot' : ''}`,
    el('span', 'nl', label),
    value,
    el('span', 'nx', note),
  );
}

function numbers(c, b) {
  const h = c.health;
  const usable = h.max - h.baneful;
  const v = c.humanity.violations;
  return el(
    'div',
    'rail num',
    numberCell(
      'health',
      'Health',
      h.current,
      usable,
      h.baneful ? `\u2715${h.baneful} baneful` : '',
      b &&
        (b.health.current !== h.current ||
          b.health.baneful !== h.baneful ||
          b.health.max !== h.max),
    ),
    numberCell(
      'willpower',
      'Willpower',
      c.willpower.current,
      c.willpower.max,
      '',
      b && (b.willpower.current !== c.willpower.current || b.willpower.max !== c.willpower.max),
    ),
    numberCell(
      'vitae',
      'Vitae',
      c.vitae.current,
      c.vitae.max,
      '',
      b && (b.vitae.current !== c.vitae.current || b.vitae.max !== c.vitae.max),
    ),
    numberCell(
      'humanity',
      'Humanity',
      c.humanity.rank,
      null,
      v ? `\u2715${v} violation${v > 1 ? 's' : ''}` : '',
      b && (b.humanity.rank !== c.humanity.rank || b.humanity.violations !== v),
    ),
  );
}

const corners = () => ['tl', 'tr', 'bl', 'br'].map((p) => el('i', `corner ${p}`));

function changes(a, b) {
  if (!a || !b) return [];
  const out = [];
  const diff = (before, after, label) => {
    if (before !== after)
      out.push(`${after > before ? '+' : '−'}${Math.abs(after - before)} ${label}`);
  };
  diff(a.health.current, b.health.current, 'Health');
  diff(a.health.baneful, b.health.baneful, 'baneful');
  diff(a.vitae.current, b.vitae.current, 'Vitae');
  diff(a.willpower.current, b.willpower.current, 'Willpower');
  diff(a.humanity.rank, b.humanity.rank, 'Humanity');
  diff(a.humanity.violations, b.humanity.violations, 'violation');
  diff(a.hunger, b.hunger, 'Hunger');
  return out;
}

function toast(frame, text) {
  if (!text) return;
  const t = el('div', 'toast', text);
  frame.append(t);
  window.requestAnimationFrame(() => t.classList.add('show'));
  setTimeout(() => t.classList.remove('show'), 2600);
}

function renderCharacter(c, before) {
  const frame = el('div', 'frame');
  frame.style.setProperty('--clan', (CLANS[c.clan] || CLANS.caitiff).hue);
  const now = boxClasses(c);
  const old = before ? boxClasses(before) : null;
  const plate = el(
    'div',
    'plate',
    symbol(c.clan, frame),
    el('span', 'nm', c.name),
    el('span', 'cl', (CLANS[c.clan] || CLANS.caitiff).name),
  );
  const dice = el('div', 'hunger', el('span', 't', 'Hunger'));
  if (boxStyle) {
    now.hunger.forEach((cls, i) => {
      const die = d10(cls === 'on');
      if (old && old.hunger[i] !== cls) die.classList.add('hot');
      dice.append(die);
    });
  } else {
    const die = d10(c.hunger > 0, c.hunger);
    if (before && before.hunger !== c.hunger) die.classList.add('hot');
    dice.append(die);
  }
  const rail = boxStyle
    ? el(
        'div',
        'rail',
        track('health', 'Health', now.health, old && old.health),
        track('willpower', 'Willpower', now.willpower, old && old.willpower),
        track('vitae', 'Vitae', now.vitae, old && old.vitae),
        track('humanity', 'Humanity', now.humanity, old && old.humanity),
      )
    : numbers(c, before);
  frame.append(...corners(), plate, dice, rail);
  toast(frame, changes(before, c)[0]);
  return frame;
}

function renderStoryteller(chronicle, before) {
  const frame = el('div', 'frame st');
  frame.style.setProperty('--clan', 'var(--gold)');
  const plate = el('div', 'plate', el('span', 'nm', 'Storyteller'));
  if (chronicle.sect !== 'none') {
    plate.prepend(symbol(chronicle.sect, frame));
    plate.append(el('span', 'cl', SECTS[chronicle.sect] || ''));
  }
  const bar = el('div', 'masqbar');
  for (let i = 0; i < 10; i++) {
    const was = before ? i < before.masquerade : null;
    const on = i < chronicle.masquerade;
    bar.append(el('i', `seg${on ? ' on' : ''}${was !== null && was !== on ? ' hot' : ''}`));
  }
  const masqTrack = el('div', 'trk', el('span', '', 'Masquerade'), bar);
  masqTrack.append(el('span', 'mv', `${chronicle.masquerade}/10`));
  frame.append(...corners(), plate, el('div', 'rail', masqTrack));
  if (before && before.masquerade !== chronicle.masquerade) {
    const d = chronicle.masquerade - before.masquerade;
    toast(frame, `Masquerade ${d > 0 ? '+' : '−'}${Math.abs(d)} · ${chronicle.masquerade}/10`);
  }
  return frame;
}

function renderScene(state) {
  // Characters in the order they were added, the Storyteller last; slots never move
  // unless a character is added or removed.
  const frames = state.characters.map((c) =>
    renderCharacter(c, prev && prev.characters.find((x) => x.id === c.id)),
  );
  frames.push(renderStoryteller(state.chronicle, prev && prev.chronicle));
  const slots = sceneLayout(frames.length);
  root.replaceChildren(
    ...frames.map((frame, i) => {
      const r = slots[i];
      const slot = el('div', 'slot', frame);
      slot.style.left = `${r.x}px`;
      slot.style.top = `${r.y}px`;
      slot.style.width = `${r.w}px`;
      slot.style.height = `${r.h}px`;
      return slot;
    }),
  );
}

function render(state) {
  if (sceneMode) {
    renderScene(state);
  } else if (pg === 'storyteller') {
    root.replaceChildren(renderStoryteller(state.chronicle, prev && prev.chronicle));
  } else {
    const c = state.characters.find((x) => x.id === pg);
    if (!c) {
      root.replaceChildren(
        el('div', 'missing', pg ? `Nessun personaggio "${pg}"` : 'Manca ?pg= nell’indirizzo'),
      );
    } else {
      const before = prev && prev.characters.find((x) => x.id === pg);
      root.replaceChildren(renderCharacter(c, before));
    }
  }
  prev = state;
}

// EventSource reconnects by itself if the overlay program restarts.
new EventSource('/events').onmessage = (e) => render(JSON.parse(e.data));
