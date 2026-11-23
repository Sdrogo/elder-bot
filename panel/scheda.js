/* global document, fetch, location, navigator, URLSearchParams */
// A character's full Alpha 2.0 sheet, as the creation wizard saved it. The owner and the
// Storyteller of its Chronicle can read it; the Storyteller also answers the choices that need
// their approval. Every text goes in with textContent: names come from users.

import {
  coterieHavenDots,
  evaluate,
  isCoterieHaven,
  resourceTotals,
  skillDots,
} from '/game/creation.js';
import { LIFEPATHS_BY_ID, MERITS_BY_ID, PATHS, SIRES_BY_ID } from '/game/alpha2/background.js';
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
    'status.pending': 'da approvare',
    'status.approved': 'approvato',
    'status.rejected': 'rifiutato',
    approve: 'Approva',
    reject: 'Rifiuta',
    noChronicle: 'Il Narratore potrà approvarlo quando il personaggio entrerà in una Cronaca.',
    broodChild: (mate) => `Brood Child: impara la Disciplina da ${mate || '?'}`,
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
    'status.pending': 'waiting',
    'status.approved': 'approved',
    'status.rejected': 'rejected',
    approve: 'Approve',
    reject: 'Reject',
    noChronicle: 'The Storyteller can approve it once the character joins a Chronicle.',
    broodChild: (mate) => `Brood Child: learns the Discipline from ${mate || '?'}`,
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

async function answer(index, approved) {
  const response = await fetch(`/api/characters/${id}/approval`, {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': me.csrf },
    body: JSON.stringify({ index, approved }),
  });
  if (response.ok) await load();
}

function draw({ character, sheet, canApprove }) {
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
  out.push(head);

  if (sheet.approvals.length) {
    const list = el('div');
    sheet.approvals.forEach((a, index) => {
      const text =
        a.code === 'path'
          ? tr('path', PATHS.find((p) => p.id === a.target)?.name ?? a.target)
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
    LIFEPATHS_BY_ID.get(pick.id)?.resources.forEach((r, i) =>
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
    const lp = LIFEPATHS_BY_ID.get(pick.id);
    if (!lp) continue;
    lps.append(row(lp.name, '', lp.it));
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
