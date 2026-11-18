/* global window, document, EventSource, fetch */
// OBS Custom Browser Dock: changes the trackers. Every change goes through the
// local server, which pushes it to the frames and to this dock.
'use strict';

const { CLANS, SECTS, el, sceneLayout } = window.ELDER;
const token = document.querySelector('meta[name="elder-token"]').content;
const $ = (id) => document.getElementById(id);
const origin = window.location.origin;

let state = { characters: [], chronicle: { masquerade: 0, sect: 'camarilla' } };
let selected = null; // character id, or '+' for the new-character form
let confirmRemove = false;

function status(text, isError) {
  $('status').textContent = text || '';
  $('status').className = isError ? 'status err' : 'status';
}

async function post(path, body) {
  try {
    const res = await fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Elder-Token': token },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
    status('');
    return data;
  } catch (err) {
    status(`Non riuscito: ${err.message}`, true);
    return null;
  }
}

function fillSelect(select, entries, value) {
  select.replaceChildren(
    ...entries.map(([k, name]) => {
      const o = el('option', '', name);
      o.value = k;
      o.selected = k === value;
      return o;
    }),
  );
}

function row(label, sub, value, onMinus, onPlus) {
  const minus = el('button', '', '−');
  minus.type = 'button';
  minus.setAttribute('aria-label', `${label} ${sub} meno 1`);
  minus.onclick = onMinus;
  const plus = el('button', '', '+');
  plus.type = 'button';
  plus.setAttribute('aria-label', `${label} ${sub} più 1`);
  plus.onclick = onPlus;
  const name = el('span', 'n', label);
  if (sub) name.append(el('small', '', sub));
  return el('div', 'row', name, minus, el('span', 'v', value), plus);
}

function trackRow(c, track, field, label, sub, value) {
  const step = (delta) => () => post('/api/adjust', { pg: c.id, track, field, delta });
  return row(label, sub, value, step(-1), step(1));
}

function renderTabs() {
  const tabs = state.characters.map((c) => {
    const b = el('button', '', c.name);
    b.type = 'button';
    b.setAttribute('aria-pressed', String(c.id === selected));
    b.onclick = () => {
      selected = c.id;
      confirmRemove = false;
      render();
    };
    return b;
  });
  const add = el('button', '', '+ Nuovo');
  add.type = 'button';
  add.setAttribute('aria-pressed', String(selected === '+'));
  add.onclick = () => {
    selected = '+';
    render();
  };
  $('tabs').replaceChildren(...tabs, add);
}

function renderCharacter(c) {
  const h = c.health;
  $('rows').replaceChildren(
    trackRow(c, 'health', 'current', 'Health', '', `${h.current} / ${h.max - h.baneful}`),
    trackRow(c, 'health', 'baneful', 'Health', 'baneful', String(h.baneful)),
    trackRow(c, 'vitae', 'current', 'Vitae', '', `${c.vitae.current} / ${c.vitae.max}`),
    trackRow(
      c,
      'willpower',
      'current',
      'Willpower',
      '',
      `${c.willpower.current} / ${c.willpower.max}`,
    ),
    trackRow(c, 'humanity', 'current', 'Humanity', 'rank', String(c.humanity.rank)),
    trackRow(c, 'humanity', 'violations', 'Humanity', 'violations', String(c.humanity.violations)),
    trackRow(c, 'hunger', 'current', 'Hunger', 'dadi', `${c.hunger} / 5`),
  );
  $('maxrows').replaceChildren(
    trackRow(c, 'health', 'max', 'Health', 'massimo', String(h.max)),
    trackRow(c, 'vitae', 'max', 'Vitae', 'massimo', String(c.vitae.max)),
    trackRow(c, 'willpower', 'max', 'Willpower', 'massimo', String(c.willpower.max)),
  );
  if (document.activeElement !== $('edit-name')) $('edit-name').value = c.name;
  fillSelect(
    $('edit-clan'),
    Object.entries(CLANS).map(([k, v]) => [k, v.name]),
    c.clan,
  );
  $('remove-char').textContent = confirmRemove ? 'Conferma: elimina' : 'Elimina personaggio';
  $('url-frame').value = `${origin}/frame?pg=${c.id}`;
  $('url-deck').value = `${origin}/api/adjust?pg=${c.id}&track=health&delta=-1`;
}

function render() {
  if (selected !== '+' && !state.characters.some((c) => c.id === selected)) {
    selected = state.characters[0] ? state.characters[0].id : '+';
  }
  renderTabs();
  const c = state.characters.find((x) => x.id === selected);
  $('char').hidden = !c;
  $('new').hidden = selected !== '+';
  if (c) renderCharacter(c);
  $('masq-v').textContent = `${state.chronicle.masquerade} / 10`;
  fillSelect(
    $('sect'),
    Object.entries(SECTS).map(([k, v]) => [
      k,
      k === 'camarilla-v5' ? 'Camarilla (V5)' : v || 'Nessuna',
    ]),
    state.chronicle.sect,
  );
  $('url-st').value = `${origin}/frame?pg=storyteller`;
  $('url-scene').value = `${origin}/scena`;
  const names = [...state.characters.map((c) => c.name), 'Storyteller'];
  const slots = sceneLayout(names.length);
  $('slots').replaceChildren(
    ...names.map((name, i) => {
      const r = slots[i];
      return el('li', '', el('b', '', name), ` · X ${r.x}, Y ${r.y} · ${r.w} × ${r.h}`);
    }),
  );
}

fillSelect(
  $('new-clan'),
  Object.entries(CLANS).map(([k, v]) => [k, v.name]),
  'brujah',
);

$('add-char').onclick = async () => {
  const name = $('new-name').value;
  const ok = await post('/api/characters/add', {
    name,
    clan: $('new-clan').value,
    stamina: $('new-stamina').value,
    vitaeMax: $('new-vitae').value,
    willpowerMax: $('new-will').value,
    humanity: $('new-humanity').value,
  });
  if (ok) {
    // The server's update arrives on /events and selects the new character.
    $('new-name').value = '';
    status(`${name} aggiunto.`);
  }
};
$('save-char').onclick = () =>
  post('/api/characters/update', {
    pg: selected,
    name: $('edit-name').value,
    clan: $('edit-clan').value,
  });
$('remove-char').onclick = async () => {
  if (!confirmRemove) {
    confirmRemove = true;
    render();
    return;
  }
  confirmRemove = false;
  await post('/api/characters/remove', { pg: selected });
};
$('masq-dec').onclick = () => post('/api/adjust', { track: 'masquerade', delta: -1 });
$('masq-inc').onclick = () => post('/api/adjust', { track: 'masquerade', delta: 1 });
$('sect').onchange = (e) => post('/api/chronicle/sect', { sect: e.target.value });
for (const id of ['url-frame', 'url-deck', 'url-st', 'url-scene'])
  $(id).onfocus = (e) => e.target.select();

const events = new EventSource('/events');
events.onopen = () => {
  $('conn').textContent = 'collegato';
  $('conn').className = 'conn ok';
};
events.onerror = () => {
  $('conn').textContent = 'programma non raggiungibile';
  $('conn').className = 'conn';
};
events.onmessage = (e) => {
  const before = state.characters.map((c) => c.id);
  state = JSON.parse(e.data);
  // After adding a character, jump to it.
  const added = state.characters.find((c) => !before.includes(c.id));
  if (added && selected === '+') selected = added.id;
  render();
};
