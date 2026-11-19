/* global document, fetch, FormData, location, navigator, setTimeout, URLSearchParams */
// ElderBot web panel. No framework: the page asks /api/me and draws the cards.
// Names come from users, so every text goes in with textContent, never as HTML.

const TEXT = {
  it: {
    'login.intro': 'I tuoi personaggi e le tue Cronache di Vampire: The Masquerade.',
    'login.failed': 'Accesso non riuscito. Riprova.',
    'login.button': 'Accedi con Discord',
    'login.note': "Il bot legge solo il tuo ID e il tuo nome su Discord, nient'altro.",
    logout: 'Esci',
    'characters.title': 'I miei personaggi',
    'characters.empty': 'Non hai ancora personaggi. Creane uno con "Nuovo personaggio".',
    'characters.new': 'Nuovo personaggio',
    'chronicles.title': 'Le mie Cronache',
    noChronicle: 'nessuna Cronaca',
    live: 'in onda',
    noMembers: 'Nessun personaggio. Invita i giocatori con /elder chronicle invite.',
    error: 'Qualcosa è andato storto. Ricarica la pagina.',
    edit: 'Modifica',
    delete: 'Elimina',
    confirmDelete: 'Sicuro? Premi di nuovo',
    save: 'Salva',
    create: 'Crea',
    cancel: 'Annulla',
    name: 'Nome',
    clan: 'Clan',
    tier: 'Livello',
    server: 'Server Discord',
    noServer: 'Il bot non è in nessun server con te: aggiungilo o crea il PG su Discord.',
    'error.duplicate': 'Hai già un personaggio con questo nome su quel server.',
    'error.limit': 'Hai raggiunto il numero massimo di personaggi su quel server.',
    'error.invalid': 'Controlla i campi: qualcosa non va.',
    'error.change': 'Modifica non riuscita. Ricarica la pagina e riprova.',
  },
  en: {
    'login.intro': 'Your Vampire: The Masquerade characters and Chronicles.',
    'login.failed': 'Login failed. Try again.',
    'login.button': 'Log in with Discord',
    'login.note': 'The bot only reads your Discord ID and name, nothing else.',
    logout: 'Log out',
    'characters.title': 'My characters',
    'characters.empty': 'No characters yet. Make one with "New character".',
    'characters.new': 'New character',
    'chronicles.title': 'My Chronicles',
    noChronicle: 'no Chronicle',
    live: 'on air',
    noMembers: 'No characters yet. Invite players with /elder chronicle invite.',
    error: 'Something went wrong. Reload the page.',
    edit: 'Edit',
    delete: 'Delete',
    confirmDelete: 'Sure? Press again',
    save: 'Save',
    create: 'Create',
    cancel: 'Cancel',
    name: 'Name',
    clan: 'Clan',
    tier: 'Tier',
    server: 'Discord server',
    noServer: 'The bot shares no server with you: add it, or create the character on Discord.',
    'error.duplicate': 'You already have a character with this name on that server.',
    'error.limit': 'You reached the maximum number of characters on that server.',
    'error.invalid': 'Check the fields: something is wrong.',
    'error.change': 'The change failed. Reload the page and try again.',
  },
};

const lang = navigator.language?.toLowerCase().startsWith('it') ? 'it' : 'en';
const tr = (key) => TEXT[lang][key] ?? TEXT.en[key] ?? key;

function translatePage() {
  document.documentElement.lang = lang;
  for (const el of document.querySelectorAll('[data-t]')) el.textContent = tr(el.dataset.t);
}

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = String(text);
  return node;
}

function button(text, onClick, className = '') {
  const b = el('button', className, text);
  b.type = 'button';
  b.addEventListener('click', onClick);
  return b;
}

/** What /api/me answered last: the CSRF token, the servers and the form options. */
let me;

/** Shows a short message above the lists; it goes away on the next reload of the data. */
function notify(text) {
  const box = document.getElementById('notice');
  box.textContent = text;
  box.hidden = false;
}

