/* global document, fetch, location, navigator, URLSearchParams */
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
    'characters.empty': 'Non hai ancora personaggi. Su Discord: /elder character create.',
    'chronicles.title': 'Le mie Cronache',
    noChronicle: 'nessuna Cronaca',
    live: 'in onda',
    noMembers: 'Nessun personaggio. Invita i giocatori con /elder chronicle invite.',
    error: 'Qualcosa è andato storto. Ricarica la pagina.',
  },
  en: {
    'login.intro': 'Your Vampire: The Masquerade characters and Chronicles.',
    'login.failed': 'Login failed. Try again.',
    'login.button': 'Log in with Discord',
    'login.note': 'The bot only reads your Discord ID and name, nothing else.',
    logout: 'Log out',
    'characters.title': 'My characters',
    'characters.empty': 'No characters yet. On Discord: /elder character create.',
    'chronicles.title': 'My Chronicles',
    noChronicle: 'no Chronicle',
    live: 'on air',
    noMembers: 'No characters yet. Invite players with /elder chronicle invite.',
    error: 'Something went wrong. Reload the page.',
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

/** ■ filled, □ empty, ✖ crossed out: like the paper sheet. */
const boxes = (filled, empty, crossed = 0) =>
  '■'.repeat(Math.max(0, filled)) + '□'.repeat(Math.max(0, empty)) + '✖'.repeat(crossed);

function track(name, boxText, value) {
  const row = el('div', 'track');
  row.append(el('span', '', name), el('span', 'boxes', boxText), el('strong', '', value));
  return row;
}

function characterCard(c) {
  const card = el('article', 'card');
  card.append(el('h3', '', c.name));
  card.append(el('div', 'meta', `${c.clan} · ${c.tier} · ${c.chronicle ?? tr('noChronicle')}`));
  const h = c.health;
  card.append(
    track(
      'Health',
      boxes(h.current, h.max - h.baneful - h.current, h.baneful),
      `${h.current}/${h.max}`,
    ),
  );
  card.append(
    track(
      'Vitae',
      boxes(c.vitae.current, c.vitae.max - c.vitae.current),
      `${c.vitae.current}/${c.vitae.max}`,
    ),
  );
  const hunger = track('Hunger', '', `${c.hunger}/5`);
  hunger.lastChild.className = 'hunger';
  card.append(hunger);
  card.append(
    track(
      'Willpower',
      boxes(c.willpower.current, c.willpower.max - c.willpower.current),
      `${c.willpower.current}/${c.willpower.max}`,
    ),
  );
  const hu = c.humanity;
  card.append(
    track('Humanity', boxes(hu.rank, 10 - hu.rank - hu.violations, hu.violations), hu.rank),
  );
  return card;
}

async function loadPanel() {
  const response = await fetch('/api/me', { credentials: 'same-origin' });
  if (response.status === 401) {
    location.href = '/';
    return;
  }
  if (!response.ok) throw new Error(String(response.status));
  const me = await response.json();

  document.getElementById('user').textContent = me.user.name;
  document.getElementById('logout').addEventListener('click', async () => {
    await fetch('/logout', { method: 'POST', headers: { 'X-CSRF-Token': me.csrf } });
    location.href = '/';
  });

  const list = document.getElementById('characters');
  list.replaceChildren(...me.characters.map(characterCard));
  document.getElementById('characters-empty').hidden = me.characters.length > 0;

  if (me.chronicles.length) {
    document.getElementById('chronicles-section').hidden = false;
    document.getElementById('chronicles').replaceChildren(
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
}

translatePage();
if (document.body.dataset.page === 'login') {
  if (new URLSearchParams(location.search).has('login')) {
    document.querySelector('[data-t="login.failed"]').hidden = false;
  }
} else {
  loadPanel().catch(() => {
    document.querySelector('main').prepend(el('p', 'error', tr('error')));
  });
}
