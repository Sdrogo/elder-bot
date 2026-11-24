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
import { advanceOptions, learnablePowers } from '/game/advancement.js';

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

/** The owner's shop: one select of what can be bought now, a free power when a dot brings one. */
function spendSection(d, balance, character) {
  const box = el('div');
  const options = advanceOptions(d).filter((o) => o.reasons.length === 0 && o.cost <= balance);
  box.append(el('p', 'quiet', tr('spend.note')));
  const pick = el('select');
  for (const o of options) {
    const a = o.advance;
    const opt = el('option', '', `${advanceLabel(a)} — ${o.cost} XP`);
    // A Discipline dot's free power is chosen next, so its option is the Discipline itself.
    opt.value = String(options.indexOf(o));
    pick.append(opt);
  }
  // Disciplines need a free power: offer them through their own select below.
  const disciplines = DISCIPLINES.map((disc) => ({
    disc,
    dots: d.disciplines[disc] ?? 0,
  })).filter(({ disc, dots }) => {
    const own =
      d.clan &&
      advanceOptions(d).find((o) => o.advance.kind === 'discipline' && o.advance.id === disc);
    return (
      own && own.cost <= balance && own.reasons.every((r) => r.kind === 'incomplete') && dots >= 0
    );
  });
  const out = [];
  if (options.length) {
    const buyButton = el('button', 'primary', tr('spend.button', options[0].cost));
    buyButton.type = 'button';
    pick.addEventListener('change', () => {
      buyButton.textContent = tr('spend.button', options[Number(pick.value)].cost);
    });
    buyButton.addEventListener('click', () => buy(options[Number(pick.value)].advance, buyButton));
    const wrap = el('label', 'field');
    wrap.append(el('span', '', tr('spend.pick')), pick);
    out.push(wrap, buyButton);
  }
  for (const { disc, dots } of disciplines) {
    const offer = learnablePowers(d, disc, dots + 1);
    const cost = advanceOptions(d).find(
      (o) => o.advance.kind === 'discipline' && o.advance.id === disc,
    ).cost;
    const row2 = el('div', 'trait');
    const choose = el('select');
    for (const power of offer) {
      const opt = el('option', '', POWERS_BY_ID.get(power).name);
      opt.value = power;
      choose.append(opt);
    }
    const go = el('button', 'chip', tr('spend.button', cost));
    go.type = 'button';
    go.addEventListener('click', () =>
      buy({ kind: 'discipline', id: disc, power: choose.value }, go),
    );
    row2.append(el('span', '', `${DISCIPLINE_NAMES[disc]} ${dots} → ${dots + 1}`), choose, go);
    if (offer.length) out.push(row2);
  }
  // Specialties: a Skill with at least one dot and a name.
  if (balance >= 5) {
    const skill = el('select');
    for (const s of SKILLS) {
      if (skillDots(d, s) < 1) continue;
      const opt = el('option', '', SKILL_INFO[s].name);
      opt.value = s;
      skill.append(opt);
    }
    if (skill.childElementCount) {
      const name = el('input');
      name.maxLength = 40;
      name.placeholder = tr('spend.specialtyName');
      const go = el('button', 'chip', tr('spend.button', 5));
      go.type = 'button';
      go.addEventListener('click', () => {
        if (name.value.trim())
          buy({ kind: 'specialty', skill: skill.value, name: name.value.trim() }, go);
      });
      const row3 = el('div', 'trait');
      row3.append(el('span', '', tr('spend.specialty')), skill, name, go);
      out.push(row3);
    }
  }
  // What needs the Storyteller: Humanity, and Disciplines or traits outside the clan.
  const askable = advanceOptions(d).filter(
    (o) =>
      o.cost <= balance &&
      o.reasons.some((r) => r.kind === 'storyteller') &&
      o.reasons.every((r) => r.kind === 'storyteller' || r.kind === 'incomplete') &&
      !(
        o.advance.kind === 'humanity' &&
        (character.humanity.violations > 0 || character.humanity.rank >= 10)
      ),
  );
  const plain = askable.filter((o) => o.reasons.length === 1);
  if (plain.length) {
    const sel = el('select');
    plain.forEach((o, i) => {
      const opt = el('option', '', `${advanceLabel(o.advance)} — ${o.cost} XP`);
      opt.value = String(i);
      sel.append(opt);
    });
    const go = el('button', 'chip', tr('request.button'));
    go.type = 'button';
    go.addEventListener('click', () => ask(plain[Number(sel.value)].advance, go));
    const wrap = el('label', 'field');
    wrap.append(el('span', '', tr('request.pick')), sel);
    out.push(wrap, go);
  }
  for (const o of askable.filter((x) => x.reasons.length > 1)) {
    const disc = o.advance.id;
    const dots = d.disciplines[disc] ?? 0;
    const offer = learnablePowers(d, disc, dots + 1);
    if (!offer.length) continue;
    const row4 = el('div', 'trait');
    const choose = el('select');
    for (const power of offer) {
      const opt = el('option', '', POWERS_BY_ID.get(power).name);
      opt.value = power;
      choose.append(opt);
    }
    const go = el('button', 'chip', tr('request.button'));
    go.type = 'button';
    go.addEventListener('click', () =>
      ask({ kind: 'discipline', id: disc, power: choose.value }, go),
    );
    row4.append(
      el('span', '', `${DISCIPLINE_NAMES[disc]} ${dots} → ${dots + 1} (${o.cost} XP)`),
      choose,
      go,
    );
    out.push(row4);
  }
  if (!out.length) box.append(el('p', 'quiet', tr('spend.none')));
  box.append(...out);
  return box;
}

/** XP balance and the log of awards and spending, newest first. */
function xpSection(xp, character, canApprove) {
  const list = el('div');
  const undone = new Set(xp.log.filter((e) => e.ref !== undefined).map((e) => e.ref));
  list.append(row(tr('xp.balance'), String(xp.balance)), row(tr('xp.earned'), String(xp.earned)));
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
  return section(tr('xp'), list);
}

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
    out.push(section(tr('approvals'), list));
  }

  if (xp) out.push(xpSection(xp, character, canApprove));
  if (xp && character.owned)
    out.push(section(tr('spend.title'), spendSection(d, xp.balance, character)));

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
  // Impairment: the Storyteller's, and the groups Impaired by Health or Willpower at 0.
  const impaired = [
    ...new Set([...(character.impairments ?? []), ...(character.impaired ?? [])]),
  ].map((k) => (['physical', 'social', 'mental'].includes(k) ? `${k} (all)` : k));
  if (impaired.length) trackers.append(row('Impairment', impaired.join(', ')));
  grid.append(section(tr('trackers'), trackers));

  out.push(grid);
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
