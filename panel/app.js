/* global document, window, fetch, Event, FormData, location, navigator, setTimeout, URLSearchParams */
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
    'characters.guided': 'Crea scheda guidata',
    'drafts.title': 'Schede in corso',
    'characters.complete': 'Completa la scheda',
    'characters.sheet': 'Scheda',
    'characters.pending': 'da approvare',
    'drafts.untitled': 'Senza nome',
    'drafts.continue': 'Continua',
    'drafts.updated': 'modificata il',
    'chronicles.title': 'Le mie Cronache',
    noChronicle: 'nessuna Cronaca',
    live: 'in onda',
    noMembers: 'Nessun personaggio. Invita i giocatori su Discord con /elder invite.',
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
    noServer: 'Il bot non è in nessun server con te: aggiungilo a un server.',
    'error.duplicate': 'Hai già un personaggio con questo nome su quel server.',
    'error.limit': 'Hai raggiunto il numero massimo di personaggi su quel server.',
    'error.invalid': 'Controlla i campi: qualcosa non va.',
    'error.change': 'Modifica non riuscita. Ricarica la pagina e riprova.',
    'chronicles.new': 'Nuova Cronaca',
    'chronicles.tier': 'Livello di gioco',
    'chronicles.anyTier': 'qualsiasi livello',
    'error.tier':
      'Il livello non corrisponde: i personaggi di una Cronaca devono avere il suo livello di gioco.',
    'chronicles.empty': 'Non sei Narratore di nessuna Cronaca. Creane una con "Nuova Cronaca".',
    goLive: 'Metti in onda',
    sect: 'Setta',
    up: 'Sposta prima',
    down: 'Sposta dopo',
    remove: 'Togli',
    'cam.title': 'Webcam per OBS',
    'cam.note':
      'Il giocatore apre questo link sul suo PC, sceglie la webcam e lascia la scheda aperta: la webcam compare nella sua cornice. Nessun microfono, la voce resta su Discord.',
    'cam.create': 'Attiva la webcam',
    'cam.renew': 'Nuovo link',
    'cam.remove': 'Togli la webcam',
    'cam.link': 'Link del giocatore',
    'cam.mine': 'La tua webcam (Narratore)',
    'cam.on': 'attiva',
    'cam.myLink': 'Il tuo link',
    'stage.title': 'Scena',
    'stage.resolution': 'Risoluzione',
    'stage.layout': 'Disposizione',
    'stage.rollBox': 'Riquadro con l’ultimo tiro in basso',
    'stage.background': 'Sfondo',
    'stage.upload': 'Carica sfondo',
    'stage.removeBackground': 'Togli sfondo',
    'stage.backgroundNote':
      'PNG, JPEG o WebP fino a 8 MB, meglio se della stessa misura della scena.',
    'stage.hasBackground': 'Sfondo caricato.',
    'stage.noBackground': 'Nessuno sfondo: la scena resta trasparente.',
    'stage.tooBig': 'Immagine troppo grande: massimo 8 MB.',
    'stage.badImage': 'Formato non valido: usa PNG, JPEG o WebP.',
    'layout.grid': 'Griglia: tutte le cornici uguali',
    'layout.stage': 'Palco: Narratore grande in alto, giocatori sotto',
    'layout.sides': 'Ai lati: giocatori a sinistra e a destra, Narratore al centro',
    'overlay.roll': 'Solo il riquadro dei tiri',
    'overlay.title': 'Overlay di OBS',
    'overlay.pages':
      'Browser Source di OBS: le cornici della Cronaca in onda, aggiornate a ogni modifica. Imposta la Browser Source della scena intera alla risoluzione scelta qui sotto.',
    'overlay.scene': 'Scena intera',
    'overlay.storyteller': 'Cornice del Narratore',
    'overlay.newPages': 'Nuovi indirizzi',
    'overlay.deck': 'Chiave per lo Stream Deck',
    'overlay.slots': 'Posizioni dei ritagli nella scena',
    'overlay.slotsNote':
      'Solo per le webcam non collegate con VDO.Ninja: in OBS metti ogni ritaglio nel suo rettangolo (Ctrl+E, Posizione = X, Y e riquadro "Adatta all’interno" = L × A) e aggiungi &webcam=0 all’indirizzo della scena.',
    'overlay.none':
      'Serve per cambiare i tracciati dallo Stream Deck (o per collegare Elder Overlay sul PC).',
    'overlay.since': 'Chiave attiva dal',
    'overlay.create': 'Crea la chiave',
    'overlay.renew': 'Nuova chiave',
    'overlay.revoke': 'Revoca',
    'overlay.once':
      "Copiala adesso: non la vedrai più. Lo Stream Deck la manda nell'header X-Elder-Token, con una richiesta POST come questa.",
    'overlay.example': 'Esempio di tasto (Vitae −1)',
    'overlay.address': 'Indirizzo',
    'overlay.key': 'Chiave',
    copy: 'Copia',
    copied: 'Copiata',
    'chronicles.channel': 'Canale del tavolo',
    'chronicles.noChannel': 'nessun canale',
    'chronicles.channelNote':
      'Il canale Discord dove si gioca: lì i tiri usano i PG della Cronaca e tu sei il Narratore.',
    'chronicles.language': 'Lingua del bot',
    'chronicles.autoLanguage': 'quella di Discord di ciascuno',
    'chronicles.end': 'Chiudi sessione',
    'chronicles.ended': 'Sessione chiusa: i compiti prolungati in corso sono stati annullati.',
    'chronicles.archive': 'Archivia',
    'chronicles.transfer': 'Cedi la Cronaca',
    'characters.give': 'Cedi',
    'give.to': 'A chi',
    'give.other': 'Altro utente (ID Discord)…',
    'give.id': 'ID Discord',
    'give.idNote':
      'Su Discord: tasto destro sul nome, "Copia ID utente" (serve la modalità sviluppatore).',
    'give.confirm': 'Cedi',
    'error.to': 'Utente non trovato su quel server.',
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
    'characters.guided': 'Guided character sheet',
    'drafts.title': 'Sheets in progress',
    'characters.complete': 'Complete the sheet',
    'characters.sheet': 'Sheet',
    'characters.pending': 'to approve',
    'drafts.untitled': 'Untitled',
    'drafts.continue': 'Continue',
    'drafts.updated': 'changed on',
    'chronicles.title': 'My Chronicles',
    noChronicle: 'no Chronicle',
    live: 'on air',
    noMembers: 'No characters yet. Invite players on Discord with /elder invite.',
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
    noServer: 'The bot shares no server with you: add it to a server.',
    'error.duplicate': 'You already have a character with this name on that server.',
    'error.limit': 'You reached the maximum number of characters on that server.',
    'error.invalid': 'Check the fields: something is wrong.',
    'error.change': 'The change failed. Reload the page and try again.',
    'chronicles.new': 'New Chronicle',
    'chronicles.tier': 'Tier of play',
    'chronicles.anyTier': 'any tier',
    'error.tier': 'The tier does not match: characters in a Chronicle must have its tier of play.',
    'chronicles.empty': 'You run no Chronicle. Make one with "New Chronicle".',
    goLive: 'Put on air',
    sect: 'Sect',
    up: 'Move earlier',
    down: 'Move later',
    remove: 'Remove',
    'cam.title': 'Webcam for OBS',
    'cam.note':
      'The player opens this link on their computer, picks the webcam and keeps the tab open: the webcam shows in their frame. No microphone, voices stay on Discord.',
    'cam.create': 'Turn on the webcam',
    'cam.renew': 'New link',
    'cam.remove': 'Remove the webcam',
    'cam.link': "Player's link",
    'cam.mine': 'Your webcam (Storyteller)',
    'cam.on': 'on',
    'cam.myLink': 'Your link',
    'stage.title': 'Scene',
    'stage.resolution': 'Resolution',
    'stage.layout': 'Layout',
    'stage.rollBox': 'Box with the last roll at the bottom',
    'stage.background': 'Background',
    'stage.upload': 'Upload background',
    'stage.removeBackground': 'Remove background',
    'stage.backgroundNote': 'PNG, JPEG or WebP up to 8 MB, best at the size of the scene.',
    'stage.hasBackground': 'Background uploaded.',
    'stage.noBackground': 'No background: the scene stays transparent.',
    'stage.tooBig': 'Image too large: 8 MB at most.',
    'stage.badImage': 'Not a valid image: use PNG, JPEG or WebP.',
    'layout.grid': 'Grid: all frames alike',
    'layout.stage': 'Stage: Storyteller large on top, players below',
    'layout.sides': 'Sides: players left and right, Storyteller in the middle',
    'overlay.roll': 'Roll box only',
    'overlay.title': 'OBS overlay',
    'overlay.pages':
      'OBS Browser Sources: the frames of the Chronicle on air, updated on every change. Set the whole-scene Browser Source to the resolution chosen below.',
    'overlay.scene': 'Whole scene',
    'overlay.storyteller': 'Storyteller frame',
    'overlay.newPages': 'New addresses',
    'overlay.deck': 'Stream Deck key',
    'overlay.slots': 'Where the crops go in the scene',
    'overlay.slotsNote':
      'Only for webcams not linked with VDO.Ninja: in OBS put each crop in its rectangle (Ctrl+E, Position = X, Y and bounding box "Scale to inner bounds" = W × H) and add &webcam=0 to the scene address.',
    'overlay.none': 'Moves trackers from the Stream Deck (or links Elder Overlay on your PC).',
    'overlay.since': 'Key active since',
    'overlay.create': 'Make the key',
    'overlay.renew': 'New key',
    'overlay.revoke': 'Revoke',
    'overlay.once':
      "Copy it now: you won't see it again. The Stream Deck sends it in the X-Elder-Token header, with a POST request like this one.",
    'overlay.example': 'Example key (Vitae −1)',
    'overlay.address': 'Address',
    'overlay.key': 'Key',
    copy: 'Copy',
    copied: 'Copied',
    'chronicles.channel': 'Table channel',
    'chronicles.noChannel': 'no channel',
    'chronicles.channelNote':
      "The Discord channel where it is played: rolls there use the Chronicle's characters and you are the Storyteller.",
    'chronicles.language': 'Bot language',
    'chronicles.autoLanguage': "each user's Discord language",
    'chronicles.end': 'End session',
    'chronicles.ended': 'Session ended: prolonged tasks still open were cancelled.',
    'chronicles.archive': 'Archive',
    'chronicles.transfer': 'Hand over the Chronicle',
    'characters.give': 'Give away',
    'give.to': 'To',
    'give.other': 'Another user (Discord ID)…',
    'give.id': 'Discord ID',
    'give.idNote': 'On Discord: right-click the name, "Copy User ID" (needs Developer Mode).',
    'give.confirm': 'Give',
    'error.to': 'User not found on that server.',
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

