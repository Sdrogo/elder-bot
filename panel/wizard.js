/* global document, fetch, location, navigator, history, setTimeout, clearTimeout, URLSearchParams */
// Guided character creation (Alpha 2.0). The rules engine is the server's own code, loaded from
// /game/: the page asks it what is allowed and what is left, and saves the sheet as a draft.
// Every text goes in with textContent: names come from users.

import {
  attributeDots,
  clanOptions,
  emptyDraft,
  evaluate,
  lifepathCount,
  lifepathOptions,
  sireDisciplineOptions,
  sireOptions,
  skillDots,
  specialtySlots,
  youngAllowed,
} from '/game/creation.js';
import { LIFEPATHS, LIFEPATHS_BY_ID, SIRES_BY_ID } from '/game/alpha2/background.js';
import { CLAN_INFO } from '/game/alpha2/clans.js';
import {
  ATTRIBUTE_CATEGORIES,
  ATTRIBUTE_NAMES,
  ATTRIBUTES_BY_CATEGORY,
  RESOURCE_INFO,
  SKILL_INFO,
  SKILLS,
} from '/game/alpha2/core.js';
import { DISCIPLINE_NAMES } from '/game/alpha2/disciplines.js';
import { CREATION_TIERS } from '/game/alpha2/prereq.js';
import {
  LIFEPATH_RESOURCE_DOTS,
  LIFEPATH_SKILL_DOTS,
  TIER_RULES,
  YOUNG_EXTRA_RESOURCES,
  YOUNG_EXTRA_SKILLS,
  YOUNG_MAX_SKILL,
} from '/game/alpha2/tiers.js';

