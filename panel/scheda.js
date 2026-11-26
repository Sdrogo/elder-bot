/* global document, fetch, location, navigator, URLSearchParams */
// A character's full Alpha 2.0 sheet, as the creation wizard saved it. The owner and the
// Storyteller of its Chronicle can read it; the Storyteller also answers the choices that need
// their approval. Every text goes in with textContent: names come from users.

import {
  coterieHavenDots,
  evaluate,
  isCoterieHaven,
  lifepathOf,
  resourceTotals,
  skillDots,
} from '/game/creation.js';
import { MERITS_BY_ID, PATHS, SIRES_BY_ID } from '/game/alpha2/background.js';
import { CLAN_INFO, CLAN_TRAITS_BY_ID } from '/game/alpha2/clans.js';
import {
  DISCIPLINE_DETAILS,
  LIFEPATH_DETAILS,
  MERIT_DETAILS,
  POWER_DETAILS,
} from '/game/alpha2/details.js';
import {
  ATTRIBUTE_CATEGORIES,
  ATTRIBUTE_NAMES,
  ATTRIBUTES_BY_CATEGORY,
  RESOURCE_INFO,
  SKILL_INFO,
  SKILLS,
} from '/game/alpha2/core.js';
import { DISCIPLINE_NAMES, DISCIPLINES, POWERS_BY_ID } from '/game/alpha2/disciplines.js';
import { TIER_RULES } from '/game/alpha2/tiers.js';
import { XP_COSTS, advanceOptions, learnablePowers } from '/game/advancement.js';