/** A button that asks for a second press within 4 seconds before it acts. */
function confirmButton(text, onConfirm) {
  let armed = false;
  const b = button(text, () => {
    if (armed) return onConfirm();
    armed = true;
    b.textContent = tr('confirmDelete');
    b.classList.add('danger');
    setTimeout(() => {
      armed = false;
      b.textContent = text;
      b.classList.remove('danger');
    }, 4000);
  });
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
    const key = {
      duplicate: 'error.duplicate',
      limit: 'error.limit',
      invalid: 'error.invalid',
      tier: 'error.tier',
    };
    const fieldKey = data.field === 'to' ? 'error.to' : undefined;
    notify(tr(fieldKey ?? key[data.error] ?? 'error.change'));
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
  const label = el('span', 'label', name);
  // Drop, heart, brain and face from the overlay's icons, beside the four main trackers.
  if (['health', 'vitae', 'willpower', 'humanity'].includes(key) && window.ELDER?.trackerIcon) {
    label.prepend(window.ELDER.trackerIcon(key));
  }
  row.append(label, el('span', 'boxes', boxText));
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

function characterCard(c, chronicle) {
  const card = el('article', 'card');
  const title = el('h3', '', c.name);
  if (c.pending) title.append(el('span', 'badge', tr('characters.pending')));
  card.append(title);
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

  if (c.editable) card.append(camBox(c));

  const actions = el('div', 'actions');
  if (c.editable) {
    actions.append(
      button(tr('edit'), () => {
        const form = characterForm(c, () => form.replaceWith(actions));
        actions.replaceWith(form);
      }),
    );
    if (c.sheet) {
      const sheet = el('a', 'button', tr('characters.sheet'));
      sheet.href = `/scheda?id=${c.id}`;
      actions.append(sheet);
    }
    if (c.owned && !c.sheet && c.tierId !== 'ghoul') {
      // Characters made before the wizard have trackers only: the wizard can fill in the rest.
      const complete = el('a', 'button', tr('characters.complete'));
      complete.href = `/crea?personaggio=${c.id}`;
      actions.append(complete);
    }
    if (c.owned) {
      actions.append(
        button(tr('characters.give'), () => {
          const url = `/api/characters/${c.id}/give`;
          const form = recipientForm(c.guild, url, () => form.replaceWith(actions));
          actions.replaceWith(form);
        }),
        confirmButton(tr('delete'), () => change('DELETE', `/api/characters/${c.id}`)),
      );
    }
  }
  if (chronicle) {
    // The Storyteller's view: scene order (also the overlay's) and removal from the Chronicle.
    const path = `/api/chronicles/${chronicle.id}`;
    const up = button('↑', () => change('POST', `${path}/move`, { character: c.id, delta: -1 }));
    const down = button('↓', () => change('POST', `${path}/move`, { character: c.id, delta: 1 }));
    up.title = tr('up');
    down.title = tr('down');
    up.setAttribute('aria-label', `${c.name}: ${tr('up')}`);
    down.setAttribute('aria-label', `${c.name}: ${tr('down')}`);
    actions.append(
      up,
      down,
      confirmButton(tr('remove'), () => change('POST', `${path}/remove`, { character: c.id })),
    );
  }
  if (actions.childElementCount) card.append(actions);
  return card;
}

/** The character's VDO.Ninja link: the player sends their webcam, OBS shows it in the frame. */
function camBox(c) {
  const box = el('details', 'cam-box');
  box.append(el('summary', '', c.cam ? `${tr('cam.title')} · ${tr('cam.on')}` : tr('cam.title')));
  const path = `/api/characters/${c.id}/cam`;
  const actions = el('div', 'actions');
  if (c.cam) {
    box.append(el('p', 'note', tr('cam.note')), copyField(tr('cam.link'), c.cam.push));
    actions.append(
      confirmButton(tr('cam.renew'), () => change('POST', path)),
      confirmButton(tr('cam.remove'), () => change('DELETE', path)),
    );
  } else {
    actions.append(button(tr('cam.create'), () => change('POST', path)));
  }
  box.append(actions);
  return box;
}

/** Channels or people of a Discord server, asked when a form opens. */
async function choicesOf(guild, kind) {
  const response = await fetch(`/api/guilds/${guild}/${kind}`, { credentials: 'same-origin' });
  if (!response.ok) return [];
  const data = await response.json().catch(() => ({}));
  return Array.isArray(data[kind]) ? data[kind] : [];
}

/** Picks someone on the server (or types their Discord ID) and hands something over to them. */
function recipientForm(guild, url, onDone) {
  const form = el('form', 'sheet-form');
  const pick = select('pick', [{ id: '', name: '…' }], '');
  const id = el('input');
  id.name = 'id';
  id.inputMode = 'numeric';
  id.pattern = '\\d{5,20}';
  const idField = field(tr('give.id'), id);
  const idNote = el('p', 'note', tr('give.idNote'));
  idField.hidden = true;
  idNote.hidden = true;
  pick.addEventListener('change', () => {
    const other = pick.value === 'other';
    idField.hidden = !other;
    idNote.hidden = !other;
    id.required = other;
  });
  choicesOf(guild, 'people').then((people) => {
    pick.replaceChildren();
    for (const o of [...people, { id: 'other', name: tr('give.other') }]) {
      const opt = el('option', '', o.name);
      opt.value = o.id;
      pick.append(opt);
    }
    pick.dispatchEvent(new Event('change'));
  });
  form.append(field(tr('give.to'), pick), idField, idNote);
  const actions = el('div', 'actions');
  const submit = el('button', 'primary', tr('give.confirm'));
  submit.type = 'submit';
  actions.append(submit, button(tr('cancel'), onDone));
  form.append(actions);
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const to = pick.value === 'other' ? id.value.trim() : pick.value;
    if (!to) return;
    submit.disabled = true;
    const ok = await change('POST', url, { to });
    submit.disabled = false;
    if (ok) onDone();
  });
  return form;
}

