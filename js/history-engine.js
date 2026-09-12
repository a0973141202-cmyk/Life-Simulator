/**
 * Historical Figures & Butterfly Effect Engine.
 * Data stays in js/data/figures/** and js/data/figure-encounters/**.
 * This file: visibility, weekly track tick, encounter lock, rewrite invoice.
 *
 * Canonical history is the default program. It is not unbreakable.
 */

import { FIGURES, FIGURE_INDEX } from "./data/figures/catalog.js";
import { FIGURE_ENCOUNTERS } from "./data/figure-encounters/catalog.js";
import { FIGURE_COST_NOTE, FIGURE_STATUS_LABEL, FIGURE_STANCE_NOTE } from "./data/figure-rules.js";
import { composeFigureBeat } from "./dynamic-prose.js";
import { FIGURE_TAG_INDEX } from "./data/figure-tags.js";
import { cascadesFor, NARRATIVE_TO_SHOCK } from "./data/butterfly-cascades.js";
import { addCharacterTag } from "./tag-system.js";
import { chance, pickWeighted } from "./rng.js";
import { SOCIETY_ENTRY_AGE } from "./constants.js";
import { attachNpcSpeech } from "./npc-voice.js";
import { incidentAllowed } from "./age-gate.js";
import { eventOutline, filterCooledPool } from "./event-memory.js";

const LOG_LIMIT = 48;

export function emptyHistoryState() {
  return {
    inertia: 0,
    rewritten: false,
    figureStates: {},
    relations: {},
    divergences: [],
    shockOverrides: {},
    pending: [],
    lastEncounterId: null,
    lastFigureId: null,
    lastStance: null,
    log: [],
  };
}

export function ensureHistoryState(character) {
  if (!character.historyState) character.historyState = emptyHistoryState();
  const state = character.historyState;
  if (!state.figureStates) state.figureStates = {};
  if (!state.relations) state.relations = {};
  if (!state.divergences) state.divergences = [];
  if (!state.shockOverrides) state.shockOverrides = {};
  if (!state.pending) state.pending = [];
  if (!state.log) state.log = [];
  if (state.inertia == null) state.inertia = 0;
  return state;
}

export function filterShockRow(row, historyState, year) {
  if (!row) return { active: false, row, scale: 0 };
  const ov = historyState?.shockOverrides?.[row.id];
  if (!ov) return { active: true, row, scale: 1 };
  if (ov.suppressed) return { active: false, row, scale: 0 };
  const next = { ...row, years: row.years.slice() };
  if (ov.yearShift) {
    next.years = [row.years[0] + ov.yearShift, row.years[1] + ov.yearShift];
  }
  if (year != null && (year < next.years[0] || year > next.years[1])) {
    return { active: false, row: next, scale: 0 };
  }
  return { active: true, row: next, scale: ov.intensify || 1 };
}

export function narrativePulseAllowed(eventId, historyState) {
  const shockId = NARRATIVE_TO_SHOCK[eventId];
  if (!shockId) return true;
  return !historyState?.shockOverrides?.[shockId]?.suppressed;
}

function currentTrack(figure, year) {
  const rows = figure.track || [];
  for (const row of rows) {
    if (year >= row.years[0] && year <= row.years[1]) return row;
  }
  return rows[rows.length - 1] || { status: "departed", mission: "已退出公開程序", venue: figure.venues[0], weight: 0.4 };
}

export function figureRuntime(figure, historyState, year) {
  const st = historyState?.figureStates?.[figure.id] || {};
  const deathYear = st.deathYear ?? figure.deathYear;
  const alive = st.alive !== false && year <= deathYear && year >= figure.birthYear;
  const visible = alive
    && year >= (figure.visibleFrom ?? figure.birthYear)
    && year <= (st.visibleTo ?? figure.visibleTo ?? deathYear);
  const track = currentTrack(figure, year);
  let status = st.status || track.status;
  if (!alive) status = "departed";
  else if (st.rewritten) status = "rewritten";
  else if (figure.powerTo != null && year > figure.powerTo && status === "power") status = "fallen";
  return {
    figure,
    alive,
    visible,
    deathYear,
    status,
    track,
    relation: historyState?.relations?.[figure.id] || st.relation || null,
    rewritten: Boolean(st.rewritten),
  };
}