const TEXT = {
  it: {
    back: '← Pannello',
    error: 'Qualcosa è andato storto. Ricarica la pagina.',
    notFound: 'Bozza non trovata: ne parte una nuova.',
    limit: 'Hai già il numero massimo di bozze: eliminane una dal pannello.',
    'save.saved': 'Bozza salvata',
    'save.dirty': 'Modifiche da salvare…',
    'save.saving': 'Salvataggio…',
    'save.error': 'Salvataggio non riuscito: riprovo alla prossima modifica.',
    'save.new': 'Bozza non ancora salvata',
    'step.type': 'Tipo',
    'step.clan': 'Clan',
    'step.sire': 'Sire',
    'step.lifepaths': 'Lifepath',
    'step.attributes': 'Attributi',
    'step.skills': 'Skill',
    'step.later': 'Discipline, Merit, Humanity, Resources e dettagli arrivano nella prossima fase.',
    prev: '← Indietro',
    next: 'Avanti →',
    'type.title': 'Che personaggio vuoi creare?',
    'type.note':
      'Il livello lo scegli tu. Quando il personaggio entrerà in una Cronaca, dovrà avere lo stesso livello della Cronaca.',
    'type.name': 'Nome (puoi cambiarlo dopo)',
    'type.young': 'Personaggio giovane',
    'type.youngNote': `Un solo lifepath, ${YOUNG_EXTRA_SKILLS} punti Skill e ${YOUNG_EXTRA_RESOURCES} punti Resource in più, nessuna Skill oltre ${YOUNG_MAX_SKILL}.`,
    'tier.duskborn': 'Sangue debole, a metà tra vivi e morti.',
    'tier.neonate': 'Vampiro giovane, appena entrato nella società dei Fratelli.',
    'tier.ancilla': 'Vampiro affermato, con secoli o decenni alle spalle.',
    'tier.elder': 'Antico e potente, molto vicino agli Antidiluviani.',
    'tier.sum': (t) =>
      `${t.lifepaths} lifepath · Attributi ${t.attributes.join('/')} · Discipline ${t.clanDisciplineDots}+1${t.extraDisciplineDots ? ` (+${t.extraDisciplineDots} fuori clan)` : ''} · ${t.powers} poteri · ${t.merits} Merit · ${t.clanTraits} tratti di clan`,
    'clan.title': 'Scegli il clan',
    'clan.note':
      'Si possono scegliere solo i clan completi nel playtest: gli altri sono ancora in sviluppo.',
    'clan.choice': 'Terza Disciplina del clan',
    'clan.curse': 'Maledizione',
    'clan.beast': 'Bestia',
    'sire.title': 'Chi è il tuo Sire?',
    'sire.note':
      'Il Sire ti insegna una Disciplina: il suo punto è gratis e si aggiunge agli altri.',
    'sire.discipline': 'Disciplina insegnata',
    'sire.broodmate': 'Compagno di covata che ti insegna la Disciplina',
    'sire.approval': 'Serve l’approvazione del Narratore e del compagno di coterie.',
    'sire.generation': 'Generazione',
    'sire.anyDiscipline': 'Qualsiasi Disciplina di clan del tuo compagno di covata.',
    'lp.title': (n) => (n === 1 ? 'Scegli 1 lifepath' : `Scegli ${n} lifepath`),
    'lp.note': (skill, res) =>
      `Ogni lifepath dà ${skill} punti tra le sue Skill e ${res} punti tra le sue Resources.`,
    'lp.add': 'Aggiungi',
    'lp.remove': 'Togli',
    'reason.full': 'Hai già tutti i lifepath.',
    'lp.skills': 'Skill',
    'lp.resources': 'Resources',
    'lp.detail': 'Di cosa si tratta?',
    'lp.chosen': 'I tuoi lifepath',
    'lp.all': 'Tutti i lifepath',
    'lp.choose': 'a scelta',
    'group.mortal': 'Da mortale',
    'group.neonate': 'Da Neonate',
    'group.ancilla': 'Da Ancilla',
    'attr.title': 'Attributi',
    'attr.note':
      'Ogni Attributo parte da 1. Ordina le tre categorie: la prima riceve più punti, l’ultima meno.',
    'attr.rank': ['Prima', 'Seconda', 'Terza'],
    'skills.title': 'Skill e specialità',
    'skills.note': (n) =>
      `Oltre ai punti dei lifepath hai ${n} punti da mettere dove vuoi. Ricevi una specialità a 1, 3 e 5 punti, e una in più se due lifepath danno punti alla stessa Skill.`,
    'skills.fromLifepaths': 'dai lifepath',
    'skills.extra': 'extra',
    'skills.specialty': 'Specialità',
    'cat.physical': 'Fisici',
    'cat.social': 'Sociali',
    'cat.mental': 'Mentali',
    'side.points': 'Punti',
    'side.derived': 'Tracciati',
    'side.extraSkills': 'Skill extra',
    'side.lifepathSkills': (name) => `${name}: Skill`,
    'side.lifepathResources': (name) => `${name}: Resources`,
    'side.issues': 'Da sistemare',
    'side.allGood': 'Tutto a posto in questi passi.',
    'reason.tier': (r) => `Serve il livello ${cap(r.min)} o superiore.`,
    'reason.creature': 'Non per questo tipo di personaggio.',
    'reason.incomplete': 'Ancora in sviluppo nel playtest.',
    'reason.taken': 'Già scelto.',
    'reason.budget': 'Nessun punto rimasto.',
    'reason.storyteller': 'Serve l’approvazione del Narratore.',
    issue: {
      'clan-missing': 'Scegli un clan.',
      'clan-incomplete': 'Questo clan è ancora in sviluppo nel playtest.',
      'clan-choice-missing': 'Scegli la terza Disciplina del clan.',
      'sire-missing': 'Scegli il tipo di Sire.',
      'sire-unknown': 'Sire sconosciuto.',
      'sire-discipline-missing': 'Scegli la Disciplina insegnata dal Sire.',
      'sire-discipline-not-allowed': (i) => `Questo Sire non insegna ${nameOf(i.target)}.`,
      'discipline-without-powers': (i) => `${nameOf(i.target)} non ha ancora poteri nel playtest.`,
      'broodmate-missing': 'Indica il compagno di covata.',
      'generation-missing': 'Generazione non ancora scelta.',
      'generation-out-of-range': 'Generazione fuori dai limiti del livello.',
      'young-not-allowed': 'Solo Duskborn e Neonate possono essere giovani.',
      'lifepaths-missing': (i) => `Lifepath scelti: ${i.value} di ${i.limit}.`,
      'lifepaths-too-many': (i) => `Troppi lifepath: ${i.value} su ${i.limit}.`,
      'lifepath-repeated': 'Lo stesso lifepath due volte.',
      'lifepath-tier': (i) => `${nameOf(i.target)} non è per questo livello.`,
      'lifepath-skills-left': (i) => `${nameOf(i.target)}: ${left(i)} punti Skill da mettere.`,
      'lifepath-skills-over': (i) => `${nameOf(i.target)}: ${over(i)} punti Skill di troppo.`,
      'lifepath-resources-left': (i) =>
        `${nameOf(i.target)}: ${left(i)} punti Resource da mettere.`,
      'lifepath-resources-over': (i) => `${nameOf(i.target)}: ${over(i)} punti Resource di troppo.`,
      'skill-not-in-lifepath': 'Punti in una Skill che il lifepath non ha.',
      'priority-missing': 'Ordina le categorie di Attributi.',
      'attributes-left': (i) => `Attributi ${nameOf(i.target)}: ${left(i)} punti da mettere.`,
      'attributes-over': (i) => `Attributi ${nameOf(i.target)}: ${over(i)} punti di troppo.`,
      'attribute-max': (i) => `${nameOf(i.target)} oltre il massimo di ${i.limit}.`,
      'extra-skills-left': (i) => `${left(i)} punti Skill extra da mettere.`,
      'extra-skills-over': (i) => `${over(i)} punti Skill extra di troppo.`,
      'skill-max': (i) => `${nameOf(i.target)} oltre il massimo di ${i.limit}.`,
      'specialties-too-many': (i) => `${nameOf(i.target)}: troppe specialità.`,
      'specialties-free': (i) => `${nameOf(i.target)}: ${left(i)} specialità da scegliere.`,
    },
  },
  en: {
    back: '← Panel',
    error: 'Something went wrong. Reload the page.',
    notFound: 'Draft not found: starting a new one.',
    limit: 'You already have the maximum number of drafts: delete one from the panel.',
    'save.saved': 'Draft saved',
    'save.dirty': 'Unsaved changes…',
    'save.saving': 'Saving…',
    'save.error': 'Saving failed: trying again on the next change.',
    'save.new': 'Draft not saved yet',
    'step.type': 'Type',
    'step.clan': 'Clan',
    'step.sire': 'Sire',
    'step.lifepaths': 'Lifepaths',
    'step.attributes': 'Attributes',
    'step.skills': 'Skills',
    'step.later': 'Disciplines, Merits, Humanity, Resources and details come in the next phase.',
    prev: '← Back',
    next: 'Next →',
    'type.title': 'What kind of character?',
    'type.note':
      'You choose the tier. When the character joins a Chronicle, its tier must match the Chronicle’s.',
    'type.name': 'Name (you can change it later)',
    'type.young': 'Young character',
    'type.youngNote': `One lifepath only, ${YOUNG_EXTRA_SKILLS} more Skill dots and ${YOUNG_EXTRA_RESOURCES} more Resource dots, no Skill above ${YOUNG_MAX_SKILL}.`,
    'tier.duskborn': 'Thin of blood, between the living and the dead.',
    'tier.neonate': 'A young vampire, new to Kindred society.',
    'tier.ancilla': 'An established vampire, with decades or centuries behind them.',
    'tier.elder': 'Ancient and powerful, close to the Antediluvians.',
    'tier.sum': (t) =>
      `${t.lifepaths} lifepaths · Attributes ${t.attributes.join('/')} · Disciplines ${t.clanDisciplineDots}+1${t.extraDisciplineDots ? ` (+${t.extraDisciplineDots} out of clan)` : ''} · ${t.powers} powers · ${t.merits} Merits · ${t.clanTraits} clan traits`,
    'clan.title': 'Choose a clan',
    'clan.note':
      'Only clans complete in the playtest can be chosen: the others are in development.',
    'clan.choice': 'Third clan Discipline',
    'clan.curse': 'Curse',
    'clan.beast': 'Beast',
    'sire.title': 'Who is your Sire?',
    'sire.note': 'Your Sire teaches you a Discipline: that dot is free, on top of the others.',
    'sire.discipline': 'Discipline taught',
    'sire.broodmate': 'Broodmate who teaches you the Discipline',
    'sire.approval': 'Needs the approval of the Storyteller and of your coterie mate.',
    'sire.generation': 'Generation',
    'sire.anyDiscipline': 'Any clan Discipline of your broodmate.',
    'lp.title': (n) => (n === 1 ? 'Choose 1 lifepath' : `Choose ${n} lifepaths`),
    'lp.note': (skill, res) =>
      `Each lifepath gives ${skill} dots among its Skills and ${res} dots among its Resources.`,
    'lp.add': 'Add',
    'lp.remove': 'Remove',
    'reason.full': 'You have all your lifepaths.',
    'lp.skills': 'Skills',
    'lp.resources': 'Resources',
    'lp.detail': 'What is it?',
    'lp.chosen': 'Your lifepaths',
    'lp.all': 'All lifepaths',
    'lp.choose': 'your choice',
    'group.mortal': 'Mortal',
    'group.neonate': 'Neonate',
    'group.ancilla': 'Ancilla',
    'attr.title': 'Attributes',
    'attr.note':
      'Every Attribute starts at 1. Order the three categories: the first gets the most dots.',
    'attr.rank': ['First', 'Second', 'Third'],
    'skills.title': 'Skills and specialties',
    'skills.note': (n) =>
      `On top of the lifepaths’ dots you have ${n} dots to put anywhere. You get a specialty at 1, 3 and 5 dots, and one more when two lifepaths feed the same Skill.`,
    'skills.fromLifepaths': 'from lifepaths',
    'skills.extra': 'extra',
    'skills.specialty': 'Specialty',
    'cat.physical': 'Physical',
    'cat.social': 'Social',
    'cat.mental': 'Mental',
    'side.points': 'Points',
    'side.derived': 'Trackers',
    'side.extraSkills': 'Extra Skills',
    'side.lifepathSkills': (name) => `${name}: Skills`,
    'side.lifepathResources': (name) => `${name}: Resources`,
    'side.issues': 'To do',
    'side.allGood': 'All good in these steps.',
    'reason.tier': (r) => `Needs tier ${cap(r.min)} or higher.`,
    'reason.creature': 'Not for this kind of character.',
    'reason.incomplete': 'Still in development in the playtest.',
    'reason.taken': 'Already chosen.',
    'reason.budget': 'No points left.',
    'reason.storyteller': 'Needs the Storyteller’s approval.',
    issue: {
      'clan-missing': 'Choose a clan.',
      'clan-incomplete': 'This clan is still in development in the playtest.',
      'clan-choice-missing': 'Choose the third clan Discipline.',
      'sire-missing': 'Choose a Sire.',
      'sire-unknown': 'Unknown Sire.',
      'sire-discipline-missing': 'Choose the Discipline your Sire taught you.',
      'sire-discipline-not-allowed': (i) => `This Sire does not teach ${nameOf(i.target)}.`,
      'discipline-without-powers': (i) => `${nameOf(i.target)} has no powers in the playtest yet.`,
      'broodmate-missing': 'Name your broodmate.',
      'generation-missing': 'No Generation chosen yet.',
      'generation-out-of-range': 'Generation outside the tier’s limits.',
      'young-not-allowed': 'Only Duskborn and Neonates can be young.',
      'lifepaths-missing': (i) => `Lifepaths chosen: ${i.value} of ${i.limit}.`,
      'lifepaths-too-many': (i) => `Too many lifepaths: ${i.value} of ${i.limit}.`,
      'lifepath-repeated': 'The same lifepath twice.',
      'lifepath-tier': (i) => `${nameOf(i.target)} is not for this tier.`,
      'lifepath-skills-left': (i) => `${nameOf(i.target)}: ${left(i)} Skill dots left.`,
      'lifepath-skills-over': (i) => `${nameOf(i.target)}: ${over(i)} Skill dots too many.`,
      'lifepath-resources-left': (i) => `${nameOf(i.target)}: ${left(i)} Resource dots left.`,
      'lifepath-resources-over': (i) => `${nameOf(i.target)}: ${over(i)} Resource dots too many.`,
      'skill-not-in-lifepath': 'Dots in a Skill the lifepath does not have.',
      'priority-missing': 'Order the Attribute categories.',
      'attributes-left': (i) => `${nameOf(i.target)} Attributes: ${left(i)} dots left.`,
      'attributes-over': (i) => `${nameOf(i.target)} Attributes: ${over(i)} dots too many.`,
      'attribute-max': (i) => `${nameOf(i.target)} above the maximum of ${i.limit}.`,
      'extra-skills-left': (i) => `${left(i)} extra Skill dots left.`,
      'extra-skills-over': (i) => `${over(i)} extra Skill dots too many.`,
      'skill-max': (i) => `${nameOf(i.target)} above the maximum of ${i.limit}.`,
      'specialties-too-many': (i) => `${nameOf(i.target)}: too many specialties.`,
      'specialties-free': (i) => `${nameOf(i.target)}: ${left(i)} specialties to choose.`,
    },
  },
};