/** The form for a new Chronicle (no `ch`) or for renaming one and changing its sect. */
function chronicleForm(ch, onDone) {
  const form = el('form', 'sheet-form');
  const name = el('input');
  name.name = 'name';
  name.required = true;
  name.maxLength = me.options.maxName;
  name.value = ch?.name ?? '';
  if (!ch && me.guilds.length > 1) {
    form.append(field(tr('server'), select('guild', me.guilds, me.guilds[0].id)));
  }
  form.append(
    field(tr('name'), name),
    field(tr('sect'), select('sect', me.options.sects, ch?.sectId ?? 'camarilla')),
    field(
      tr('chronicles.tier'),
      select(
        'tier',
        [{ id: '', name: tr('chronicles.anyTier') }, ...me.options.chronicleTiers],
        ch?.tierId ?? '',
      ),
    ),
  );
  if (ch) {
    // Where it is played on Discord and the bot's language there.
    const channel = select(
      'channel',
      [
        { id: '', name: tr('chronicles.noChannel') },
        ...(ch.channel ? [{ id: ch.channel, name: ch.channelName ?? ch.channel }] : []),
      ],
      ch.channel,
    );
    choicesOf(ch.guild, 'channels').then((channels) => {
      const current = channel.value;
      channel.replaceChildren();
      const list = [{ id: '', name: tr('chronicles.noChannel') }, ...channels];
      if (current && !channels.some((c) => c.id === current)) {
        list.push({ id: current, name: ch.channelName ?? current });
      }
      for (const o of list) {
        const opt = el('option', '', o.name);
        opt.value = o.id;
        opt.selected = o.id === current;
        channel.append(opt);
      }
    });
    form.append(
      field(tr('chronicles.channel'), channel),
      el('p', 'note', tr('chronicles.channelNote')),
      field(
        tr('chronicles.language'),
        select(
          'locale',
          [{ id: '', name: tr('chronicles.autoLanguage') }, ...me.options.languages],
          ch.locale,
        ),
      ),
    );
  }
  const actions = el('div', 'actions');
  const submit = el('button', 'primary', tr(ch ? 'save' : 'create'));
  submit.type = 'submit';
  actions.append(submit, button(tr('cancel'), onDone));
  form.append(actions);
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const body = { name: data.get('name'), sect: data.get('sect'), tier: data.get('tier') };
    if (ch) {
      body.channel = data.get('channel') ?? '';
      body.locale = data.get('locale') ?? '';
    } else body.guild = data.get('guild') ?? me.guilds[0].id;
    submit.disabled = true;
    const ok = await change('POST', ch ? `/api/chronicles/${ch.id}` : '/api/chronicles', body);
    submit.disabled = false;
    if (ok) onDone();
  });
  return form;
}