const TEXT = {
  it: {
    back: '← Pannello',
    error: 'Scheda non trovata, o non puoi vederla.',
    sire: 'Sire',
    generation: (g) => `${g}ª generazione`,
    young: 'giovane',
    lifepaths: 'Lifepath',
    attributes: 'Attributi',
    skills: 'Skill',
    disciplines: 'Discipline',
    traits: 'Tratti di clan',
    merits: 'Merit',
    morality: 'Humanity o Path',
    resources: 'Resources',
    coterieHaven: 'Haven di coterie',
    flaws: 'Flaws',
    trackers: 'Tracciati',
    more: 'Dettagli',
    approvals: 'Approvazioni del Narratore',
    editSheet: 'Modifica scheda',
    xp: 'Esperienza (XP)',
    'spend.title': 'Spendi XP',
    'spend.open': 'Spendi XP…',
    'spend.choose': 'Scegli cosa migliorare',
    'spend.left': (name, cost, left) => `${name}: ${cost} XP, ne restano ${left}`,
    'spend.ask': 'richiede il Narratore',
    'spend.close': 'Chiudi',
    'spend.confirm': 'Compra',
    'spend.skill': 'Skill',
    'group.attribute': 'Attributes',
    'group.skill': 'Skills',
    'group.discipline': 'Disciplines',
    'group.power': 'Poteri',
    'group.merit': 'Merits',
    'group.trait': 'Tratti di clan',
    'group.other': 'Altro',
    'tab.sheet': 'Scheda',
    'tab.xp': (n) => `XP · ${n}`,
    'tab.requests': (n) => (n === 1 ? '1 richiesta' : `${n} richieste`),
    'xp.history': 'Storico',
    'spend.pick': 'Cosa vuoi migliorare',
    'spend.power': 'Potere gratuito del nuovo dot',
    'spend.button': (cost) => `Compra (${cost} XP)`,
    'spend.specialty': 'Nuova specialty',
    'spend.specialtyName': 'Nome della specialty',
    'spend.failed': 'Acquisto non riuscito. Ricarica la scheda e riprova.',
    'spend.short': 'XP insufficienti.',
    'spend.none': 'Niente da comprare con gli XP che hai.',
    'spend.note':
      'Le Resource non si comprano con XP; Humanity e Discipline o tratti fuori clan si chiedono al Narratore.',
    'kind.attribute': 'Attributo',
    'kind.skill': 'Skill',
    'kind.merit': 'Merit',
    'kind.trait': 'Tratto di clan',
    'kind.discipline': 'Disciplina (+1 dot)',
    'kind.power': 'Potere',
    'kind.specialty': 'Specialty',
    'kind.humanity': 'Humanity +1',
    'request.pick': 'Da chiedere al Narratore',
    'request.button': 'Chiedi al Narratore',
    'request.duplicate': 'Hai già chiesto questo al Narratore.',
    'request.title': 'Richieste al Narratore',
    'request.cancel': 'Ritira',
    'request.approve': 'Approva e compra',
    'request.refuse': 'Rifiuta',
    'refund.button': 'Annulla acquisto',
    'refund.dependent': 'Prima annulla gli acquisti che dipendono da questo.',
    'xp.refund': 'Rimborso',
    'xp.balance': 'Da spendere',
    'xp.earned': 'Guadagnati in tutto',
    'xp.empty': 'Nessun XP ancora: il Narratore li assegna a fine sessione.',
    'xp.session': (list) => `Sessione: ${list}`,
    'xp.spend': 'Spesa',
    'xp.other': 'Altro',
    'cond.ambition': 'Ambition',
    'cond.beast': 'Facing the Beast',
    'cond.flaw': 'Flaw',
    'cond.loss': 'Loss',
    'cond.survival': 'Survival',
    editFailed: 'Non riesco ad aprire la modifica. Riprova.',
    editLimit: 'Hai troppe bozze aperte: cancellane una dal pannello.',
    'status.pending': 'da approvare',
    'status.approved': 'approvato',
    'status.rejected': 'rifiutato',
    approve: 'Approva',
    reject: 'Rifiuta',
    noChronicle: 'Il Narratore potrà approvarlo quando il personaggio entrerà in una Cronaca.',
    broodChild: (mate) => `Brood Child: impara la Disciplina da ${mate || '?'}`,
    customLifepathApproval: (name) => `Lifepath personalizzato: ${name || '?'}`,
    customLifepath: 'personalizzato',
    path: (name) => `Segue il ${name} invece di Humanity`,
    none: 'Nessuno',
    'cat.physical': 'Fisici',
    'cat.social': 'Sociali',
    'cat.mental': 'Mentali',
  },
  en: {
    back: '← Panel',
    error: 'Sheet not found, or you cannot see it.',
    sire: 'Sire',
    generation: (g) => `Generation ${g}`,
    young: 'young',
    lifepaths: 'Lifepaths',
    attributes: 'Attributes',
    skills: 'Skills',
    disciplines: 'Disciplines',
    traits: 'Clan traits',
    merits: 'Merits',
    morality: 'Humanity or Path',
    resources: 'Resources',
    coterieHaven: 'Coterie haven',
    flaws: 'Flaws',
    trackers: 'Trackers',
    more: 'Details',
    approvals: 'Storyteller approvals',
    editSheet: 'Edit sheet',
    xp: 'Experience (XP)',
    'spend.title': 'Spend XP',
    'spend.open': 'Spend XP…',
    'spend.choose': 'Pick what to improve',
    'spend.left': (name, cost, left) => `${name}: ${cost} XP, ${left} left`,
    'spend.ask': 'needs the Storyteller',
    'spend.close': 'Close',
    'spend.confirm': 'Buy',
    'spend.skill': 'Skill',
    'group.attribute': 'Attributes',
    'group.skill': 'Skills',
    'group.discipline': 'Disciplines',
    'group.power': 'Powers',
    'group.merit': 'Merits',
    'group.trait': 'Clan traits',
    'group.other': 'Other',
    'tab.sheet': 'Sheet',
    'tab.xp': (n) => `XP · ${n}`,
    'tab.requests': (n) => (n === 1 ? '1 request' : `${n} requests`),
    'xp.history': 'History',
    'spend.pick': 'What to improve',
    'spend.power': 'Free power for the new dot',
    'spend.button': (cost) => `Buy (${cost} XP)`,
    'spend.specialty': 'New specialty',
    'spend.specialtyName': 'Specialty name',
    'spend.failed': 'Purchase failed. Reload the sheet and try again.',
    'spend.short': 'Not enough XP.',
    'spend.none': 'Nothing to buy with the XP you have.',
    'spend.note':
      'Resources cannot be bought with XP; Humanity and out-of-clan Disciplines or traits are asked of the Storyteller.',
    'kind.attribute': 'Attribute',
    'kind.skill': 'Skill',
    'kind.merit': 'Merit',
    'kind.trait': 'Clan trait',
    'kind.discipline': 'Discipline (+1 dot)',
    'kind.power': 'Power',
    'kind.specialty': 'Specialty',
    'kind.humanity': 'Humanity +1',
    'request.pick': 'To ask the Storyteller',
    'request.button': 'Ask the Storyteller',
    'request.duplicate': 'You already asked for this.',
    'request.title': 'Requests to the Storyteller',
    'request.cancel': 'Withdraw',
    'request.approve': 'Approve and buy',
    'request.refuse': 'Refuse',
    'refund.button': 'Undo purchase',
    'refund.dependent': 'Undo the purchases that depend on this one first.',
    'xp.refund': 'Refund',
    'xp.balance': 'To spend',
    'xp.earned': 'Earned in total',
    'xp.empty': 'No XP yet: the Storyteller awards it at the end of a session.',
    'xp.session': (list) => `Session: ${list}`,
    'xp.spend': 'Spent',
    'xp.other': 'Other',
    'cond.ambition': 'Ambition',
    'cond.beast': 'Facing the Beast',
    'cond.flaw': 'Flaw',
    'cond.loss': 'Loss',
    'cond.survival': 'Survival',
    editFailed: 'Could not open the editor. Try again.',
    editLimit: 'You have too many open drafts: delete one from the panel.',
    'status.pending': 'waiting',
    'status.approved': 'approved',
    'status.rejected': 'rejected',
    approve: 'Approve',
    reject: 'Reject',
    noChronicle: 'The Storyteller can approve it once the character joins a Chronicle.',
    broodChild: (mate) => `Brood Child: learns the Discipline from ${mate || '?'}`,
    customLifepathApproval: (name) => `Custom lifepath: ${name || '?'}`,
    customLifepath: 'custom',
    path: (name) => `Follows the ${name} instead of Humanity`,
    none: 'None',
    'cat.physical': 'Physical',
    'cat.social': 'Social',
    'cat.mental': 'Mental',
  },
};