const lang = navigator.language?.toLowerCase().startsWith('it') ? 'it' : 'en';
const tr = (key, ...args) => {
  const v = TEXT[lang][key] ?? TEXT.en[key] ?? key;
  return typeof v === 'function' ? v(...args) : v;
};
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const left = (i) => i.limit - i.value;
const over = (i) => i.value - i.limit;

/** A readable name for an issue's target: a lifepath, Skill, Attribute, category, clan… */
function nameOf(target) {
  if (!target) return '';
  if (LIFEPATHS_BY_ID.has(target)) return LIFEPATHS_BY_ID.get(target).name;
  if (SKILL_INFO[target]) return SKILL_INFO[target].name;
  if (ATTRIBUTE_NAMES[target]) return ATTRIBUTE_NAMES[target];
  if (DISCIPLINE_NAMES[target]) return DISCIPLINE_NAMES[target];
  if (CLAN_INFO[target]) return CLAN_INFO[target].name;
  if (ATTRIBUTE_CATEGORIES.includes(target)) return tr(`cat.${target}`);
  return target;
}

function issueText(i) {
  const v = TEXT[lang].issue[i.code] ?? TEXT.en.issue[i.code];
  if (typeof v === 'function') return v(i);
  return v ?? i.code;
}

function reasonText(r) {
  if (r.kind === 'dots') {
    return r.anyOf.map((x) => `${DISCIPLINE_NAMES[x.discipline]} ${x.dots}`).join(' / ');
  }
  return tr(`reason.${r.kind}`, r);
}

