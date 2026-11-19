/* global window, document, EventSource, Image, URL, URLSearchParams, setTimeout */
// OBS Browser Source. /scena draws every frame on one fixed page (1920×1080 or 2560×1440),
// with the background, each player's webcam and the last roll; /frame?pg=<id> (or
// ?pg=storyteller, or ?pg=tiro for the roll box alone) draws one frame that fills the source.
// The same page runs on the overlay program (http://127.0.0.1:7777/scena) and on the bot
// (https://<panel>/overlay/scena?v=<view key>), so every address here is relative.
'use strict';

const { CLANS, SECTS, el, sceneLayout, rollBoxRect, camUrl } = window.ELDER;
const sceneMode = window.location.pathname.endsWith('/scena');
const params = new URLSearchParams(window.location.search);
// The bot's view key; the overlay program needs none.
const view = params.get('v') ? `?v=${encodeURIComponent(params.get('v'))}` : '';
// Absolute, because a url() in a CSS variable resolves against the stylesheet, not the page.
const symbolUrl = (key) => new URL(`symbols/${key}.png${view}`, window.location.href).href;
const pg = params.get('pg') || '';
// Numbers by default; ?stile=caselle draws the boxes of the character sheet instead.
const boxStyle = params.get('stile') === 'caselle';
// ?scala=1.2 makes plates and numbers bigger; the frame always fills the Browser Source.
const scale = Number(params.get('scala'));
if (scale >= 0.3 && scale <= 3)
  document.documentElement.style.setProperty('--scale', String(scale));
// ?webcam=0 leaves the webcams out, for scenes that still capture them another way.
const showCams = params.get('webcam') !== '0';
const root = document.getElementById('root');
const cams = document.getElementById('cams');
const bg = document.getElementById('bg');
/** One iframe per webcam, never moved in the page: moving an iframe reloads the video. */
const camFrames = new Map();
const SVG = 'http://www.w3.org/2000/svg';

let prev = null;
const symbolOk = new Map();

function symbol(key, frame) {
  const i = el('i', 'sym');
  i.hidden = true;
  i.style.setProperty('--m', `url("${symbolUrl(key)}")`);
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
    img.src = symbolUrl(key);
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
    typeof note === 'string' ? el('span', 'nx', note) : note,
  );
}

/** The Hunger die that sits beside Vitae: a small d10 with the number of Hunger dice. */
function hungerDie(c, before) {
  const die = d10(c.hunger > 0, c.hunger);
  die.classList.add('hg');
  if (before && before.hunger !== c.hunger) die.classList.add('hot');
  const wrap = el('span', 'nx hunger');
  wrap.title = `Hunger ${c.hunger}`;
  wrap.append(die);
  return wrap;
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
      h.baneful ? `\u2715${h.baneful}` : '',
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
      'Vitae · Hunger',
      c.vitae.current,
      c.vitae.max,
      hungerDie(c, b),
      b && (b.vitae.current !== c.vitae.current || b.vitae.max !== c.vitae.max),
    ),
    numberCell(
      'humanity',
      'Humanity',
      c.humanity.rank,
      null,
      v ? `\u2715${v}` : '',
      b && (b.humanity.rank !== c.humanity.rank || b.humanity.violations !== v),
    ),
  );
}

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
  if (c.cam) frame.dataset.cam = c.cam;
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
  let rail;
  if (boxStyle) {
    const vitae = track('vitae', 'Vitae', now.vitae, old && old.vitae);
    vitae.append(hungerDie(c, before));
    rail = el(
      'div',
      'rail',
      track('health', 'Health', now.health, old && old.health),
      track('willpower', 'Willpower', now.willpower, old && old.willpower),
      vitae,
      track('humanity', 'Humanity', now.humanity, old && old.humanity),
    );
  } else rail = numbers(c, before);
  frame.append(el('i', 'pp'), plate, rail);
  toast(frame, changes(before, c)[0]);
  return frame;
}

function renderStoryteller(chronicle, before, cam) {
  const frame = el('div', 'frame st');
  if (cam) frame.dataset.cam = cam;
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
  frame.append(el('i', 'pp'), plate, el('div', 'rail', masqTrack));
  if (before && before.masquerade !== chronicle.masquerade) {
    const d = chronicle.masquerade - before.masquerade;
    toast(frame, `Masquerade ${d > 0 ? '+' : '−'}${Math.abs(d)} · ${chronicle.masquerade}/10`);
  }
  return frame;
}

const OUTCOME_CLASS = { win: 'win', critical: 'crit', fail: 'fail', bestial: 'beast' };