const lang = navigator.language?.toLowerCase().startsWith('it') ? 'it' : 'en';
const tr = (key, ...args) => {
  const v = TEXT[lang][key] ?? TEXT.en[key] ?? key;
  return typeof v === 'function' ? v(...args) : v;
};
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
/** Dots with the number beside them, which is easier to add up (Andrea's choice). */
function dotsText(n, max) {
  const box = el('span', 'rating');
  const dots = '●'.repeat(Math.max(0, n)) + '○'.repeat(Math.max(0, max - n));
  box.append(el('span', 'dots', dots), el('span', 'num', String(Math.max(0, n))));
  return box;
}

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = String(text);
  return node;
}

/** A folded box with a longer explanation; paragraphs are separated by blank lines. */
function more(text) {
  const box = el('details', 'more');
  box.append(el('summary', '', tr('more')));
  for (const para of text.split('\n\n')) box.append(el('p', '', para));
  return box;
}

function section(title, ...children) {
  const box = el('section', 'card sheet-section');
  box.append(el('h3', '', title), ...children);
  return box;
}

function row(label, value, note) {
  const r = el('div', 'trait');
  const left = el('span', 'disc-title');
  left.append(el('span', '', label));
  if (note) left.append(el('span', 'quiet', note));
  r.append(left, typeof value === 'object' ? value : el('span', 'num', value));
  return r;
}

const empty = () => el('p', 'quiet', tr('none'));

let me;
let id;

async function load() {
  const response = await fetch(`/api/characters/${id}/sheet`, { credentials: 'same-origin' });
  if (response.status === 401) {
    location.href = '/';
    return;
  }
  if (!response.ok) throw new Error(String(response.status));
  draw(await response.json());
}

function notify(text) {
  const box = document.getElementById('notice');
  box.textContent = text;
  box.hidden = false;
}

/** Opens the wizard on this sheet: the server makes a draft of it and the wizard changes it. */
async function edit(button) {
  button.disabled = true;
  const response = await fetch(`/api/characters/${id}/edit`, {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'X-CSRF-Token': me.csrf },
  });
  if (response.ok) {
    const { draft } = await response.json();
    location.href = `/crea?bozza=${draft.id}`;
    return;
  }
  const data = await response.json().catch(() => ({}));
  notify(tr(data.error === 'limit' ? 'editLimit' : 'editFailed'));
  button.disabled = false;
}