function chronicleBlock(ch) {
  const path = `/api/chronicles/${ch.id}`;
  const block = el('div', ch.live ? 'chronicle live' : 'chronicle');
  const title = el('h3', '', ch.name);
  if (ch.live) title.append(el('span', 'badge', tr('live')));
  const tools = el('div', 'actions');
  if (!ch.live) tools.append(button(tr('goLive'), () => change('POST', `${path}/live`), 'primary'));
  tools.append(
    button(tr('edit'), () => {
      const form = chronicleForm(ch, () => form.replaceWith(tools));
      tools.replaceWith(form);
    }),
  );
  if (ch.channel) {
    tools.append(
      confirmButton(tr('chronicles.end'), async () => {
        if (await change('POST', `${path}/end`)) notify(tr('chronicles.ended'));
      }),
    );
  }
  tools.append(
    button(tr('chronicles.transfer'), () => {
      const form = recipientForm(ch.guild, `${path}/transfer`, () => form.replaceWith(tools));
      tools.replaceWith(form);
    }),
    confirmButton(tr('chronicles.archive'), () => change('POST', `${path}/archive`)),
  );
  const masquerade = el('div', 'track masquerade');
  const step = (delta) => () => change('POST', `${path}/masquerade`, { delta });
  const value = el('span', 'value');
  const minus = button('−', step(-1), 'step');
  const plus = button('+', step(1), 'step');
  minus.setAttribute('aria-label', 'Masquerade −1');
  plus.setAttribute('aria-label', 'Masquerade +1');
  value.append(minus, el('strong', '', `${ch.masquerade}/10`), plus);
  masquerade.append(
    el('span', 'label', 'Masquerade'),
    el('span', 'boxes', boxes(ch.masquerade, 10 - ch.masquerade)),
    value,
  );
  const meta = [
    ch.sect,
    ch.tier ?? tr('chronicles.anyTier'),
    ch.channelName ?? tr('chronicles.noChannel'),
  ].join(' · ');
  block.append(title, el('div', 'meta', meta), masquerade, tools);
  const cards = el('div', 'cards');
  cards.append(...ch.characters.map((c) => characterCard(c, ch)));
  block.append(ch.characters.length ? cards : el('p', 'empty', tr('noMembers')));
  return block;
}