function locationMatches(figure, ctx) {
  const proximity = figure.proximity || "country";
  const cityId = ctx.cityId || ctx.character?.cityId || "";
  const country = ctx.country || ctx.character?.country || "";
  const region = ctx.region || ctx.character?.region || "";
  if (figure.settlementIds?.includes(cityId)) return { hit: true, grade: 4 };
  if (proximity === "city") return { hit: false, grade: 0 };
  if (figure.countriesAny && figure.countriesAny.some((item) => country.includes(item))) {
    return { hit: true, grade: proximity === "country" ? 2.2 : 1.6 };
  }
  if (proximity === "country") return { hit: false, grade: 0 };
  if (figure.regions && figure.regions.includes(region)) {
    return { hit: true, grade: proximity === "region" ? 1.4 : 1 };
  }
  if (proximity === "global") return { hit: true, grade: 0.45 };
  return { hit: false, grade: 0 };
}

export function figuresPresent(ctx) {
  const state = ctx.character ? ensureHistoryState(ctx.character) : emptyHistoryState();
  const year = ctx.year ?? 1920;
  const out = [];
  for (const figure of FIGURES) {
    const runtime = figureRuntime(figure, state, year);
    if (!runtime.visible) continue;
    const loc = locationMatches(figure, ctx);
    if (!loc.hit) continue;
    out.push({ ...runtime, loc });
  }
  return out;
}

function fillFact(text, runtime) {
  if (!text) return "";
  const statusLabel = FIGURE_STATUS_LABEL[runtime.status] || runtime.status;
  return text
    .replaceAll("{{name}}", runtime.figure.name)
    .replaceAll("{{mission}}", runtime.track.mission || "")
    .replaceAll("{{status}}", statusLabel);
}

function encounterMatches(incident, runtime, ctx) {
  const when = incident.when || {};
  const age = ctx.ageYears ?? 0;
  if (when.age && (age < when.age[0] || age > when.age[1])) return false;
  if (when.figureIds && !when.figureIds.includes(runtime.figure.id)) return false;
  if (when.roles && !when.roles.some((role) => runtime.figure.roles.includes(role))) return false;
  const venue = runtime.track.venue || runtime.figure.venues[0];
  if (when.venues && !when.venues.includes(venue) && !when.venues.some((item) => runtime.figure.venues.includes(item))) {
    return false;
  }
  if (when.proximityAny && !when.proximityAny.includes(runtime.figure.proximity)) return false;
  return incidentAllowed(incident, ctx);
}

export function figureEncounterChance(ctx) {
  const age = ctx.ageYears ?? 0;
  if (age < 8) return 0;
  const present = figuresPresent(ctx);
  if (!present.length) return 0;
  const tags = ctx.tags || [];
  const paths = ctx.ledger?.paths || {};
  let p = 0.028;
  if (present.some((row) => row.loc.grade >= 4)) p += 0.09;
  else if (present.some((row) => row.loc.grade >= 2)) p += 0.045;
  if ((paths.politics || 0) >= 2 || (paths.historical || 0) >= 1) p += 0.05;
  if ((paths.crime || 0) >= 2 && present.some((row) => row.figure.roles.includes("crime"))) p += 0.05;
  if (tags.includes("figure_orbit") || tags.includes("figure_ally") || tags.includes("figure_enemy")) p += 0.06;
  if (tags.includes("figure_hunted") || tags.includes("figure_butterfly")) p += 0.05;
  if ((ctx.character?.historyState?.inertia || 0) >= 18) p += 0.04;
  if (age < 12) p *= 0.5;
  return Math.min(0.3, p);
}

function bindEncounter(incident, runtime) {
  const fact = fillFact(incident.fact, runtime);
  const procedure = fillFact(incident.procedure, runtime);
  return {
    ...incident,
    fact,
    procedure,
    figureId: runtime.figure.id,
    figureName: runtime.figure.name,
    figureRole: runtime.figure.roles?.[0] || null,
    figureStatus: runtime.status,
    options: incident.options.map((opt) => ({
      ...opt,
      text: fillFact(opt.text, runtime),
      followUps: (opt.followUps || []).map((line) => fillFact(line, runtime)),
      figureEncounter: true,
      figureId: runtime.figure.id,
      figureName: runtime.figure.name,
      figureRole: runtime.figure.roles?.[0] || null,
      figureStatus: runtime.status,
      figureNonsexual: true,
    })),
  };
}