/** A purchase in words: its kind and what it bought. */
function advanceLabel(a) {
  if (!a) return '';
  const name =
    a.kind === 'attribute'
      ? ATTRIBUTE_NAMES[a.id]
      : a.kind === 'skill'
        ? SKILL_INFO[a.id].name
        : a.kind === 'specialty'
          ? `${SKILL_INFO[a.skill].name}: ${a.name}`
          : a.kind === 'merit'
            ? MERITS_BY_ID.get(a.id)?.name
            : a.kind === 'trait'
              ? CLAN_TRAITS_BY_ID.get(a.id)?.name
              : a.kind === 'discipline'
                ? `${DISCIPLINE_NAMES[a.id]}${a.power ? ` + ${POWERS_BY_ID.get(a.power)?.name}` : ''}`
                : a.kind === 'humanity'
                  ? ''
                  : POWERS_BY_ID.get(a.id)?.name;
  return `${tr(`kind.${a.kind}`)} ${name ?? ''}`.trim();
}

async function post(action, body, button) {
  button.disabled = true;
  const response = await fetch(`/api/characters/${id}/${action}`, {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': me.csrf },
    body: JSON.stringify(body),
  });
  if (response.ok) {
    document.querySelector('dialog[open]')?.close();
    draw(await response.json());
    return;
  }
  const data = await response.json().catch(() => ({}));
  notify(
    tr(
      data.error === 'short'
        ? 'spend.short'
        : data.error === 'dependent'
          ? 'refund.dependent'
          : data.error === 'duplicate'
            ? 'request.duplicate'
            : 'spend.failed',
    ),
  );
  button.disabled = false;
}

const buy = (advance, button) => post('spend', { advance }, button);
const ask = (advance, button) => post('request', { advance }, button);

/** The current and next value of what a purchase raises, e.g. "3 → 4"; empty when none. */
function stepText(d, a, character) {
  const now =
    a.kind === 'attribute'
      ? Math.max(1, d.attributes[a.id] ?? 0)
      : a.kind === 'skill'
        ? skillDots(d, a.id)
        : a.kind === 'discipline'
          ? (d.disciplines[a.id] ?? 0)
          : a.kind === 'humanity'
            ? character.humanity.rank
            : undefined;
  return now === undefined ? '' : `${now} → ${now + 1}`;
}

const GROUPS = ['attribute', 'skill', 'discipline', 'power', 'merit', 'trait', 'other'];
const groupOf = (a) => (GROUPS.includes(a.kind) ? a.kind : 'other');
/** A name without the kind in front, since the dialog groups by kind. */
function shortLabel(a) {
  if (a.kind === 'attribute') return ATTRIBUTE_NAMES[a.id];
  if (a.kind === 'skill') return SKILL_INFO[a.id].name;
  if (a.kind === 'discipline') return DISCIPLINE_NAMES[a.id];
  if (a.kind === 'humanity') return 'Humanity';
  return advanceLabel(a)
    .replace(tr(`kind.${a.kind}`), '')
    .trim();
}

/**
 * The owner's shop, in a dialog: every trait that can be raised, grouped by kind, with its cost.
 * The ones the XP do not cover are greyed out; the ones that need the Storyteller are marked
 * and are asked for instead of bought. A Discipline dot picks its free power here too.
 */