/** A read-only field with a copy button, for the overlay address and key. */
function copyField(label, value) {
  const input = el('input');
  input.readOnly = true;
  input.value = value;
  const copy = button(tr('copy'), async () => {
    input.select();
    await navigator.clipboard?.writeText(value).catch(() => undefined);
    copy.textContent = tr('copied');
  });
  const row = el('div', 'copy-row');
  row.append(input, copy);
  return field(label, row);
}

/** The scene's settings: size, layout, roll box, background and the Storyteller's webcam. */
function stageBox(pages) {
  const st = pages.stage;
  const box = el('div', 'stage-box');
  box.append(el('h4', '', tr('stage.title')));
  const save = (patch) => change('POST', '/api/stage', patch);
  const resolution = select(
    'resolution',
    [
      { id: '1080', name: 'Full HD · 1920 × 1080' },
      { id: '1440', name: '2K · 2560 × 1440' },
    ],
    st.resolution,
  );
  resolution.addEventListener('change', () => save({ resolution: resolution.value }));
  const layout = select(
    'layout',
    pages.layouts.map((id) => ({ id, name: tr(`layout.${id}`) })),
    st.layout,
  );
  layout.addEventListener('change', () => save({ layout: layout.value }));
  const rollBox = el('input');
  rollBox.type = 'checkbox';
  rollBox.checked = st.rollBox;
  rollBox.addEventListener('change', () => save({ rollBox: rollBox.checked }));
  const check = el('label', 'check');
  check.append(rollBox, el('span', '', tr('stage.rollBox')));
  box.append(field(tr('stage.resolution'), resolution), field(tr('stage.layout'), layout), check);

  // Background: the file goes as it is, the server checks it is an image.
  const file = el('input');
  file.type = 'file';
  file.accept = pages.backgroundTypes.join(',');
  file.hidden = true;
  file.addEventListener('change', async () => {
    const image = file.files?.[0];
    if (!image) return;
    if (image.size > 8 * 1024 * 1024) return notify(tr('stage.tooBig'));
    const response = await fetch('/api/stage/background', {
      method: 'PUT',
      credentials: 'same-origin',
      headers: {
        'Content-Type': image.type || 'application/octet-stream',
        'X-CSRF-Token': me.csrf,
      },
      body: image,
    });
    if (!response.ok)
      return notify(tr(response.status === 415 ? 'stage.badImage' : 'error.change'));
    await loadPanel();
  });
  const bgActions = el('div', 'actions');
  bgActions.append(
    button(tr('stage.upload'), () => file.click()),
    file,
  );
  if (st.background) {
    bgActions.append(
      confirmButton(tr('stage.removeBackground'), () => change('DELETE', '/api/stage/background')),
    );
  }
  box.append(
    el('h4', '', tr('stage.background')),
    el(
      'p',
      'note',
      `${tr(st.background ? 'stage.hasBackground' : 'stage.noBackground')} ${tr('stage.backgroundNote')}`,
    ),
    bgActions,
  );

  // The Storyteller's own webcam, in their frame.
  const camActions = el('div', 'actions');
  box.append(el('h4', '', tr('cam.mine')));
  if (st.cam) {
    box.append(copyField(tr('cam.myLink'), st.cam.push));
    camActions.append(
      confirmButton(tr('cam.renew'), () => change('POST', '/api/stage/cam')),
      confirmButton(tr('cam.remove'), () => change('DELETE', '/api/stage/cam')),
    );
  } else {
    camActions.append(button(tr('cam.create'), () => change('POST', '/api/stage/cam')));
  }
  box.append(camActions);
  return box;
}