/** Sends a change and draws the panel again from the server's data. */
async function change(method, url, body) {
  const response = await fetch(url, {
    method,
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': me.csrf },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (response.status === 401) {
    location.href = '/';
    return false;
  }
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    const key = { duplicate: 'error.duplicate', limit: 'error.limit', invalid: 'error.invalid' };
    notify(tr(key[data.error] ?? 'error.change'));
    return false;
  }
  await loadPanel();
  return true;
}

/** ■ filled, □ empty, ✖ crossed out: like the paper sheet. */
const boxes = (filled, empty, crossed = 0) =>
  '■'.repeat(Math.max(0, filled)) + '□'.repeat(Math.max(0, empty)) + '✖'.repeat(crossed);

/** One tracker row; with `track` and an editable character, − and + buttons around the value. */
function track(c, name, boxText, value, key) {
  const row = el('div', 'track');
  row.append(el('span', 'label', name), el('span', 'boxes', boxText));
  const end = el('span', 'value');
  if (key && c.editable) {
    const step = (delta) => () =>
      change('POST', `/api/characters/${c.id}/track`, { track: key, delta });
    const minus = button('−', step(-1), 'step');
    const plus = button('+', step(1), 'step');
    minus.setAttribute('aria-label', `${name} −1`);
    plus.setAttribute('aria-label', `${name} +1`);
    end.append(minus, el('strong', '', value), plus);
  } else {
    end.append(el('strong', '', value));
  }
  row.append(end);
  return row;
}

function select(name, options, value) {
  const s = el('select');
  s.name = name;
  for (const o of options) {
    const opt = el('option', '', o.name);
    opt.value = o.id;
    if (o.id === value) opt.selected = true;
    s.append(opt);
  }
  return s;
}

function field(label, input) {
  const wrap = el('label', 'field');
  wrap.append(el('span', '', label), input);
  return wrap;
}

function numberInput(name, value) {
  const input = el('input');
  input.type = 'number';
  input.name = name;
  input.min = '1';
  input.max = String(me.options.maxAttribute);
  input.required = true;
  input.value = String(value);
  return input;
}

/** The form for a new character (no `c`) or for changing one. */
function characterForm(c, onDone) {
  const form = el('form', 'sheet-form');
  const name = el('input');
  name.name = 'name';
  name.required = true;
  name.maxLength = me.options.maxName;
  name.value = c?.name ?? '';
  if (!c && me.guilds.length > 1) {
    form.append(field(tr('server'), select('guild', me.guilds, me.guilds[0].id)));
  }
  form.append(
    field(tr('name'), name),
    field(tr('clan'), select('clan', me.options.clans, c?.clanId)),
    field(tr('tier'), select('tier', me.options.tiers, c?.tierId ?? 'neonate')),
  );
  const attributes = el('div', 'attributes');
  attributes.append(
    field('Stamina', numberInput('stamina', c?.attributes.stamina ?? 2)),
    field('Composure', numberInput('composure', c?.attributes.composure ?? 2)),
    field('Resolve', numberInput('resolve', c?.attributes.resolve ?? 2)),
  );
  form.append(attributes);
  const actions = el('div', 'actions');
  const submit = el('button', 'primary', tr(c ? 'save' : 'create'));
  submit.type = 'submit';
  actions.append(submit, button(tr('cancel'), onDone));
  form.append(actions);
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const body = {
      name: data.get('name'),
      clan: data.get('clan'),
      tier: data.get('tier'),
      stamina: Number(data.get('stamina')),
      composure: Number(data.get('composure')),
      resolve: Number(data.get('resolve')),
    };
    if (!c) body.guild = data.get('guild') ?? me.guilds[0].id;
    submit.disabled = true;
    const ok = await change('POST', c ? `/api/characters/${c.id}` : '/api/characters', body);
    submit.disabled = false;
    if (ok) onDone();
  });
  return form;
}