function openSpend(d, balance, character) {
  const dialog = el('dialog', 'spend-dialog');
  const form = el('form');
  form.method = 'dialog';
  const head = el('header');
  head.append(el('h3', '', `${tr('spend.title')} · ${tr('xp.balance')} ${balance}`));
  const close = el('button', '', tr('spend.close'));
  close.type = 'button';
  close.addEventListener('click', () => dialog.close());
  head.append(close);
  const body = el('div', 'spend-list');
  const options = advanceOptions(d).filter(
    (o) =>
      o.reasons.every((r) => r.kind === 'storyteller' || r.kind === 'incomplete') &&
      !(
        o.advance.kind === 'humanity' &&
        (character.humanity.violations > 0 || character.humanity.rank >= 10)
      ),
  );
  // A new Specialty: on any Skill with a dot, its name typed in the dialog.
  const specialtySkills = SKILLS.filter((x) => skillDots(d, x) >= 1);
  const entries = options.map((o) => ({
    ...o,
    ask: o.reasons.some((r) => r.kind === 'storyteller'),
  }));
  if (specialtySkills.length) {
    entries.push({
      advance: { kind: 'specialty' },
      cost: XP_COSTS.specialty,
      ask: false,
      reasons: [],
    });
  }
  const extra = el('div', 'spend-extra');
  const summary = el('span', 'quiet', tr('spend.choose'));
  const confirm = el('button', 'primary', tr('spend.confirm'));
  confirm.type = 'button';
  confirm.disabled = true;
  let chosen;
  let readAdvance = () => undefined;

  const pick = (entry) => {
    chosen = entry;
    extra.replaceChildren();
    const a = entry.advance;
    readAdvance = () => a;
    if (a.kind === 'discipline') {
      const offer = learnablePowers(d, a.id, (d.disciplines[a.id] ?? 0) + 1);
      if (offer.length) {
        const choose = el('select');
        for (const power of offer) {
          const opt = el('option', '', POWERS_BY_ID.get(power).name);
          opt.value = power;
          choose.append(opt);
        }
        const wrap = el('label', 'field');
        wrap.append(el('span', '', tr('spend.power')), choose);
        extra.append(wrap);
        readAdvance = () => ({ kind: 'discipline', id: a.id, power: choose.value });
      }
    }
    if (a.kind === 'specialty') {
      const skill = el('select');
      for (const x of specialtySkills) {
        const opt = el('option', '', SKILL_INFO[x].name);
        opt.value = x;
        skill.append(opt);
      }
      const name = el('input');
      name.maxLength = 40;
      name.placeholder = tr('spend.specialtyName');
      const a1 = el('label', 'field');
      a1.append(el('span', '', tr('spend.skill')), skill);
      const a2 = el('label', 'field');
      a2.append(el('span', '', tr('spend.specialtyName')), name);
      extra.append(a1, a2);
      readAdvance = () =>
        name.value.trim()
          ? { kind: 'specialty', skill: skill.value, name: name.value.trim() }
          : undefined;
    }
    const label = a.kind === 'specialty' ? tr('spend.specialty') : shortLabel(a);
    summary.textContent = tr('spend.left', label, entry.cost, balance - entry.cost);
    confirm.textContent = entry.ask ? tr('request.button') : tr('spend.confirm');
    confirm.disabled = false;
  };

  // One dropdown, grouped by kind; what the XP do not cover is listed but disabled.
  const select = el('select', 'spend-select');
  const blank = el('option', '', tr('spend.choose'));
  blank.value = '';
  select.append(blank);
  const byValue = new Map();
  for (const group of GROUPS) {
    const list = entries.filter((e) =>
      e.advance.kind === 'specialty' || e.advance.kind === 'humanity'
        ? group === 'other'
        : groupOf(e.advance) === group,
    );
    if (!list.length) continue;
    const optgroup = el('optgroup');
    optgroup.label = tr(`group.${group}`);
    for (const entry of list) {
      const a = entry.advance;
      const name = a.kind === 'specialty' ? tr('spend.specialty') : shortLabel(a);
      const step = stepText(d, a, character);
      const opt = el(
        'option',
        '',
        `${name}${step ? ` ${step}` : ''}${entry.ask ? ` ${tr('spend.ask')}` : ''} · ${entry.cost} XP`,
      );
      opt.value = String(byValue.size);
      opt.disabled = entry.cost > balance;
      byValue.set(opt.value, entry);
      optgroup.append(opt);
    }
    select.append(optgroup);
  }
  select.addEventListener('change', () => {
    const entry = byValue.get(select.value);
    if (entry) pick(entry);
    else {
      chosen = undefined;
      extra.replaceChildren();
      summary.textContent = tr('spend.choose');
      confirm.disabled = true;
    }
  });
  if (entries.length) body.append(select);
  if (!entries.length) body.append(el('p', 'quiet', tr('spend.none')));

  confirm.addEventListener('click', () => {
    const advance = readAdvance();
    if (!chosen || !advance) return;
    (chosen.ask ? ask : buy)(advance, confirm);
  });
  const foot = el('footer');
  foot.append(summary, confirm);
  form.append(head, body, extra, foot);
  dialog.append(form, el('p', 'quiet spend-note', tr('spend.note')));
  dialog.addEventListener('close', () => dialog.remove());
  document.body.append(dialog);
  dialog.showModal();
}