/** The last roll: what was rolled, each side's dice and successes, the result. */
function renderRoll(roll, before) {
  const box = el('div', 'roll');
  if (!roll) {
    box.classList.add('empty');
    return box;
  }
  if (!before || before.at !== roll.at) box.classList.add('new');
  box.classList.add(OUTCOME_CLASS[roll.tone] || 'neutral');
  const many = roll.sides.reduce((n, s) => n + s.normal.length + s.hunger.length, 0) > 14;
  const sides = el('div', `sides${many ? ' many' : ''}`);
  for (const side of roll.sides) {
    const dice = el('div', 'dice');
    for (const face of side.normal) {
      const die = d10(face >= 6, face);
      if (face === 10) die.classList.add('ten');
      dice.append(die);
    }
    for (const face of side.hunger) {
      const die = d10(face >= 6, face);
      die.classList.add('hdie');
      if (face === 1) die.classList.add('one');
      if (face === 10) die.classList.add('ten');
      dice.append(die);
    }
    sides.append(
      el(
        'div',
        'side',
        el('span', 'who', side.who),
        dice,
        el('span', 'succ', String(side.successes)),
      ),
    );
  }
  const head = el('div', 'rhead', el('span', 'what', roll.label));
  if (roll.difficulty) head.append(el('span', 'diff', `Difficulty ${roll.difficulty}`));
  box.append(head, sides);
  if (roll.outcome) box.append(el('div', 'outcome', roll.outcome));
  return box;
}

function place(node, r) {
  node.style.left = `${r.x}px`;
  node.style.top = `${r.y}px`;
  node.style.width = `${r.w}px`;
  node.style.height = `${r.h}px`;
  return node;
}

let backgroundTag = null;

/** The background image of the scene, reloaded only when the Storyteller changes it. */
function renderBackground(stage) {
  const tag = stage.background;
  if (tag === backgroundTag) return;
  backgroundTag = tag;
  if (!tag) {
    bg.replaceChildren();
    return;
  }
  const img = el('img');
  img.alt = '';
  const query = view ? `${view}&t=${tag}` : `?t=${tag}`;
  img.src = new URL(`background${query}`, window.location.href).href;
  bg.replaceChildren(img);
}

function renderScene(state) {
  const stage = state.stage || { width: 1920, height: 1080, layout: 'grid', rollBox: false };
  document.documentElement.style.setProperty('--canvas', `${stage.width}px`);
  document.documentElement.style.setProperty('--canvas-h', `${stage.height}px`);
  renderBackground(stage);
  // Characters in the order they were added, the Storyteller last; slots never move
  // unless a character is added or removed.
  const frames = state.characters.map((c) =>
    renderCharacter(c, prev && prev.characters.find((x) => x.id === c.id)),
  );
  frames.push(renderStoryteller(state.chronicle, prev && prev.chronicle, stage.cam));
  const slots = sceneLayout(frames.length, stage);
  const k = stage.width / 1920;
  const nodes = frames.map((frame, i) => {
    const slot = place(el('div', 'slot', frame), slots[i]);
    if (slots[i].w / k < 540) slot.classList.add('compact');
    return slot;
  });
  if (stage.rollBox) {
    const box = renderRoll(state.roll, prev && prev.roll);
    nodes.push(place(el('div', 'slot roll-slot', box), rollBoxRect(stage.width)));
  }
  root.replaceChildren(...nodes);
}

/** Puts each webcam under its frame; webcams no longer on air are closed. */
function placeCams() {
  const seen = new Set();
  if (showCams) {
    for (const frame of root.querySelectorAll('.frame[data-cam]')) {
      const id = frame.dataset.cam;
      seen.add(id);
      let iframe = camFrames.get(id);
      if (!iframe) {
        iframe = el('iframe', 'cam');
        iframe.src = camUrl(id);
        iframe.allow = 'autoplay';
        iframe.setAttribute('scrolling', 'no');
        camFrames.set(id, iframe);
        cams.append(iframe);
      }
      const r = frame.getBoundingClientRect();
      place(iframe, {
        x: r.left + window.scrollX,
        y: r.top + window.scrollY,
        w: r.width,
        h: r.height,
      });
    }
  }
  for (const [id, iframe] of camFrames) {
    if (!seen.has(id)) {
      iframe.remove();
      camFrames.delete(id);
    }
  }
}

function render(state) {
  if (!state.chronicle) {
    // No Chronicle on air: nothing to show until the Storyteller puts one on air.
    root.replaceChildren();
    placeCams();
    prev = null;
    return;
  }
  if (sceneMode) {
    renderScene(state);
  } else if (pg === 'storyteller') {
    const cam = state.stage && state.stage.cam;
    root.replaceChildren(renderStoryteller(state.chronicle, prev && prev.chronicle, cam));
  } else if (pg === 'tiro') {
    root.replaceChildren(el('div', 'roll-alone', renderRoll(state.roll, prev && prev.roll)));
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
  // A clan name squeezed to a sliver reads as a stray letter: hide it when it does not fit.
  for (const cl of root.querySelectorAll('.plate .cl')) {
    if (cl.scrollWidth > cl.clientWidth + 1) cl.hidden = true;
  }
  placeCams();
  prev = state;
}

window.addEventListener('resize', placeCams);

// EventSource reconnects by itself if the overlay program or the bot restarts.
new EventSource(`events${view}`).onmessage = (e) => render(JSON.parse(e.data));