/** The Storyteller's key for the OBS overlay; a new key is shown once, then only its date. */
function overlayBox(newKey) {
  const box = el('div', 'overlay-box');
  box.append(el('h3', '', tr('overlay.title')));

  // The OBS addresses carry the view key: they can only show the frames.
  const pages = me.overlay;
  if (pages) {
    const base = `${location.origin}/overlay`;
    const v = `v=${encodeURIComponent(pages.viewKey)}`;
    box.append(
      el('p', 'note', tr('overlay.pages')),
      copyField(tr('overlay.scene'), `${base}/scena?${v}`),
      copyField(tr('overlay.storyteller'), `${base}/frame?pg=storyteller&${v}`),
      copyField(tr('overlay.roll'), `${base}/frame?pg=tiro&${v}`),
      ...pages.characters.map((c) => copyField(c.name, `${base}/frame?pg=${c.id}&${v}`)),
    );
    box.append(stageBox(pages));
    const layout = window.ELDER?.sceneLayout;
    if (layout) {
      const names = [...pages.characters.map((c) => c.name), 'Storyteller'];
      const st = pages.stage;
      const width = st.resolution === '1440' ? 2560 : 1920;
      const slots = layout(names.length, { layout: st.layout, width, rollBox: st.rollBox });
      const details = el('details', 'slots');
      const list = el('ul');
      list.append(
        ...names.map((name, i) => {
          const r = slots[i];
          return el('li', '', `${name} · X ${r.x}, Y ${r.y} · ${r.w} × ${r.h}`);
        }),
      );
      details.append(
        el('summary', '', tr('overlay.slots')),
        el('p', 'note', tr('overlay.slotsNote')),
        list,
      );
      box.append(details);
    }
    const renew = el('div', 'actions');
    renew.append(
      confirmButton(tr('overlay.newPages'), () => change('POST', '/api/overlay-view-key')),
    );
    box.append(renew);
  }

  box.append(el('h4', '', tr('overlay.deck')));
  const actions = el('div', 'actions');
  const make = async () => {
    const response = await fetch('/api/overlay-key', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'X-CSRF-Token': me.csrf },
    });
    if (!response.ok) return notify(tr('error.change'));
    const { key } = await response.json();
    await loadPanel();
    document.getElementById('overlay').replaceChildren(overlayBox(key));
  };
  if (newKey) {
    const first = pages?.characters[0]?.id ?? 'pg';
    box.append(
      el('p', 'note', tr('overlay.once')),
      copyField(tr('overlay.key'), newKey),
      copyField(
        tr('overlay.example'),
        `${location.origin}/api/overlay/adjust?pg=${first}&track=vitae&delta=-1`,
      ),
    );
  } else if (me.overlayKey) {
    const since = new Date(me.overlayKey).toLocaleString(lang);
    box.append(el('p', 'note', `${tr('overlay.since')} ${since}.`));
    actions.append(
      confirmButton(tr('overlay.renew'), make),
      confirmButton(tr('overlay.revoke'), () => change('DELETE', '/api/overlay-key')),
    );
  } else {
    box.append(el('p', 'note', tr('overlay.none')));
    actions.append(button(tr('overlay.create'), make));
  }
  if (actions.childElementCount) box.append(actions);
  return box;
}