/** XP balance and the log of awards and spending, newest first. */
function xpSection(xp, character, canApprove) {
  const list = el('div');
  const undone = new Set(xp.log.filter((e) => e.ref !== undefined).map((e) => e.ref));
  if (!xp.log.length) list.append(el('p', 'quiet', tr('xp.empty')));
  for (const r of xp.requests ?? []) {
    const line = row(`${tr('request.title')}: ${advanceLabel(r.advance)}`, `${r.cost}`);
    const buttons = el('span', 'chips');
    const yes = el('button', 'chip', tr('request.approve'));
    const no = el('button', 'chip', tr(canApprove ? 'request.refuse' : 'request.cancel'));
    yes.type = 'button';
    no.type = 'button';
    yes.addEventListener('click', () => post('answer', { request: r.id, approved: true }, yes));
    no.addEventListener('click', () =>
      post(canApprove ? 'answer' : 'cancel', { request: r.id, approved: false }, no),
    );
    if (canApprove) buttons.append(yes);
    if (canApprove || character.owned) buttons.append(no);
    line.append(buttons);
    list.append(line);
  }
  for (const e of [...xp.log].reverse()) {
    const what =
      e.kind === 'session'
        ? tr(
            'xp.session',
            e.note
              .split(',')
              .map((c) => tr(`cond.${c}`))
              .join(', '),
          )
        : e.kind === 'other'
          ? `${tr('xp.other')}: ${e.note}`
          : e.kind === 'spend'
            ? `${tr('xp.spend')}: ${advanceLabel(e.advance)}`
            : e.kind === 'refund'
              ? `${tr('xp.refund')}: ${advanceLabel(xp.log.find((x) => x.id === e.ref)?.advance)}`
              : `${tr(`xp.${e.kind}`)}: ${e.note}`;
    const when = new Date(e.at).toLocaleDateString(lang);
    const line = row(what, `${e.amount > 0 ? '+' : ''}${e.amount}`, when);
    if (canApprove && e.kind === 'spend' && !undone.has(e.id)) {
      const undo = el('button', 'chip', tr('refund.button'));
      undo.type = 'button';
      undo.addEventListener('click', () => post('refund', { entry: e.id }, undo));
      line.append(undo);
    }
    list.append(line);
  }
  return section(tr('xp.history'), list);
}

/** The XP tab: what is left and earned, the shop's button, then requests and the log. */
function xpTab(d, xp, character, canApprove) {
  const top = el('div');
  top.append(row(tr('xp.balance'), String(xp.balance)), row(tr('xp.earned'), String(xp.earned)));
  if (character.owned) {
    const open = el('button', 'primary', tr('spend.open'));
    open.type = 'button';
    open.addEventListener('click', () => openSpend(d, xp.balance, character));
    const bar = el('div', 'actions');
    bar.append(open);
    top.append(bar, el('p', 'quiet', tr('spend.note')));
  }
  return [section(tr('xp'), top), xpSection(xp, character, canApprove)];
}

/** Which tab the sheet shows; kept across redraws, so a purchase stays on the XP tab. */
let tab = 'sheet';

async function answer(index, approved) {
  const response = await fetch(`/api/characters/${id}/approval`, {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': me.csrf },
    body: JSON.stringify({ index, approved }),
  });
  if (response.ok) await load();
}