function characterCard(c) {
  const card = el('article', 'card');
  card.append(el('h3', '', c.name));
  card.append(el('div', 'meta', `${c.clan} · ${c.tier} · ${c.chronicle ?? tr('noChronicle')}`));
  const h = c.health;
  card.append(
    track(
      c,
      'Health',
      boxes(h.current, h.max - h.baneful - h.current, h.baneful),
      `${h.current}/${h.max}`,
      'health',
    ),
    track(c, 'Baneful', '', String(h.baneful), 'baneful'),
    track(
      c,
      'Vitae',
      boxes(c.vitae.current, c.vitae.max - c.vitae.current),
      `${c.vitae.current}/${c.vitae.max}`,
      'vitae',
    ),
  );
  const hunger = track(c, 'Hunger', '', `${c.hunger}/5`);
  hunger.querySelector('strong').className = 'hunger';
  card.append(
    hunger,
    track(
      c,
      'Willpower',
      boxes(c.willpower.current, c.willpower.max - c.willpower.current),
      `${c.willpower.current}/${c.willpower.max}`,
      'willpower',
    ),
  );
  const hu = c.humanity;
  card.append(
    track(
      c,
      'Humanity',
      boxes(hu.rank, 10 - hu.rank - hu.violations, hu.violations),
      hu.rank,
      'humanity',
    ),
    track(c, 'Violations', '', String(hu.violations), 'violations'),
  );

  if (c.editable) {
    const actions = el('div', 'actions');
    actions.append(
      button(tr('edit'), () => {
        const form = characterForm(c, () => form.replaceWith(actions));
        actions.replaceWith(form);
      }),
    );
    if (c.owned) {
      let armed = false;
      const del = button(tr('delete'), () => {
        if (!armed) {
          armed = true;
          del.textContent = tr('confirmDelete');
          del.classList.add('danger');
          setTimeout(() => {
            armed = false;
            del.textContent = tr('delete');
            del.classList.remove('danger');
          }, 4000);
          return;
        }
        void change('DELETE', `/api/characters/${c.id}`);
      });
      actions.append(del);
    }
    card.append(actions);
  }
  return card;
}

async function loadPanel() {
  const response = await fetch('/api/me', { credentials: 'same-origin' });
  if (response.status === 401) {
    location.href = '/';
    return;
  }
  if (!response.ok) throw new Error(String(response.status));
  me = await response.json();
  document.getElementById('notice').hidden = true;

  document.getElementById('user').textContent = me.user.name;

  const list = document.getElementById('characters');
  list.replaceChildren(...me.characters.map(characterCard));
  document.getElementById('characters-empty').hidden = me.characters.length > 0;

  const chronicles = document.getElementById('chronicles');
  document.getElementById('chronicles-section').hidden = me.chronicles.length === 0;
  chronicles.replaceChildren(
    ...me.chronicles.map((ch) => {
      const block = el('div', ch.live ? 'chronicle live' : 'chronicle');
      const title = el('h3', '', ch.name);
      if (ch.live) title.append(el('span', 'badge', tr('live')));
      block.append(title, el('div', 'meta', `${ch.sect} · Masquerade ${ch.masquerade}/10`));
      const cards = el('div', 'cards');
      cards.append(...ch.characters.map(characterCard));
      block.append(ch.characters.length ? cards : el('p', 'empty', tr('noMembers')));
      return block;
    }),
  );
}

function setUpPanel() {
  document.getElementById('logout').addEventListener('click', async () => {
    await fetch('/logout', { method: 'POST', headers: { 'X-CSRF-Token': me.csrf } });
    location.href = '/';
  });
  const slot = document.getElementById('new-character-slot');
  const open = document.getElementById('new-character');
  open.addEventListener('click', () => {
    if (!me.guilds.length) {
      notify(tr('noServer'));
      return;
    }
    open.hidden = true;
    const form = characterForm(undefined, () => {
      form.remove();
      open.hidden = false;
    });
    slot.replaceChildren(form);
  });
}

translatePage();
if (document.body.dataset.page === 'login') {
  if (new URLSearchParams(location.search).has('login')) {
    document.querySelector('[data-t="login.failed"]').hidden = false;
  }
} else {
  setUpPanel();
  loadPanel().catch(() => {
    document.querySelector('main').prepend(el('p', 'error', tr('error')));
  });
}