// ---------- Small DOM helpers ----------

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

const dotsText = (n, max) => '●'.repeat(Math.max(0, n)) + '○'.repeat(Math.max(0, max - n));

/** − dots + : `canAdd` says whether + may go one higher. */
function stepper(value, { min = 0, max, canAdd = true, onChange, label, plain = false }) {
  const box = el('span', 'stepper');
  const minus = button('−', () => onChange(value - 1), 'step-btn');
  minus.disabled = value <= min;
  minus.setAttribute('aria-label', `${label} −1`);
  const plus = button('+', () => onChange(value + 1), 'step-btn');
  plus.disabled = !canAdd || value >= max;
  plus.setAttribute('aria-label', `${label} +1`);
  const shown = plain ? el('span', 'count', `+${value}`) : el('span', 'dots', dotsText(value, max));
  box.append(minus, shown, plus);
  return box;
}

/** A clickable card; locked ones show why instead of acting. */
function choiceCard({ title, lines = [], selected, available = true, reasons = [], onPick }) {
  const card = el(
    'button',
    'choice' + (selected ? ' selected' : '') + (available ? '' : ' locked'),
  );
  card.type = 'button';
  card.setAttribute('aria-pressed', String(!!selected));
  card.append(el('strong', '', title));
  for (const line of lines) if (line) card.append(el('span', 'line', line));
  if (!available) {
    card.disabled = true;
    for (const r of reasons) card.append(el('span', 'reason', reasonText(r)));
  } else card.addEventListener('click', onPick);
  return card;
}

function field(label, input) {
  const wrap = el('label', 'field');
  wrap.append(el('span', '', label), input);
  return wrap;
}

// ---------- State and saving ----------

let me;
let draftId;
let d = emptyDraft('neonate');
let step = 'type';
let saveState = 'new';
let saveTimer;
let saving = false;
let again = false;

const STEPS = ['type', 'clan', 'sire', 'lifepaths', 'attributes', 'skills'];

const isLifepathIssue = (i) =>
  i.step === 'lifepaths' ||
  i.code.startsWith('lifepath-') ||
  ['skill-not-in-lifepath', 'resource-not-in-lifepath'].includes(i.code);

/** The issues that belong to one tab of the wizard. */
function issuesOf(tab, issues) {
  if (tab === 'lifepaths') return issues.filter(isLifepathIssue);
  if (tab === 'skills') return issues.filter((i) => i.step === 'skills' && !isLifepathIssue(i));
  return issues.filter((i) => i.step === tab && !isLifepathIssue(i));
}