function draw({ character, sheet, canApprove, xp }) {
  const d = sheet.data;
  const t = TIER_RULES[d.tier];
  const ev = evaluate(d);
  const out = [];

  const head = el('div', 'step-head');
  head.append(el('h2', '', character.name));
  const sire = SIRES_BY_ID.get(d.sire);
  const meta = [
    CLAN_INFO[d.clan]?.name ?? character.clan,
    cap(d.tier),
    d.young ? tr('young') : '',
    character.chronicle ?? '',
    sire ? `${tr('sire')}: ${sire.name} (${DISCIPLINE_NAMES[d.sireDiscipline] ?? '?'})` : '',
    d.generation ? tr('generation', d.generation) : '',
  ];
  head.append(el('p', 'quiet', meta.filter(Boolean).join(' · ')));
  const editButton = el('button', 'button', tr('editSheet'));
  editButton.type = 'button';
  editButton.addEventListener('click', () => edit(editButton));
  head.append(editButton);
  out.push(head);

  const sheetPane = el('div');
  const xpPane = el('div');
  if (sheet.approvals.length) {
    const list = el('div');
    sheet.approvals.forEach((a, index) => {
      const text =
        a.code === 'path'
          ? tr('path', PATHS.find((p) => p.id === a.target)?.name ?? a.target)
          : a.code === 'custom-lifepath'
            ? tr('customLifepathApproval', a.target)
            : tr('broodChild', a.target);
      const r = el('div', 'trait');
      const status = el('span', `status ${a.status}`, tr(`status.${a.status}`));
      r.append(el('span', '', text), status);
      if (canApprove && a.status === 'pending') {
        const buttons = el('span', 'chips');
        const yes = el('button', 'chip', tr('approve'));
        yes.type = 'button';
        yes.addEventListener('click', () => answer(index, true));
        const no = el('button', 'chip', tr('reject'));
        no.type = 'button';
        no.addEventListener('click', () => answer(index, false));
        buttons.append(yes, no);
        r.append(buttons);
      }
      list.append(r);
    });
    if (!character.chronicle && sheet.approvals.some((a) => a.status === 'pending')) {
      list.append(el('p', 'quiet', tr('noChronicle')));
    }
    sheetPane.append(section(tr('approvals'), list));
  }

  // The sheet comes first; XP (balance, shop, requests, log) live on their own tab.
  if (xp) {
    const tabs = el('div', 'sheet-tabs');
    tabs.setAttribute('role', 'tablist');
    const pending = (xp.requests ?? []).length;
    const xpLabel = pending
      ? `${tr('tab.xp', xp.balance)} · ${tr('tab.requests', pending)}`
      : tr('tab.xp', xp.balance);
    const buttons = [
      ['sheet', tr('tab.sheet')],
      ['xp', xpLabel],
    ].map(([key, label]) => {
      const b = el('button', pending && key === 'xp' ? 'tab pending' : 'tab', label);
      b.type = 'button';
      b.setAttribute('role', 'tab');
      b.addEventListener('click', () => show(key));
      tabs.append(b);
      return [key, b];
    });
    const show = (key) => {
      tab = key;
      for (const [k, b] of buttons) b.setAttribute('aria-selected', String(k === key));
      sheetPane.hidden = key !== 'sheet';
      xpPane.hidden = key !== 'xp';
    };
    out.push(tabs);
    xpPane.append(...xpTab(d, xp, character, canApprove));
    show(tab);
  }

  const grid = el('div', 'sheet-grid');
  const attrs = el('div', 'attr-grid');
  for (const cat of ATTRIBUTE_CATEGORIES) {
    const col = el('div');
    col.append(el('h4', '', tr(`cat.${cat}`)));
    for (const a of ATTRIBUTES_BY_CATEGORY[cat]) {
      const n = Math.max(1, d.attributes[a] ?? 0);
      col.append(row(ATTRIBUTE_NAMES[a], dotsText(n, t.maxDots)));
    }
    attrs.append(col);
  }
  const attrSection = section(tr('attributes'), attrs);
  attrSection.classList.add('wide');
  grid.append(attrSection);

  const skills = el('div');
  for (const skill of SKILLS) {
    const n = skillDots(d, skill);
    if (!n) continue;
    const specs = (d.specialties[skill] ?? []).filter((x) => x.trim()).join(', ');
    skills.append(row(SKILL_INFO[skill].name, dotsText(n, t.maxSkill), specs));
  }
  grid.append(section(tr('skills'), skills.childElementCount ? skills : empty()));

  const discs = el('div');
  for (const disc of DISCIPLINES) {
    const n = d.disciplines[disc] ?? 0;
    if (!n) continue;
    discs.append(row(DISCIPLINE_NAMES[disc], dotsText(n, t.startDiscipline)));
    if (DISCIPLINE_DETAILS[disc]) discs.append(more(DISCIPLINE_DETAILS[disc]));
    const powers = d.powers
      .map((p) => POWERS_BY_ID.get(p))
      .filter((p) => p?.discipline === disc)
      .sort((a, b) => a.rank - b.rank);
    for (const p of powers) {
      const line = el('div', 'power');
      line.append(
        el('strong', '', p.name),
        el('span', 'quiet', ` · ${DISCIPLINE_NAMES[disc]} + ${ATTRIBUTE_NAMES[p.attribute]}`),
        el('p', 'quiet', p.it),
      );
      if (POWER_DETAILS[p.id]) line.append(more(POWER_DETAILS[p.id]));
      discs.append(line);
    }
  }
  grid.append(section(tr('disciplines'), discs.childElementCount ? discs : empty()));

  const named = (ids, map, details = {}) => {
    const box = el('div');
    for (const x of ids) {
      const item = map.get(x);
      if (!item) continue;
      const line = el('div', 'power');
      line.append(el('strong', '', item.name), el('p', 'quiet', item.it));
      if (details[x]) line.append(more(details[x]));
      box.append(line);
    }
    return box.childElementCount ? box : empty();
  };
  grid.append(section(tr('traits'), named(d.clanTraits, CLAN_TRAITS_BY_ID)));
  grid.append(section(tr('merits'), named(d.merits, MERITS_BY_ID, MERIT_DETAILS)));

  const path = PATHS.find((p) => p.id === d.path);
  grid.append(
    section(
      tr('morality'),
      path ? row(path.name, '', path.it) : row('Humanity', String(character.humanity.rank)),
    ),
  );

  // The totals are keyed in lower case; show each subject as it was written.
  const written = new Map();
  const remember = (kind, subject) => {
    if (subject?.trim()) written.set(`${kind}:${subject.trim().toLowerCase()}`, subject.trim());
  };
  for (const pick of d.lifepaths) {
    lifepathOf(pick)?.resources.forEach((r, i) =>
      remember(r.kind, pick.resourceDetails?.[i] || r.detail),
    );
  }
  for (const r of d.extraResources) remember(r.kind, r.detail);
  const res = el('div');
  for (const [key, n] of resourceTotals(d)) {
    const [kind] = key.split(':');
    const subject = written.get(key);
    const name = RESOURCE_INFO[kind]?.name ?? kind;
    res.append(row(subject ? `${name}: ${subject}` : name, dotsText(n, t.maxDots)));
  }
  const coterie = coterieHavenDots(d);
  if (coterie) {
    const subject = d.extraResources.find((r) => isCoterieHaven(r) && r.detail.trim())?.detail;
    const label = subject ? `${tr('coterieHaven')}: ${subject.trim()}` : tr('coterieHaven');
    res.append(row(label, dotsText(coterie, t.maxDots)));
  }
  grid.append(section(tr('resources'), res.childElementCount ? res : empty()));

  const flaws = el('div');
  for (const f of d.flaws.filter((x) => x.name.trim())) flaws.append(row(f.name, '', f.note));
  grid.append(section(tr('flaws'), flaws.childElementCount ? flaws : empty()));

  const lps = el('div');
  for (const pick of d.lifepaths) {
    const lp = lifepathOf(pick);
    if (!lp) continue;
    lps.append(row(lp.name, '', pick.custom ? `${lp.it} (${tr('customLifepath')})` : lp.it));
    if (pick.custom) {
      const skills = lp.skills.map((x) => SKILL_INFO[x.skill]?.name ?? x.skill).join(', ');
      const res = lp.resources
        .map((r) =>
          r.detail ? `${RESOURCE_INFO[r.kind].name}: ${r.detail}` : RESOURCE_INFO[r.kind].name,
        )
        .join(', ');
      lps.append(el('p', 'quiet', `${skills} · ${res}`));
    }
    if (LIFEPATH_DETAILS[lp.id]) lps.append(more(LIFEPATH_DETAILS[lp.id]));
  }
  grid.append(section(tr('lifepaths'), lps));

  const trackers = el('div');
  trackers.append(
    row('Health', `${character.health.current}/${character.health.max}`),
    row('Willpower', `${character.willpower.current}/${character.willpower.max}`),
    row('Vitae', `${character.vitae.current}/${character.vitae.max}`),
    row('Humanity', String(character.humanity.rank)),
    row('Generation modifier', String(ev.derived.generationModifier)),
  );
  grid.append(section(tr('trackers'), trackers));

  sheetPane.append(grid);
  out.push(sheetPane, xpPane);
  if (!xp) xpPane.hidden = true;
  document.getElementById('sheet').replaceChildren(...out);
  document.title = `ElderBot · ${character.name}`;
}

async function start() {
  document.documentElement.lang = lang;
  document.getElementById('back').textContent = tr('back');
  const meResponse = await fetch('/api/me', { credentials: 'same-origin' });
  if (meResponse.status === 401) {
    location.href = '/';
    return;
  }
  me = await meResponse.json();
  document.getElementById('user').textContent = me.user.name;
  id = Number(new URLSearchParams(location.search).get('id'));
  await load();
}

start().catch(() => {
  const box = document.getElementById('notice');
  box.textContent = tr('error');
  box.hidden = false;
});