export function pickFigureEncounter(rng, ctx) {
  if (!chance(rng, figureEncounterChance(ctx))) return null;
  const present = figuresPresent(ctx);
  if (!present.length) return null;
  const state = ctx.character ? ensureHistoryState(ctx.character) : null;
  const figureRow = pickWeighted(rng, present, (row) => {
    let weight = (row.figure.weight ?? 1) * (row.track.weight ?? 1) * row.loc.grade;
    if (row.figure.id === state?.lastFigureId) weight *= 0.35;
    if (row.status === "power" || row.status === "war") weight *= 1.25;
    if (row.status === "fallen") weight *= 0.7;
    const relation = row.relation;
    if (relation === "ally" || relation === "enemy" || relation === "client") weight *= 1.4;
    return weight;
  });
  if (!figureRow) return null;
  const pool = FIGURE_ENCOUNTERS.filter((incident) => encounterMatches(incident, figureRow, ctx));
  if (!pool.length) return null;
  const cooled = filterCooledPool(pool, ctx.character, (incident) => ({
    id: `${incident.id}:${figureRow.figure.id}`,
    outline: eventOutline("figure", incident.kind, figureRow.figure.id),
  }), ctx);
  const fresh = cooled.filter((incident) => incident.id !== state?.lastEncounterId);
  const source = fresh.length ? fresh : cooled;
  const incident = pickWeighted(rng, source, (row) => {
    let weight = row.weight ?? 1;
    if (row.kind === "named") weight *= 2.4;
    return weight;
  });
  if (!incident) return null;
  return bindEncounter(incident, figureRow);
}

export function renderFigureEncounter(incident, ctx = null, rng = null) {
  if (!incident) return "";
  const system = composeFigureBeat(typeof rng === "function" ? rng : (() => 0.43), incident, ctx || {});
  if (!ctx) return system;
  return attachNpcSpeech(system, ctx, {
    ...incident,
    figureEncounter: true,
    figureName: incident.figureName,
    figureRole: incident.figureRole,
    figureId: incident.figureId,
  }, rng);
}

export function stampFigureTags(character, ids = []) {
  const applied = [];
  for (const id of [...new Set(ids || [])]) {
    if (!id || !String(id).startsWith("figure_")) continue;
    const def = FIGURE_TAG_INDEX[id];
    addCharacterTag(character, def
      ? {
        id: def.id,
        category: "figure",
        label: def.label,
        source: "figure",
        reason: def.reason,
        hooks: def.hooks || [],
        advantageIn: def.advantageIn || [],
        strainIn: def.strainIn || [],
        valence: "contextual",
      }
      : { id, label: id, source: "figure", category: "figure" });
    applied.push(id);
  }
  return applied;
}

function mergeOverride(state, shockId, patch) {
  if (!shockId) return;
  const prev = state.shockOverrides[shockId] || {};
  state.shockOverrides[shockId] = {
    suppressed: Boolean(patch.suppressed || prev.suppressed),
    yearShift: patch.yearShift ?? prev.yearShift ?? 0,
    intensify: patch.intensify ?? prev.intensify ?? 1,
    label: patch.label || prev.label || "",
  };
}

function applyCascade(state, figure, deathYear, time) {
  const notes = [];
  const rules = cascadesFor(figure.id, deathYear);
  for (const rule of rules) {
    state.inertia = Math.min(100, state.inertia + (rule.inertia || 20));
    state.rewritten = true;
    for (const shockId of rule.suppress || []) {
      mergeOverride(state, shockId, { suppressed: true, label: rule.label });
    }
    for (const [shockId, scale] of Object.entries(rule.intensify || {})) {
      mergeOverride(state, shockId, { intensify: scale, label: rule.label });
    }
    for (const [shockId, shift] of Object.entries(rule.yearShift || {})) {
      mergeOverride(state, shockId, { yearShift: shift, label: rule.label });
    }
    for (const eventId of rule.narrativeSuppress || []) {
      const shockId = NARRATIVE_TO_SHOCK[eventId] || eventId;
      mergeOverride(state, shockId, { suppressed: true, label: rule.label });
    }
    const divergence = {
      id: `div_${figure.id}_${deathYear}_${rule.beforeYear}`,
      year: time.year ?? deathYear,
      iso: time.iso ?? null,
      figureId: figure.id,
      kind: "cascade",
      label: rule.label,
      note: rule.note,
    };
    state.divergences.push(divergence);
    notes.push(`${rule.label}。${rule.note}`);
  }
  if (state.divergences.length > LOG_LIMIT) {
    state.divergences.splice(0, state.divergences.length - LOG_LIMIT);
  }
  return notes;
}

function ensureFigureState(state, figure) {
  if (!state.figureStates[figure.id]) {
    state.figureStates[figure.id] = {
      alive: true,
      deathYear: figure.deathYear,
      deathCause: "canonical",
      status: null,
      relation: null,
      rewritten: false,
      lastSeenYear: null,
    };
  }
  return state.figureStates[figure.id];
}