/** Applies a change; text fields skip redrawing the step so they keep the focus. */
function update(change, redraw = true) {
  change(d);
  saveState = 'dirty';
  clearTimeout(saveTimer);
  saveTimer = setTimeout(save, 1200);
  render(redraw);
}

async function api(method, url, body) {
  const response = await fetch(url, {
    method,
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': me.csrf },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (response.status === 401) {
    location.href = '/';
    throw new Error('login');
  }
  return response;
}

async function save() {
  if (saving) {
    again = true;
    return;
  }
  saving = true;
  saveState = 'saving';
  renderSave();
  try {
    const response = await api('POST', draftId ? `/api/drafts/${draftId}` : '/api/drafts', {
      data: d,
    });
    if (response.status === 409) {
      notify(tr('limit'));
      saveState = 'error';
    } else if (!response.ok) {
      saveState = 'error';
    } else {
      const { draft } = await response.json();
      if (!draftId) {
        draftId = draft.id;
        history.replaceState(null, '', `/crea?bozza=${draftId}`);
      }
      saveState = 'saved';
    }
  } catch {
    saveState = 'error';
  }
  saving = false;
  renderSave();
  if (again) {
    again = false;
    save();
  }
}

function notify(text) {
  const box = document.getElementById('notice');
  box.textContent = text;
  box.hidden = false;
}

// ---------- Rendering ----------

let current;

function render(redraw = true) {
  current = evaluate(d);
  renderSteps();
  if (redraw) {
    const view = VIEWS[step]();
    const nav = el('div', 'step-nav');
    const at = STEPS.indexOf(step);
    if (at > 0) nav.append(button(tr('prev'), () => go(STEPS[at - 1])));
    if (at < STEPS.length - 1) nav.append(button(tr('next'), () => go(STEPS[at + 1]), 'primary'));
    else nav.append(el('p', 'quiet', tr('step.later')));
    document.getElementById('step').replaceChildren(view, nav);
  }
  renderSide();
}

function go(next) {
  step = next;
  render();
  document.getElementById('step').scrollIntoView({ block: 'start', behavior: 'smooth' });
}

function renderSteps() {
  const nav = document.getElementById('steps');
  nav.replaceChildren(
    ...STEPS.map((s, n) => {
      const issues = issuesOf(s, current.issues);
      const state = issues.some((i) => i.severity === 'error')
        ? 'error'
        : issues.some((i) => i.severity === 'todo')
          ? 'todo'
          : 'done';
      const b = button(`${n + 1}. ${tr(`step.${s}`)}`, () => go(s), `tab ${state}`);
      if (s === step) b.setAttribute('aria-current', 'step');
      return b;
    }),
  );
}

function renderSave() {
  const box = document.getElementById('save-state');
  if (box) {
    box.textContent = tr(`save.${saveState}`);
    box.className = `save ${saveState}`;
  }
}

function pool(label, p) {
  const row = el(
    'div',
    'pool' + (p.spent > p.budget ? ' over' : p.spent === p.budget ? ' full' : ''),
  );
  row.append(el('span', '', label), el('span', 'count', `${p.spent}/${p.budget}`));
  return row;
}

function renderSide() {
  const side = document.getElementById('side');
  const { pools, derived } = current;
  const box = el('div', 'card');
  const saveLine = el('p', '', '');
  saveLine.id = 'save-state';
  box.append(saveLine);

  box.append(el('h3', '', tr('side.points')));
  for (const cat of ATTRIBUTE_CATEGORIES) {
    box.append(
      pool(`${tr('step.attributes')} ${tr(`cat.${cat}`).toLowerCase()}`, pools.attributes[cat]),
    );
  }
  d.lifepaths.forEach((pick, n) => {
    const name = LIFEPATHS_BY_ID.get(pick.id)?.name ?? pick.id;
    box.append(pool(tr('side.lifepathSkills', name), pools.lifepathSkills[n]));
    box.append(pool(tr('side.lifepathResources', name), pools.lifepathResources[n]));
  });
  box.append(pool(tr('side.extraSkills'), pools.extraSkills));

  box.append(el('h3', '', tr('side.derived')));
  for (const [label, value] of [
    ['Health', derived.health],
    ['Willpower', derived.willpower],
    ['Vitae', derived.vitae],
    ['Humanity', derived.humanity],
  ]) {
    const row = el('div', 'pool');
    row.append(el('span', '', label), el('span', 'count', value));
    box.append(row);
  }

  box.append(el('h3', '', tr('side.issues')));
  const shown = STEPS.flatMap((s) => issuesOf(s, current.issues)).filter(
    (i) => i.severity !== 'hint',
  );
  if (!shown.length) box.append(el('p', 'quiet', tr('side.allGood')));
  else {
    const list = el('ul', 'issues');
    for (const i of shown) list.append(el('li', i.severity, issueText(i)));
    box.append(list);
  }
  side.replaceChildren(box);
  renderSave();
}

function stepHead(title, note) {
  const head = el('div', 'step-head');
  head.append(el('h2', '', title));
  if (note) head.append(el('p', 'quiet', note));
  return head;
}

function hints(tab) {
  const list = el('ul', 'issues');
  // Free specialty slots already show as empty boxes: no need to list them too.
  for (const i of issuesOf(tab, current.issues)) {
    if (i.code !== 'specialties-free') list.append(el('li', i.severity, issueText(i)));
  }
  return list;
}

const VIEWS = {
  type() {
    const box = el('div');
    box.append(stepHead(tr('type.title'), tr('type.note')));
    const name = el('input');
    name.maxLength = 80;
    name.value = d.name ?? '';
    name.addEventListener('input', () =>
      update((x) => {
        x.name = name.value || undefined;
      }, false),
    );
    box.append(field(tr('type.name'), name));
    const grid = el('div', 'choices');
    for (const tier of CREATION_TIERS) {
      grid.append(
        choiceCard({
          title: cap(tier),
          lines: [tr(`tier.${tier}`), tr('tier.sum', TIER_RULES[tier])],
          selected: d.tier === tier,
          onPick: () =>
            update((x) => {
              x.tier = tier;
              if (!youngAllowed(tier)) delete x.young;
              const [lo, hi] = TIER_RULES[tier].generations;
              if (x.generation !== undefined && (x.generation < lo || x.generation > hi)) {
                delete x.generation;
              }
            }),
        }),
      );
    }
    box.append(grid);
    if (youngAllowed(d.tier)) {
      const young = el('input');
      young.type = 'checkbox';
      young.checked = !!d.young;
      young.addEventListener('change', () =>
        update((x) => {
          if (young.checked) x.young = true;
          else delete x.young;
          // A young character keeps one lifepath: the first one.
          x.lifepaths = x.lifepaths.slice(0, lifepathCount(x));
        }),
      );
      const label = el('label', 'check');
      label.append(young, el('span', '', tr('type.young')));
      box.append(label, el('p', 'quiet', tr('type.youngNote')));
    }
    box.append(hints('type'));
    return box;
  },

  clan() {
    const box = el('div');
    box.append(stepHead(tr('clan.title'), tr('clan.note')));
    const grid = el('div', 'choices');
    for (const o of clanOptions()) {
      const info = CLAN_INFO[o.id];
      const discs = info.disciplines.map((x) => DISCIPLINE_NAMES[x]);
      if (info.choice) discs.push(info.choice.map((x) => DISCIPLINE_NAMES[x]).join(' / '));
      grid.append(
        choiceCard({
          title: info.name,
          lines: [
            info.it,
            discs.join(', '),
            info.curse ? `${tr('clan.curse')}: ${info.curse}` : '',
            info.beast ? `${tr('clan.beast')}: ${info.beast}` : '',
          ],
          selected: d.clan === o.id,
          available: o.available,
          reasons: o.reasons,
          onPick: () =>
            update((x) => {
              x.clan = o.id;
              if (!info.choice?.includes(x.clanChoice)) delete x.clanChoice;
            }),
        }),
      );
    }
    box.append(grid);
    const info = d.clan && CLAN_INFO[d.clan];
    if (info?.choice) {
      const row = el('div', 'chips');
      for (const disc of info.choice) {
        row.append(
          button(
            DISCIPLINE_NAMES[disc],
            () =>
              update((x) => {
                x.clanChoice = disc;
              }),
            'chip' + (d.clanChoice === disc ? ' selected' : ''),
          ),
        );
      }
      box.append(el('h3', '', tr('clan.choice')), row);
    }
    box.append(hints('clan'));
    return box;
  },

  sire() {
    const box = el('div');
    box.append(stepHead(tr('sire.title'), tr('sire.note')));
    const grid = el('div', 'choices');
    for (const o of sireOptions()) {
      const sire = SIRES_BY_ID.get(o.id);
      grid.append(
        choiceCard({
          title: sire.name,
          lines: [
            sire.it,
            sire.disciplines.length
              ? sire.disciplines.map((x) => DISCIPLINE_NAMES[x]).join(', ')
              : tr('sire.anyDiscipline'),
          ],
          selected: d.sire === o.id,
          onPick: () =>
            update((x) => {
              x.sire = o.id;
              if (sire.disciplines.length && !sire.disciplines.includes(x.sireDiscipline)) {
                delete x.sireDiscipline;
              }
              if (o.id !== 'brood-child') delete x.broodmate;
            }),
        }),
      );
    }
    box.append(grid);
    if (d.sire) {
      const row = el('div', 'chips');
      for (const o of sireDisciplineOptions(d)) {
        row.append(
          button(
            DISCIPLINE_NAMES[o.id],
            () =>
              update((x) => {
                x.sireDiscipline = o.id;
              }),
            'chip' + (d.sireDiscipline === o.id ? ' selected' : ''),
          ),
        );
      }
      box.append(el('h3', '', tr('sire.discipline')), row);
    }
    if (d.sire === 'brood-child') {
      const mate = el('input');
      mate.maxLength = 80;
      mate.value = d.broodmate ?? '';
      mate.addEventListener('input', () =>
        update((x) => {
          x.broodmate = mate.value || undefined;
        }, false),
      );
      box.append(field(tr('sire.broodmate'), mate), el('p', 'quiet', tr('sire.approval')));
    }
    const [lo, hi] = TIER_RULES[d.tier].generations;
    const gen = el('select');
    gen.append(el('option', '', '—'));
    for (let g = lo; g <= hi; g++) {
      const opt = el('option', '', `${g}ª`);
      opt.value = String(g);
      opt.selected = d.generation === g;
      gen.append(opt);
    }
    gen.addEventListener('change', () =>
      update((x) => {
        if (gen.value) x.generation = Number(gen.value);
        else delete x.generation;
      }),
    );
    box.append(field(tr('sire.generation'), gen), hints('sire'));
    return box;
  },

  lifepaths() {
    const box = el('div');
    const wanted = lifepathCount(d);
    const young = youngAllowed(d.tier) && d.young;
    const skillBudget = LIFEPATH_SKILL_DOTS + (young ? YOUNG_EXTRA_SKILLS : 0);
    const resBudget = LIFEPATH_RESOURCE_DOTS + (young ? YOUNG_EXTRA_RESOURCES : 0);
    box.append(stepHead(tr('lp.title', wanted), tr('lp.note', skillBudget, resBudget)));

    if (d.lifepaths.length) {
      box.append(el('h3', '', tr('lp.chosen')));
      d.lifepaths.forEach((pick, n) => box.append(chosenLifepath(pick, n)));
    }
    box.append(hints('lifepaths'));

    const full = d.lifepaths.length >= wanted;
    const options = new Map(lifepathOptions(d).map((o) => [o.id, o]));
    // Once every lifepath is chosen, the list folds away: it is only there to look again.
    const list = el('details', 'lifepath-list');
    list.open = !full;
    list.append(el('summary', '', tr('lp.all')));
    box.append(list);
    for (const group of ['mortal', 'neonate', 'ancilla']) {
      list.append(el('h3', '', tr(`group.${group}`)));
      const grid = el('div', 'choices');
      for (const lp of LIFEPATHS.filter((l) => l.group === group)) {
        const o = options.get(lp.id);
        grid.append(
          choiceCard({
            title: lp.name,
            lines: [
              lp.it,
              `${tr('lp.skills')}: ${lp.skills.map(skillLabel).join(', ')}`,
              `${tr('lp.resources')}: ${lp.resources.map(resourceLabel).join(', ')}`,
            ],
            available: o.available && !full,
            reasons: o.available ? [{ kind: 'full' }] : o.reasons,
            onPick: () =>
              update((x) => {
                x.lifepaths.push({ id: lp.id, skills: {}, resources: lp.resources.map(() => 0) });
              }),
          }),
        );
      }
      list.append(grid);
    }
    return box;
  },

  attributes() {
    const box = el('div');
    box.append(stepHead(tr('attr.title'), tr('attr.note')));
    const t = TIER_RULES[d.tier];
    const priority = d.attributePriority;
    const grid = el('div', 'attr-grid');
    for (const cat of ATTRIBUTE_CATEGORIES) {
      const col = el('div', 'card');
      col.append(el('h3', '', tr(`cat.${cat}`)));
      const ranks = el('div', 'chips');
      t.attributes.forEach((dots, rank) => {
        ranks.append(
          button(
            `${tr('attr.rank')[rank]} (${dots})`,
            () => update((x) => setPriority(x, cat, rank)),
            'chip' + (priority?.[rank] === cat ? ' selected' : ''),
          ),
        );
      });
      col.append(ranks);
      const p = current.pools.attributes[cat];
      for (const a of ATTRIBUTES_BY_CATEGORY[cat]) {
        const value = attributeDots(d, a);
        const row = el('div', 'trait');
        row.append(
          el('span', '', ATTRIBUTE_NAMES[a]),
          stepper(value, {
            min: 1,
            max: t.maxDots,
            canAdd: !!priority && p.spent < p.budget,
            label: ATTRIBUTE_NAMES[a],
            onChange: (v) =>
              update((x) => {
                if (v <= 1) delete x.attributes[a];
                else x.attributes[a] = v;
              }),
          }),
        );
        col.append(row);
      }
      col.append(pool(tr('side.points'), p));
      grid.append(col);
    }
    box.append(grid, hints('attributes'));
    return box;
  },

  skills() {
    const box = el('div');
    const t = TIER_RULES[d.tier];
    box.append(stepHead(tr('skills.title'), tr('skills.note', t.extraSkills)));
    const extra = current.pools.extraSkills;
    const cap = skillCap();
    const table = el('div', 'skills');
    for (const skill of SKILLS) {
      const info = SKILL_INFO[skill];
      const total = skillDots(d, skill);
      const fromLp = total - (d.extraSkills[skill] ?? 0);
      const row = el('div', 'skill-row');
      const name = el('div', 'skill-name');
      name.append(el('strong', '', info.name), el('span', 'quiet', info.it));
      const own = d.extraSkills[skill] ?? 0;
      const counts = el('div', 'skill-counts');
      counts.append(
        el('span', 'dots', dotsText(total, cap)),
        el(
          'span',
          'quiet',
          `${fromLp} ${tr('skills.fromLifepaths')} + ${own} ${tr('skills.extra')}`,
        ),
        stepper(own, {
          max: cap,
          plain: true,
          canAdd: extra.spent < extra.budget && total < cap,
          label: info.name,
          onChange: (v) =>
            update((x) => {
              if (v <= 0) delete x.extraSkills[skill];
              else x.extraSkills[skill] = v;
            }),
        }),
      );
      row.append(name, counts);
      const slots = specialtySlots(d, skill);
      if (slots) row.append(specialtyInputs(skill, slots));
      table.append(row);
    }
    box.append(hints('skills'), table);
    return box;
  },
};

function skillCap() {
  const max = TIER_RULES[d.tier].maxSkill;
  return youngAllowed(d.tier) && d.young ? Math.min(YOUNG_MAX_SKILL, max) : max;
}

/** Gives `cat` the rank `rank`; the category that had it takes the other's old place. */
function setPriority(x, cat, rank) {
  const p = x.attributePriority ? [...x.attributePriority] : [...ATTRIBUTE_CATEGORIES];
  const from = p.indexOf(cat);
  [p[from], p[rank]] = [p[rank], p[from]];
  x.attributePriority = p;
}

function skillLabel(s) {
  const name = SKILL_INFO[s.skill].name;
  if (s.specialties) return `${name} (${s.specialties.join(' / ')})`;
  if (s.choose) return `${name} (${s.choose})`;
  return name;
}

function resourceLabel(r) {
  const name = RESOURCE_INFO[r.kind].name;
  return r.detail ? `${name}: ${r.detail}` : name;
}

function chosenLifepath(pick, n) {
  const lp = LIFEPATHS_BY_ID.get(pick.id);
  const card = el('div', 'card lifepath');
  const head = el('div', 'section-head');
  head.append(
    el('h3', '', lp?.name ?? pick.id),
    button(tr('lp.remove'), () =>
      update((x) => {
        x.lifepaths.splice(n, 1);
      }),
    ),
  );
  card.append(head);
  if (!lp) return card;
  const sp = current.pools.lifepathSkills[n];
  const rp = current.pools.lifepathResources[n];
  const cap = skillCap();

  card.append(pool(tr('lp.skills'), sp));
  for (const s of lp.skills) {
    const value = pick.skills[s.skill] ?? 0;
    const row = el('div', 'trait');
    row.append(
      el('span', '', skillLabel(s)),
      stepper(value, {
        max: cap,
        canAdd: sp.spent < sp.budget && skillDots(d, s.skill) < cap,
        label: SKILL_INFO[s.skill].name,
        onChange: (v) =>
          update((x) => {
            const skills = x.lifepaths[n].skills;
            if (v <= 0) delete skills[s.skill];
            else skills[s.skill] = v;
          }),
      }),
    );
    card.append(row);
  }

  card.append(pool(tr('lp.resources'), rp));
  const max = TIER_RULES[d.tier].maxDots;
  lp.resources.forEach((r, i) => {
    const value = pick.resources[i] ?? 0;
    const row = el('div', 'trait');
    const label = el('span', 'resource');
    label.append(el('span', '', resourceLabel(r)));
    const detail = el('input');
    detail.maxLength = 120;
    detail.placeholder = tr('lp.detail');
    detail.value = pick.resourceDetails?.[i] ?? '';
    detail.addEventListener('input', () =>
      update((x) => {
        const p = x.lifepaths[n];
        const details = p.resourceDetails ?? lp.resources.map(() => '');
        details[i] = detail.value;
        p.resourceDetails = details;
      }, false),
    );
    label.append(detail);
    row.append(
      label,
      stepper(value, {
        max,
        canAdd: rp.spent < rp.budget,
        label: RESOURCE_INFO[r.kind].name,
        onChange: (v) =>
          update((x) => {
            const p = x.lifepaths[n];
            p.resources = lp.resources.map((_, k) => (k === i ? v : (p.resources[k] ?? 0)));
          }),
      }),
    );
    card.append(row);
  });
  return card;
}

/** One text box per specialty slot, with the packet's examples and the lifepaths' as hints. */
function specialtyInputs(skill, slots) {
  const wrap = el('div', 'specialties');
  const listId = `spec-${skill}`;
  const list = el('datalist');
  list.id = listId;
  const fromLifepaths = d.lifepaths.flatMap(
    (p) => LIFEPATHS_BY_ID.get(p.id)?.skills.find((s) => s.skill === skill)?.specialties ?? [],
  );
  for (const name of new Set([...fromLifepaths, ...SKILL_INFO[skill].specialties])) {
    const opt = el('option');
    opt.value = name;
    list.append(opt);
  }
  wrap.append(list);
  const chosen = d.specialties[skill] ?? [];
  for (let i = 0; i < slots; i++) {
    const input = el('input');
    input.maxLength = 40;
    input.setAttribute('list', listId);
    input.placeholder = `${tr('skills.specialty')} ${i + 1}`;
    input.value = chosen[i] ?? '';
    input.addEventListener('input', () =>
      update((x) => {
        const names = [...(x.specialties[skill] ?? [])];
        names[i] = input.value;
        while (names.length && !names[names.length - 1]) names.pop();
        if (names.length) x.specialties[skill] = names.map((s) => s ?? '');
        else delete x.specialties[skill];
      }, false),
    );
    wrap.append(input);
  }
  return wrap;
}

// ---------- Start ----------

async function start() {
  document.documentElement.lang = lang;
  document.getElementById('back').textContent = tr('back');
  const meResponse = await fetch('/api/me', { credentials: 'same-origin' });
  if (meResponse.status === 401) {
    location.href = '/';
    return;
  }
  if (!meResponse.ok) throw new Error(String(meResponse.status));
  me = await meResponse.json();
  document.getElementById('user').textContent = me.user.name;

  const wanted = Number(new URLSearchParams(location.search).get('bozza'));
  if (Number.isInteger(wanted) && wanted > 0) {
    const response = await fetch(`/api/drafts/${wanted}`, { credentials: 'same-origin' });
    if (response.ok) {
      const { draft } = await response.json();
      draftId = draft.id;
      d = { ...emptyDraft(draft.data.tier), ...draft.data };
      saveState = 'saved';
    } else {
      notify(tr('notFound'));
      history.replaceState(null, '', '/crea');
    }
  }
  render();
}

start().catch(() => {
  document.querySelector('main').prepend(el('p', 'error', tr('error')));
});