/** A sheet in progress from the guided creation, with links to go on or throw it away. */
function draftCard(draft) {
  const card = el('div', 'card');
  const data = draft.data;
  card.append(el('h3', '', data.name || tr('drafts.untitled')));
  const tier = data.tier.charAt(0).toUpperCase() + data.tier.slice(1);
  const when = new Date(draft.updatedAt).toLocaleDateString(lang);
  const meta = [tier, data.clan ? clanName(data.clan) : '', `${tr('drafts.updated')} ${when}`];
  card.append(el('div', 'meta', meta.filter(Boolean).join(' · ')));
  const actions = el('div', 'actions');
  const go = el('a', 'button', tr('drafts.continue'));
  go.href = `/crea?bozza=${draft.id}`;
  actions.append(
    go,
    confirmButton(tr('delete'), () => change('DELETE', `/api/drafts/${draft.id}`)),
  );
  card.append(actions);
  return card;
}

/** Alpha 2.0 clans are the bot's own, but for Giovanni (the bot still says Hecata). */
const clanName = (id) =>
  me.options.clans.find((c) => c.id === id)?.name ?? (id === 'giovanni' ? 'Giovanni' : id);

async function loadDrafts() {
  const response = await fetch('/api/drafts', { credentials: 'same-origin' });
  if (!response.ok) return;
  const { drafts } = await response.json();
  document.getElementById('drafts').replaceChildren(...drafts.map(draftCard));
  document.getElementById('drafts-section').hidden = drafts.length === 0;
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

  document.getElementById('chronicles-empty').hidden = me.chronicles.length > 0;
  document.getElementById('chronicles').replaceChildren(...me.chronicles.map(chronicleBlock));
  // The OBS overlay is for Storytellers; a player only needs their webcam link, on the card.
  const overlay = document.getElementById('overlay');
  if (me.overlay) overlay.replaceChildren(overlayBox());
  else overlay.replaceChildren();
  await loadDrafts();
}

function setUpPanel() {
  document.getElementById('logout').addEventListener('click', async () => {
    await fetch('/logout', { method: 'POST', headers: { 'X-CSRF-Token': me.csrf } });
    location.href = '/';
  });
  opener('new-character', 'new-character-slot', characterForm);
  opener('new-chronicle', 'new-chronicle-slot', chronicleForm);
}

/** Wires a "new …" button to show its form in a slot, once the user's servers are known. */
function opener(buttonId, slotId, makeForm) {
  const open = document.getElementById(buttonId);
  const slot = document.getElementById(slotId);
  open.addEventListener('click', () => {
    if (!me.guilds.length) {
      notify(tr('noServer'));
      return;
    }
    open.hidden = true;
    const form = makeForm(undefined, () => {
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