export function tickHistory(character, time = {}) {
  if (!character) return { notes: [] };
  const state = ensureHistoryState(character);
  const year = time.year ?? 1920;
  state.inertia = Math.max(0, Math.round(state.inertia * 0.97) - (state.rewritten ? 0 : 1));
  const notes = [];
  for (const figure of FIGURES) {
    const st = state.figureStates[figure.id];
    if (!st) continue;
    if (st.alive && year > st.deathYear) {
      st.alive = false;
      st.status = "departed";
      if (st.deathCause === "canonical") {
        notes.push(`${figure.name}按原本的年表退出公開舞台。`);
      }
    }
  }
  return { notes, inertia: state.inertia, rewritten: state.rewritten };
}

export function applyButterfly(character, option, time = {}, attemptRoll = null) {
  const notes = [];
  const addTags = [];
  if (!character || !option?.butterfly || !option.figureId) {
    return { notes, addTags, applied: false };
  }
  const figure = FIGURE_INDEX[option.figureId];
  if (!figure) return { notes, addTags, applied: false };
  const state = ensureHistoryState(character);
  const st = ensureFigureState(state, figure);
  const success = attemptRoll ? Boolean(attemptRoll.success) : false;
  const year = time.year ?? figure.visibleFrom;

  if (!success) {
    addTags.push("figure_failed_hand", "figure_hunted", "figure_enemy");
    state.relations[figure.id] = "hunted";
    st.relation = "hunted";
    state.inertia = Math.min(100, state.inertia + 10);
    notes.push(`干預沒有成型。${figure.name}的體系開始用你的臉辦公。`);
    return { notes, addTags, applied: false, success: false };
  }

  addTags.push("figure_butterfly", "figure_hunted");
  state.rewritten = true;
  state.inertia = Math.min(100, state.inertia + 22);

  if (option.butterfly.kind === "early_death") {
    st.alive = false;
    st.deathYear = year;
    st.deathCause = "player";
    st.rewritten = true;
    st.status = "departed";
    state.relations[figure.id] = "enemy";
    notes.push(`${figure.name}在 ${year} 年提前退出公開歷史。後面的年表開始按新的走法走。`);
    notes.push(...applyCascade(state, figure, year, time));
  } else if (option.butterfly.kind === "divert_shock") {
    st.rewritten = true;
    state.relations[figure.id] = option.relation || "enemy";
    const shockId = figure.shocks[0];
    if (shockId) {
      mergeOverride(state, shockId, { yearShift: 1, intensify: 0.72, label: `被干預：${figure.name}` });
      notes.push(`與${figure.name}相連的那一波衝擊被推延，力道也小了。不是取消，是扭曲。`);
    } else {
      notes.push(`${figure.name}正在推進的公開行動被你扭曲。相連的國家機器開始反讀你的位置。`);
    }
    state.divergences.push({
      id: `div_divert_${figure.id}_${year}`,
      year,
      iso: time.iso ?? null,
      figureId: figure.id,
      kind: "divert_shock",
      label: "年表分岔",
      note: `${figure.name}的當下使命被干預。`,
    });
  } else if (option.butterfly.kind === "boost_figure") {
    st.rewritten = true;
    state.relations[figure.id] = "ally";
    notes.push(`你把資源送進${figure.name}的機器。這會加速其公開職能，也會把你寫進其清算表。`);
  }

  state.log.push({
    year,
    iso: time.iso ?? null,
    figureId: figure.id,
    kind: option.butterfly.kind,
    success: true,
  });
  if (state.log.length > LOG_LIMIT) state.log.splice(0, state.log.length - LOG_LIMIT);
  return { notes, addTags, applied: true, success: true, inertia: state.inertia };
}

export function applyFigureChoice(character, option, time = {}, rng = null, attemptRoll = null) {
  if (!character || !option?.figureEncounter) {
    return { applied: [], notes: [], ending: null, butterfly: null };
  }
  const state = ensureHistoryState(character);
  const applied = stampFigureTags(character, option.addTags || []);
  const figure = FIGURE_INDEX[option.figureId];
  if (figure) {
    const st = ensureFigureState(state, figure);
    st.lastSeenYear = time.year ?? st.lastSeenYear;
    if (option.relation) {
      state.relations[figure.id] = option.relation;
      st.relation = option.relation;
    }
  }
  state.lastEncounterId = option.figureEncounterId || null;
  state.lastFigureId = option.figureId || null;
  state.lastStance = option.stance || null;
  state.inertia = Math.min(100, state.inertia + (option.butterfly ? 6 : 1));

  const notes = [];
  if (option.butterfly) {
    notes.push("這一週之後，街坊對歷史的說法開始跟以前不一樣。");
  }

  let butterfly = null;
  if (option.butterfly) {
    butterfly = applyButterfly(character, option, time, attemptRoll);
    for (const id of butterfly.addTags || []) {
      if (!applied.includes(id)) {
        stampFigureTags(character, [id]);
        applied.push(id);
      }
    }
    notes.push(...(butterfly.notes || []));
  }

  let ending = null;
  if (option.ending?.reason && (option.ending.force || (option.ending.chance && rng && rng() < option.ending.chance))) {
    if (!butterfly?.success) {
      ending = { reason: option.ending.reason, detail: option.ending.detail, destructive: true };
    }
  }
  if (!ending && (character.tags || []).includes("figure_hunted") && state.inertia >= 55 && (character.ledger?.wanted || 0) >= 60) {
    if (rng && rng() < 0.12) {
      ending = {
        reason: "歷史反噬清算",
        detail: "國家機器或權力集團把一個試圖改寫年表的人從公開生活裡拿掉。慣性比你的企圖長。",
        destructive: true,
      };
    }
  }

  return {
    applied,
    notes,
    ending,
    butterfly,
    inertia: state.inertia,
    rewritten: state.rewritten,
  };
}

export function weeklyHistoryFallout(rng, character, time = {}) {
  const tick = tickHistory(character, time);
  const state = character?.historyState;
  if (!state) return { notes: tick.notes || [], addTags: [], effects: {}, ending: null, consequence: null };
  const tags = character.tags || [];
  const notes = [...(tick.notes || [])];
  const addTags = [];
  const effects = {};
  let consequence = null;
  let ending = null;

  if (tags.includes("figure_hunted") && chance(rng, Math.min(0.22, 0.06 + state.inertia * 0.002))) {
    consequence = { wanted: 6, heat: 7, trust: -4, infamy: 2, eventLabel: "歷史反噬盯梢" };
    effects.mood = (effects.mood || 0) - 2;
    notes.push("歷史反噬按週續費：有人來問你那一週站在哪。國家機器不討論你當時怎麼想。");
  }
  if (tags.includes("figure_butterfly") && chance(rng, 0.1)) {
    effects.mood = (effects.mood || 0) - 1;
    notes.push("改寫後的世界繼續運轉。你走在一條不再與課本重合的街上。這不是勝利巡遊。");
  }
  if (state.inertia >= 40 && chance(rng, 0.08)) {
    addTags.push("figure_hunted");
    consequence = {
      ...(consequence || {}),
      heat: (consequence?.heat || 0) + 4,
      wanted: (consequence?.wanted || 0) + 3,
      eventLabel: "歷史慣性加壓",
    };
    notes.push("權力集團開始把你當成需要被處理的變數。");
  }
  if (tags.includes("figure_hunted") && state.inertia >= 70 && (character.ledger?.wanted || 0) >= 70 && chance(rng, 0.08)) {
    ending = {
      reason: "與歷史巨浪對抗後的毀滅",
      detail: "清算到來時不開會。改寫過年表的人被從後續年份裡刪除。",
    };
  }

  return { notes, addTags, effects, ending, consequence, inertia: state.inertia, rewritten: state.rewritten };
}

export function modifyResolutionForFigure(character, option, effects, texts) {
  const records = (character?.tagRecords || []).filter((item) => (
    item.category === "figure" || (item.id || "").startsWith("figure_")
  ));
  if (!records.length) return { effects, extraRisk: 0 };
  const next = { ...effects };
  let extraRisk = 0;
  const hunted = records.some((item) => item.id === "figure_hunted");
  const butterfly = records.some((item) => item.id === "figure_butterfly");
  if (hunted && option.figureEncounter) extraRisk += 0.12;
  if (butterfly && option.butterfly) extraRisk += 0.08;
  if (hunted && next.charm > 0) next.charm = Math.max(0, next.charm - 1);
  if (option.butterfly) {
    extraRisk += 0.1;
    texts.push("護衛與年份把這一步壓得很窄。");
  }
  const age = character?.ageYears;
  if ((option.butterfly?.kind === "early_death") && age != null && age < SOCIETY_ENTRY_AGE) {
    extraRisk += 0.5;
  }
  return { effects: next, extraRisk };
}

export { FIGURES, FIGURE_INDEX, FIGURE_ENCOUNTERS, FIGURE_STANCE_NOTE, FIGURE_COST_NOTE };
