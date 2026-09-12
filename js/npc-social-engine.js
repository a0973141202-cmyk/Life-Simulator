/**
 * Dynamic NPC Social Network & Relationship Engine.
 * Living kin hold affection, attitude, and death state; extremes lock weekly events.
 */
import {
  AFFECTION_BANDS,
  HOUSEHOLD_AFFECTION_SEED,
  KIN_CRISIS_COOLDOWN,
  KIN_CRISIS_KINDS,
  KIN_TAG_RULES,
  NPC_BASE_DEATH,
  ROLE_LABEL,
  VOICE_ATTITUDE,
} from "./data/npc-schema.js";
import { formatCulturalName } from "./naming-engine.js";
import { defaultBloodlineRegistry } from "./bloodlines.js";
import { findSettlement } from "./settlements.js";
import { addCharacterTag, characterHasTag, removeCharacterTag } from "./tag-system.js";
import { scanNarrativeFacts } from "./narrative-facts.js";
import { composeChoiceLine } from "./dynamic-prose.js";
import { chance, pick, randInt } from "./rng.js";

function num(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function clamp(value, lo, hi) {
  return Math.max(lo, Math.min(hi, Math.round(value)));
}

function yearOf(ctx = {}, character = {}) {
  return num(ctx.year ?? ctx.time?.year ?? character.birthYear, 1920);
}

export function affectionBandOf(affection) {
  const a = clamp(num(affection, 50), 0, 100);
  return AFFECTION_BANDS.find((row) => a <= row.max) || AFFECTION_BANDS[AFFECTION_BANDS.length - 1];
}

export function attitudeOf(affection) {
  return affectionBandOf(affection).attitude;
}

export function roleLabel(role) {
  return ROLE_LABEL[role] || "相關的人";
}

export function isNpcAlive(npc, year) {
  if (!npc) return false;
  if (npc.alive === false) return false;
  if (npc.deathYear != null && year != null && Number(npc.deathYear) <= Number(year)) return false;
  return true;
}

export function emptyNpcNetwork(options = {}) {
  return {
    npcs: Array.isArray(options.npcs) ? options.npcs.map(normalizeNpc) : [],
    pendingCrisis: Boolean(options.pendingCrisis),
    pendingKind: options.pendingKind || null,
    pendingNpcId: options.pendingNpcId || null,
    lastCrisisTurn: num(options.lastCrisisTurn, -999),
    crises: num(options.crises),
    lastKind: options.lastKind || null,
    events: Array.isArray(options.events) ? options.events.slice(-24) : [],
  };
}

function normalizeNpc(raw = {}) {
  const affection = clamp(num(raw.affection, 50), 0, 100);
  return {
    id: raw.id || `npc_${raw.role || "kin"}_${Math.abs(num(raw.birthYear, 0))}`,
    role: raw.role || "guardian",
    name: raw.name || roleLabel(raw.role),
    gender: raw.gender === "female" ? "female" : "male",
    birthYear: num(raw.birthYear, null),
    deathYear: raw.deathYear == null ? null : num(raw.deathYear),
    alive: raw.alive !== false && (raw.deathYear == null),
    affection,
    attitude: attitudeOf(affection),
    stance: raw.stance || "neutral",
    cause: raw.cause || null,
    notes: raw.notes || "",
    source: raw.source || "seed",
  };
}

function seedAffection(character, role) {
  let base = role === "rival" ? 28 : role === "sibling" ? 52 : 55;
  const climate = character.householdClimate || [];
  for (const id of climate) {
    base += HOUSEHOLD_AFFECTION_SEED[id] || 0;
  }
  if (role === "father" && climate.includes("household_alcohol")) base -= 8;
  if (role === "mother" && climate.includes("household_neglect")) base -= 6;
  if (role === "guardian") base = 48;
  return clamp(base + (role === "rival" ? -10 : 0), 8, 88);
}

function makeNpcId(role, name, birthYear) {
  const slug = String(name || role).replace(/\s+/g, "").slice(0, 8);
  return `npc_${role}_${slug}_${num(birthYear, 0)}`;
}

function parentToNpc(parent, role, character) {
  if (!parent) return null;
  const year = num(character.birthYear, 1920);
  const aliveAtBirth = parent.aliveAtBirth !== false;
  const deathYear = parent.deathYear == null ? null : num(parent.deathYear);
  const alreadyDead = !aliveAtBirth || (deathYear != null && deathYear <= year);
  const affection = seedAffection(character, role);
  return normalizeNpc({
    id: makeNpcId(role, parent.name, parent.birthYear),
    role,
    name: parent.name || roleLabel(role),
    gender: role === "mother" ? "female" : "male",
    birthYear: parent.birthYear,
    deathYear: alreadyDead ? (deathYear ?? year) : null,
    alive: !alreadyDead,
    affection,
    stance: affectionBandOf(affection).id,
    source: "bloodline",
    notes: parent.notes || "",
  });
}

function siblingCount(rng, classId, birthYear) {
  let n = classId === "peasant" || classId === "worker" ? randInt(rng, 0, 3) : randInt(rng, 0, 2);
  if (birthYear <= 1945) n = Math.min(4, n + (chance(rng, 0.35) ? 1 : 0));
  return n;
}

function rollSibling(rng, character, index) {
  const birthYear = num(character.birthYear, 1920);
  const offset = randInt(rng, -8, 8) || (index % 2 === 0 ? -2 : 2);
  const sibBirth = clamp(birthYear + offset, birthYear - 14, birthYear + 10);
  const gender = chance(rng, 0.5) ? "female" : "male";
  const ethId = character.bloodline?.primaryEthnicityId
    || character.bloodline?.ancestries?.[0]?.id;
  const eth = defaultBloodlineRegistry.getEthnicity(ethId);
  const settlement = findSettlement(character.cityId);
  const name = formatCulturalName(eth, gender, rng, settlement, sibBirth);
  const affection = seedAffection(character, "sibling") + randInt(rng, -8, 8);
  const deadYoung = chance(rng, birthYear <= 1940 ? 0.08 : 0.03);
  return normalizeNpc({
    id: makeNpcId("sibling", name, sibBirth),
    role: "sibling",
    name,
    gender,
    birthYear: sibBirth,
    deathYear: deadYoung ? randInt(rng, sibBirth + 1, birthYear + 4) : null,
    alive: !deadYoung,
    affection,
    stance: affectionBandOf(affection).id,
    source: "seed",
  });
}

export function seedNpcNetwork(character, rng = Math.random) {
  const parents = character.bloodline?.parents || {};
  const npcs = [];
  const father = parentToNpc(parents.father, "father", character);
  const mother = parentToNpc(parents.mother, "mother", character);
  if (father) npcs.push(father);
  if (mother) npcs.push(mother);
  const count = typeof rng === "function" ? siblingCount(rng, character.familyClassId, character.birthYear) : 0;
  for (let i = 0; i < count; i += 1) {
    npcs.push(rollSibling(rng, character, i));
  }
  if (!father?.alive && !mother?.alive && chance(rng, 0.7)) {
    const eth = defaultBloodlineRegistry.getEthnicity(character.bloodline?.primaryEthnicityId);
    const settlement = findSettlement(character.cityId);
    const gender = chance(rng, 0.55) ? "female" : "male";
    const by = num(character.birthYear, 1920) - randInt(rng, 30, 55);
    const name = formatCulturalName(eth, gender, rng, settlement, by);
    npcs.push(normalizeNpc({
      id: makeNpcId("guardian", name, by),
      role: "guardian",
      name,
      gender,
      birthYear: by,
      affection: seedAffection(character, "guardian"),
      source: "orphan_seed",
    }));
  }
  const network = emptyNpcNetwork({ npcs });
  character.npcNetwork = network;
  syncBloodlineAlive(character);
  syncKinTags(character);
  return network;
}

export function ensureNpcNetwork(character, rng = null) {
  if (!character) return emptyNpcNetwork();
  if (!character.npcNetwork?.npcs?.length) {
    if (typeof rng === "function") return seedNpcNetwork(character, rng);
    const parents = character.bloodline?.parents || {};
    const npcs = [];
    const father = parentToNpc(parents.father, "father", character);
    const mother = parentToNpc(parents.mother, "mother", character);
    if (father) npcs.push(father);
    if (mother) npcs.push(mother);
    character.npcNetwork = emptyNpcNetwork({ npcs, ...(character.npcNetwork || {}) });
  } else {
    character.npcNetwork = emptyNpcNetwork(character.npcNetwork);
  }
  syncBloodlineAlive(character);
  return character.npcNetwork;
}

export function listNpcs(character, opts = {}) {
  const network = ensureNpcNetwork(character);
  const year = opts.year;
  return network.npcs.filter((npc) => {
    if (opts.role && npc.role !== opts.role) return false;
    if (opts.aliveOnly && !isNpcAlive(npc, year)) return false;
    if (opts.deadOnly && isNpcAlive(npc, year)) return false;
    return true;
  });
}

export function findNpc(character, idOrRole) {
  const npcs = character?.npcNetwork?.npcs || [];
  return npcs.find((npc) => npc.id === idOrRole)
    || npcs.find((npc) => npc.role === idOrRole)
    || null;
}

export function livingParentRoles(character, year) {
  const father = findNpc(character, "father");
  const mother = findNpc(character, "mother");
  return {
    fatherAlive: isNpcAlive(father, year),
    motherAlive: isNpcAlive(mother, year),
    anyParentAlive: isNpcAlive(father, year) || isNpcAlive(mother, year),
    orphan: Boolean(father && mother) && !isNpcAlive(father, year) && !isNpcAlive(mother, year),
    father,
    mother,
  };
}

function syncBloodlineAlive(character, year = null) {
  const parents = character.bloodline?.parents;
  if (!parents) return;
  const y = year != null ? num(year) : null;
  for (const role of ["father", "mother"]) {
    const npc = findNpc(character, role);
    const parent = parents[role];
    if (!parent || !npc) continue;
    parent.alive = y == null ? npc.alive !== false : isNpcAlive(npc, y);
    parent.deathYear = npc.deathYear;
  }
}

export function applyAffectionDelta(character, npcId, delta, time = {}) {
  const npc = typeof npcId === "object" ? npcId : findNpc(character, npcId);
  if (!npc || !isNpcAlive(npc, yearOf(time, character))) return null;
  npc.affection = clamp(npc.affection + num(delta), 0, 100);
  npc.attitude = attitudeOf(npc.affection);
  npc.stance = affectionBandOf(npc.affection).id;
  const network = ensureNpcNetwork(character);
  if (npc.affection <= 16 || npc.affection >= 88) {
    network.pendingCrisis = true;
    if (npc.affection <= 16 && npc.role !== "rival") network.pendingKind = "betrayal";
    if (npc.affection <= 16 && npc.role === "rival") network.pendingKind = "rival_strike";
    if (npc.affection >= 88 && !network.pendingKind) network.pendingNpcId = npc.id;
  }
  return npc;
}

export function killNpc(character, npcId, opts = {}) {
  const npc = typeof npcId === "object" ? npcId : findNpc(character, npcId);
  if (!npc || !npc.alive) return { killed: false };
  const year = num(opts.year ?? opts.time?.year, yearOf(opts, character));
  npc.alive = false;
  npc.deathYear = year;
  npc.cause = opts.cause || "illness";
  const network = ensureNpcNetwork(character);
  network.events.push({ kind: "death", npcId: npc.id, role: npc.role, year, cause: npc.cause });
  network.pendingCrisis = true;
  network.pendingNpcId = npc.id;
  if (npc.role === "spouse") network.pendingKind = "spouse_loss";
  else if (npc.role === "father" || npc.role === "mother") {
    const parents = livingParentRoles(character, year);
    network.pendingKind = parents.orphan ? "orphan" : "parent_death";
  } else if (npc.role === "rival") {
    network.pendingKind = null;
    network.pendingCrisis = false;
  } else {
    network.pendingKind = "parent_death";
  }
  syncParentTagsOnDeath(character, npc, year);
  syncBloodlineAlive(character, year);
  return { killed: true, npc, kind: network.pendingKind };
}

function syncParentTagsOnDeath(character, npc, year) {
  if (npc.role !== "father" && npc.role !== "mother") return;
  const aliveId = `parent_${npc.role}_alive`;
  const deadId = `parent_${npc.role}_deceased`;
  if (characterHasTag(character, aliveId)) removeCharacterTag(character, aliveId);
  if (!characterHasTag(character, deadId)) {
    addCharacterTag(character, {
      id: deadId,
      category: "parent",
      label: npc.role === "father" ? "父親已故" : "母親已故",
      source: "kin",
      reason: `${year}年離世`,
      valence: "neg",
    });
  }
  const parents = livingParentRoles(character, year);
  if (parents.orphan && !characterHasTag(character, "kin_orphan")) {
    addCharacterTag(character, {
      id: "kin_orphan",
      category: "kin",
      label: "孤兒",
      source: "kin",
      valence: "neg",
      temporary: true,
      strainIn: ["family", "health", "hunger"],
    });
  }
}

function eraDeathMul(ctx = {}) {
  const year = yearOf(ctx);
  const region = String(ctx.region || ctx.character?.region || "");
  const war = Boolean(ctx.lifeContext?.war || ctx.tags?.includes?.("war") || ctx.eraCrisis?.score >= 40);
  let mul = 1;
  if (year >= 1929 && year <= 1933 && region === "west") mul *= 1.35;
  if (year >= 1937 && year <= 1945) mul *= 1.8;
  if (year >= 1958 && year <= 1962 && region === "china") mul *= 2.2;
  if (war) mul *= 1.6;
  if (ctx.eraCrisis?.score >= 48) mul *= 1.4;
  return mul;
}

function npcAge(npc, year) {
  if (npc.birthYear == null) return 40;
  return Math.max(0, year - num(npc.birthYear));
}

function maybeKillNpc(rng, character, npc, ctx) {
  if (!isNpcAlive(npc, yearOf(ctx, character))) return false;
  const year = yearOf(ctx, character);
  const age = npcAge(npc, year);
  let p = NPC_BASE_DEATH[npc.role] || 0.003;
  if (age >= 60) p *= 1.8;
  if (age >= 75) p *= 2.2;
  if (age < 8 && npc.role === "sibling") p *= 1.5;
  p *= eraDeathMul(ctx);
  if (character.wealth?.band === "bankrupt" || character.wealth?.band === "destitute") p *= 1.25;
  if (!chance(rng, Math.min(0.22, p))) return false;
  const cause = ctx.lifeContext?.war || ctx.eraCrisis?.score >= 40
    ? (chance(rng, 0.55) ? "war" : "illness")
    : (character.wealth?.band === "bankrupt" ? "hunger" : "illness");
  killNpc(character, npc, { year, cause });
  return true;
}

function maybeSpawnSpouse(rng, character, ctx) {
  const age = num(ctx.ageYears, 0);
  if (age < 18) return null;
  if (listNpcs(character, { role: "spouse", aliveOnly: true, year: yearOf(ctx, character) }).length) return null;
  if (!chance(rng, age >= 24 ? 0.04 : 0.02)) return null;
  const eth = defaultBloodlineRegistry.getEthnicity(character.bloodline?.primaryEthnicityId);
  const settlement = findSettlement(character.cityId);
  const gender = character.gender === "female" ? "male" : "female";
  const by = yearOf(ctx, character) - randInt(rng, 16, 36);
  const name = formatCulturalName(eth, gender, rng, settlement, by);
  const npc = normalizeNpc({
    id: makeNpcId("spouse", name, by),
    role: "spouse",
    name,
    gender,
    birthYear: by,
    affection: clamp(48 + randInt(rng, -6, 18), 30, 78),
    source: "bond",
  });
  ensureNpcNetwork(character).npcs.push(npc);
  ensureNpcNetwork(character).events.push({ kind: "bond", npcId: npc.id, role: "spouse", year: yearOf(ctx, character) });
  return npc;
}

function maybeSpawnRival(rng, character, ctx) {
  const age = num(ctx.ageYears, 0);
  if (age < 12) return null;
  if (listNpcs(character, { role: "rival", aliveOnly: true, year: yearOf(ctx, character) }).length) return null;
  const schoolHeat = (character.tags || []).some((t) => /school_bullied|school_hated|caste_/.test(t));
  if (!chance(rng, schoolHeat ? 0.06 : 0.02)) return null;
  const eth = defaultBloodlineRegistry.getEthnicity(character.bloodline?.primaryEthnicityId);
  const settlement = findSettlement(character.cityId);
  const gender = chance(rng, 0.5) ? "female" : "male";
  const by = yearOf(ctx, character) - randInt(rng, 8, 28);
  const name = formatCulturalName(eth, gender, rng, settlement, by);
  const npc = normalizeNpc({
    id: makeNpcId("rival", name, by),
    role: "rival",
    name,
    gender,
    birthYear: by,
    affection: clamp(12 + randInt(rng, 0, 16), 4, 28),
    source: "rival",
  });
  ensureNpcNetwork(character).npcs.push(npc);
  return npc;
}

export function weeklyNpcTick(character, ctx = {}, rng = Math.random) {
  const network = ensureNpcNetwork(character, rng);
  const year = yearOf(ctx, character);
  const notes = [];
  let death = null;
  for (const npc of network.npcs.slice()) {
    if (!isNpcAlive(npc, year)) continue;
    npc.attitude = attitudeOf(npc.affection);
    if (maybeKillNpc(rng, character, npc, ctx)) {
      death = npc;
      notes.push(composeKinBeat(ctx, network, { kind: "death", npc }));
      break;
    }
    if (npc.role === "rival") npc.affection = clamp(npc.affection - (chance(rng, 0.4) ? 1 : 0), 0, 100);
    else if (ctx.lifeContext?.householdHarsh && (npc.role === "father" || npc.role === "mother")) {
      npc.affection = clamp(npc.affection - (chance(rng, 0.25) ? 1 : 0), 0, 100);
    } else if (chance(rng, 0.12)) {
      npc.affection = clamp(npc.affection + (chance(rng, 0.5) ? 1 : -1), 0, 100);
    }
    npc.attitude = attitudeOf(npc.affection);
    npc.stance = affectionBandOf(npc.affection).id;
  }
  const spouse = maybeSpawnSpouse(rng, character, ctx);
  if (spouse) notes.push(composeKinBeat(ctx, network, { kind: "bond", npc: spouse }));
  maybeSpawnRival(rng, character, ctx);
  evaluateKinExtremes(character, ctx);
  syncBloodlineAlive(character, year);
  return { network, notes, death, snapshot: publicKinView(character, year) };
}

function evaluateKinExtremes(character, ctx = {}) {
  const network = ensureNpcNetwork(character);
  const year = yearOf(ctx, character);
  const parents = livingParentRoles(character, year);
  if (parents.orphan) {
    network.pendingCrisis = true;
    network.pendingKind = network.pendingKind || "orphan";
  }
  for (const npc of listNpcs(character, { aliveOnly: true, year })) {
    if (npc.affection <= 14 && (npc.role === "father" || npc.role === "mother" || npc.role === "spouse")) {
      network.pendingCrisis = true;
      network.pendingKind = network.pendingKind || "abandonment";
      network.pendingNpcId = npc.id;
    }
    if (npc.affection <= 12 && npc.role === "sibling") {
      network.pendingCrisis = true;
      network.pendingKind = network.pendingKind || "betrayal";
      network.pendingNpcId = npc.id;
    }
    if (npc.role === "rival" && npc.affection <= 20) {
      network.pendingCrisis = true;
      network.pendingKind = network.pendingKind || "rival_strike";
      network.pendingNpcId = npc.id;
    }
  }
}

export function shouldForceKinCrisis(character, ctx = {}) {
  if (!character) return false;
  const network = ensureNpcNetwork(character);
  const turn = num(ctx.turnCount ?? ctx.turn, 0);
  if (turn - num(network.lastCrisisTurn, -999) < KIN_CRISIS_COOLDOWN && !network.pendingCrisis) {
    return false;
  }
  if (network.pendingCrisis) return true;
  evaluateKinExtremes(character, ctx);
  return Boolean(network.pendingCrisis);
}

export function armKinCrisis(character, ctx = {}) {
  const network = ensureNpcNetwork(character);
  evaluateKinExtremes(character, ctx);
  if (shouldForceKinCrisis(character, ctx)) network.pendingCrisis = true;
  return network;
}

export function composeKinBeat(ctx = {}, network = {}, tip = {}) {
  const facts = ctx.narrativeFacts || scanNarrativeFacts(ctx);
  const year = facts.year || ctx.year || "";
  const city = facts.city || "此地";
  const npc = tip.npc || (tip.npcId ? network.npcs?.find((row) => row.id === tip.npcId) : null);
  const who = npc ? `${roleLabel(npc.role)}${npc.name}` : "家裏的人";
  if (tip.kind === "death" || tip.kind === "parent_death") {
    return `${year}年，${city}，${who}這兩週不在了。`;
  }
  if (tip.kind === "orphan") return `${year}年，${city}，父母兩邊的名字都從戶口上劃掉了。`;
  if (tip.kind === "abandonment") return `${year}年，${city}，${who}把門帶上，不再認這張牀。`;
  if (tip.kind === "betrayal") return `${year}年，${city}，${who}把話傳到外頭，對你不利。`;
  if (tip.kind === "rival_strike") return `${year}年，${city}，${who}這兩週專門堵你的路。`;
  if (tip.kind === "spouse_loss") return `${year}年，${city}，${who}這兩週不在了，屋裏少一個人。`;
  if (tip.kind === "bond") return `${year}年，${city}，${who}開始跟你同桌吃飯。`;
  return `${year}年，${city}，家裏的人這兩週臉色還寫在臉上。`;
}

export function renderKinCrisis(incident, ctx = {}) {
  return composeKinBeat(ctx, ctx.character?.npcNetwork, {
    kind: incident?.kind,
    npcId: incident?.npcId,
    npc: incident?.npc,
  });
}

function crisisOption(rng, ctx, incident, index) {
  const kind = incident.kind;
  const lanes = kind === "orphan"
    ? [{ kind: "family", dir: "endure" }, { kind: "hunger", dir: "seek" }, { kind: "family", dir: "flee" }]
    : kind === "abandonment"
      ? [{ kind: "family", dir: "endure" }, { kind: "family", dir: "resist" }, { kind: "family", dir: "seek" }]
      : kind === "betrayal"
        ? [{ kind: "family", dir: "resist" }, { kind: "family", dir: "flee" }, { kind: "family", dir: "guard" }]
        : kind === "rival_strike"
          ? [{ kind: "family", dir: "guard" }, { kind: "family", dir: "flee" }, { kind: "family", dir: "resist" }]
          : kind === "spouse_loss"
            ? [{ kind: "family", dir: "endure" }, { kind: "illness", dir: "endure" }, { kind: "family", dir: "seek" }]
            : [{ kind: "family", dir: "endure" }, { kind: "family", dir: "help" }, { kind: "illness", dir: "endure" }];
  const lane = lanes[index % lanes.length];
  const text = composeChoiceLine(rng, ctx, lane.kind, index + 51, { direction: lane.dir });
  const tag = KIN_TAG_RULES.find((row) => row.crisis === kind)?.id || "kin_grief";
  const flows = [
    { sanity: -4, health: -1, affection: 0 },
    { sanity: -2, health: -2, affection: 4 },
    { sanity: -3, health: 0, affection: -6 },
  ][index % 3];
  return {
    id: `kin_${kind}_${index}`,
    text,
    trueText: text,
    kinCrisis: true,
    kinKind: kind,
    kinNpcId: incident.npcId || null,
    addTags: [
      tag,
      kind === "orphan" || kind === "abandonment" ? "trauma_attachment_starve" : null,
      kind === "parent_death" || kind === "spouse_loss" ? "trauma_melancholia" : null,
    ].filter(Boolean),
    effects: { sanity: flows.sanity, health: flows.health, mood: flows.sanity },
    kinDelta: incident.npcId ? { npcId: incident.npcId, affection: flows.affection } : null,
    trauma: kind === "orphan" || kind === "abandonment"
      ? { tags: ["trauma_attachment_starve"], intensity: 5, domain: "home" }
      : (kind === "parent_death" || kind === "spouse_loss"
        ? { tags: ["trauma_melancholia"], intensity: 4, domain: "home" }
        : null),
    hooks: ["family", kind === "rival_strike" ? "violence" : "home"],
  };
}

export function pickKinCrisis(rng, ctx = {}) {
  const character = ctx.character;
  if (!character || !shouldForceKinCrisis(character, ctx)) return null;
  const network = ensureNpcNetwork(character);
  const year = yearOf(ctx, character);
  let kind = network.pendingKind;
  let npc = network.pendingNpcId ? findNpc(character, network.pendingNpcId) : null;
  if (!kind || !KIN_CRISIS_KINDS.includes(kind)) {
    const parents = livingParentRoles(character, year);
    if (parents.orphan) kind = "orphan";
    else if (network.events.slice(-1)[0]?.kind === "death") kind = "parent_death";
    else kind = "betrayal";
  }
  if (!npc) {
    if (kind === "rival_strike") npc = listNpcs(character, { role: "rival", aliveOnly: true, year })[0];
    else if (kind === "spouse_loss") npc = listNpcs(character, { role: "spouse", deadOnly: true, year })[0]
      || listNpcs(character, { role: "spouse", year })[0];
    else if (kind === "parent_death" || kind === "orphan") {
      npc = listNpcs(character, { deadOnly: true, year }).find((row) => row.role === "father" || row.role === "mother")
        || findNpc(character, "father")
        || findNpc(character, "mother");
    } else {
      npc = listNpcs(character, { aliveOnly: true, year }).sort((a, b) => a.affection - b.affection)[0];
    }
  }
  const incident = {
    id: `kin_crisis_${kind}`,
    kind,
    lock: "kin",
    npcId: npc?.id || null,
    npc: npc || null,
    fact: renderKinCrisis({ kind, npcId: npc?.id, npc }, ctx),
    options: [0, 1, 2].map((index) => crisisOption(rng, ctx, { kind, npcId: npc?.id }, index)),
  };
  return incident;
}

export function consumeKinLock(character, incident = null, turnCount = 0) {
  const network = ensureNpcNetwork(character);
  network.pendingCrisis = false;
  network.lastCrisisTurn = num(turnCount);
  network.crises = (network.crises || 0) + 1;
  if (incident?.kind) network.lastKind = incident.kind;
  network.pendingKind = null;
  network.pendingNpcId = null;
  return network;
}

export function applyKinCrisisChoice(character, option, time = {}) {
  if (!character || !option?.kinCrisis) return { applied: [], notes: [], tags: [] };
  const network = ensureNpcNetwork(character);
  if (option.kinDelta?.npcId) {
    applyAffectionDelta(character, option.kinDelta.npcId, option.kinDelta.affection, time);
  }
  const tags = [...new Set(option.addTags || [])];
  for (const id of tags) {
    if (!characterHasTag(character, id)) {
      const rule = KIN_TAG_RULES.find((row) => row.id === id);
      addCharacterTag(character, {
        id,
        category: "kin",
        label: rule?.label || id,
        source: "kin",
        valence: "neg",
        temporary: true,
        strainIn: rule?.strain || ["family"],
      });
    }
  }
  consumeKinLock(character, { kind: option.kinKind }, time.turnCount ?? time.turn);
  return {
    applied: tags.map((id) => ({ id })),
    notes: [composeKinBeat({ year: time.year, character }, network, { kind: option.kinKind })],
    tags,
  };
}

export function applyChoiceKinEffects(character, option, ctx = {}) {
  if (!character || !option) return { changed: [] };
  const year = yearOf(ctx, character);
  const changed = [];
  if (option.kinDelta?.npcId || option.kinDelta?.role) {
    const npc = applyAffectionDelta(
      character,
      option.kinDelta.npcId || option.kinDelta.role,
      option.kinDelta.affection ?? 0,
      ctx,
    );
    if (npc) changed.push(npc.id);
  }
  const hooks = option.hooks || [];
  const text = `${option.text || ""} ${option.trueText || ""}`;
  let delta = 0;
  if (hooks.includes("family") || /父親|母親|家裏|兄|姊|弟|妹|伴侶/.test(text)) {
    if (/幫|護|守|照顧|替/.test(text) || (option.direction || "") === "help") delta = 3;
    else if (/逃|躲|不認|頂嘴|反/.test(text) || (option.direction || "") === "resist") delta = -3;
    else if ((option.direction || "") === "endure") delta = 1;
  }
  if (!delta) return { changed };
  const target = listNpcs(character, { aliveOnly: true, year })
    .filter((npc) => npc.role !== "rival")
    .sort((a, b) => {
      const aHit = text.includes(a.name) || text.includes(roleLabel(a.role));
      const bHit = text.includes(b.name) || text.includes(roleLabel(b.role));
      return Number(bHit) - Number(aHit);
    })[0];
  if (target) {
    applyAffectionDelta(character, target, delta, ctx);
    changed.push(target.id);
  }
  return { changed };
}

export function canMintKinBond(ctx = {}) {
  const age = num(ctx.ageYears, 0);
  if (age < 8) return false;
  const living = listNpcs(ctx.character, { aliveOnly: true, year: yearOf(ctx, ctx.character) });
  return living.some((npc) => npc.role === "father" || npc.role === "mother" || npc.role === "sibling" || npc.role === "spouse");
}

export function mintKinBondOption(rng, ctx = {}, index = 1) {
  const year = yearOf(ctx, ctx.character);
  const living = listNpcs(ctx.character, { aliveOnly: true, year })
    .filter((npc) => npc.role !== "rival");
  const npc = pick(rng, living) || living[0];
  if (!npc) return null;
  const text = composeChoiceLine(rng, ctx, "family", index + 61, {
    direction: npc.affection >= 55 ? "help" : "endure",
    driverTags: ["kin_bonded", `kin_${npc.role || "relative"}`],
    tagFocus: "kin",
  });
  return {
    id: `kin_bond_${npc.id}`,
    text,
    trueText: text,
    tagDriven: true,
    liveTagMint: true,
    zeroHardcodedTemplates: true,
    driverTags: ["kin_bonded", `kin_${npc.role || "relative"}`],
    kinBond: true,
    kinNpcId: npc.id,
    kinDelta: { npcId: npc.id, affection: npc.affection >= 55 ? 4 : 2 },
    effects: { sanity: npc.affection >= 60 ? 1 : 0, mood: 1 },
    hooks: ["family", "home"],
  };
}

export function syncKinTags(character, ctx = {}) {
  const network = ensureNpcNetwork(character);
  const year = yearOf(ctx, character);
  const parents = livingParentRoles(character, year);
  const changed = [];
  const living = listNpcs(character, { aliveOnly: true, year });
  const maxAff = living.reduce((m, npc) => Math.max(m, npc.affection), 0);
  const minAff = living.reduce((m, npc) => Math.min(m, npc.affection), 100);

  for (const rule of KIN_TAG_RULES) {
    const has = characterHasTag(character, rule.id);
    let on = false;
    if (rule.crisis && network.lastKind === rule.crisis && network.crises) on = true;
    if (rule.id === "kin_orphan" && parents.orphan) on = true;
    if (rule.minAffection != null && maxAff >= rule.minAffection) on = true;
    if (rule.maxAffection != null && minAff <= rule.maxAffection && living.length) on = true;
    if (!has && on) {
      addCharacterTag(character, {
        id: rule.id,
        category: "kin",
        label: rule.label,
        source: "kin",
        valence: rule.minAffection ? "pos" : "neg",
        temporary: true,
        strainIn: rule.strain || [],
      });
      changed.push({ action: "add", tag: rule.id });
    } else if (has && !on && rule.id === "kin_bonded" && maxAff < 60) {
      removeCharacterTag(character, rule.id);
      changed.push({ action: "remove", tag: rule.id });
    } else if (has && !on && rule.id === "kin_estranged" && minAff > 24) {
      removeCharacterTag(character, rule.id);
      changed.push({ action: "remove", tag: rule.id });
    }
  }

  for (const role of ["father", "mother"]) {
    const alive = role === "father" ? parents.fatherAlive : parents.motherAlive;
    const aliveId = `parent_${role}_alive`;
    const deadId = `parent_${role}_deceased`;
    if (alive) {
      if (characterHasTag(character, deadId)) {
        removeCharacterTag(character, deadId);
        changed.push({ action: "remove", tag: deadId });
      }
      if (!characterHasTag(character, aliveId)) {
        addCharacterTag(character, {
          id: aliveId,
          category: "parent",
          label: role === "father" ? "父親在世" : "母親在世",
          source: "kin",
        });
        changed.push({ action: "add", tag: aliveId });
      }
    } else if (parents.father || parents.mother || findNpc(character, role)) {
      if (characterHasTag(character, aliveId)) {
        removeCharacterTag(character, aliveId);
        changed.push({ action: "remove", tag: aliveId });
      }
      if (!characterHasTag(character, deadId)) {
        addCharacterTag(character, {
          id: deadId,
          category: "parent",
          label: role === "father" ? "父親已故" : "母親已故",
          source: "kin",
          valence: "neg",
        });
        changed.push({ action: "add", tag: deadId });
      }
    }
  }
  return { network, changed };
}

export function publicKinView(character, year = null) {
  const network = character?.npcNetwork ? emptyNpcNetwork(character.npcNetwork) : emptyNpcNetwork();
  const y = year ?? character?.birthYear ?? 1920;
  const living = network.npcs.filter((npc) => isNpcAlive(npc, y));
  const dead = network.npcs.filter((npc) => !isNpcAlive(npc, y));
  const parents = livingParentRoles(character || { npcNetwork: network, birthYear: y }, y);
  const closest = living.slice().sort((a, b) => b.affection - a.affection)[0] || null;
  const coldest = living.slice().sort((a, b) => a.affection - b.affection)[0] || null;
  let line = "家裏的人還在戶口上。";
  if (parents.orphan) line = "父母都不在了。";
  else if (!parents.fatherAlive && parents.motherAlive) {
    line = parents.mother?.name ? `母親${parents.mother.name}還在，父親不在了。` : "母親還在，父親不在了。";
  } else if (parents.fatherAlive && !parents.motherAlive) {
    line = parents.father?.name ? `父親${parents.father.name}還在，母親不在了。` : "父親還在，母親不在了。";
  } else if (!parents.anyParentAlive && living.length) line = "監護或旁系還在，親生父母不在。";
  else if (coldest && coldest.affection <= 22) line = `${roleLabel(coldest.role)}${coldest.name}已經不認你這張臉。`;
  else if (closest && closest.affection >= 72) line = `${roleLabel(closest.role)}${closest.name}還肯替你擋一回。`;
  else if (network.pendingCrisis) line = "家裏這兩週要出事。";
  return {
    pendingCrisis: network.pendingCrisis,
    pendingKind: network.pendingKind,
    crises: network.crises,
    living: living.map((npc) => ({
      id: npc.id,
      role: npc.role,
      name: npc.name,
      affection: npc.affection,
      attitude: npc.attitude,
      label: roleLabel(npc.role),
    })),
    dead: dead.map((npc) => ({
      id: npc.id,
      role: npc.role,
      name: npc.name,
      deathYear: npc.deathYear,
      label: roleLabel(npc.role),
    })),
    fatherAlive: parents.fatherAlive,
    motherAlive: parents.motherAlive,
    orphan: parents.orphan,
    line,
  };
}

export function kinPressureScore(character, year = null) {
  if (!character) return 0;
  const view = publicKinView(character, year);
  let score = 0;
  if (view.orphan) score += 26;
  if (!view.fatherAlive || !view.motherAlive) score += 8;
  if (view.pendingCrisis) score += 14;
  for (const npc of view.living) {
    if (npc.attitude === "hostile") score += 10;
    if (npc.role === "rival" && npc.affection <= 24) score += 12;
  }
  if ((character.tags || []).includes("kin_grief") || (character.tags || []).includes("kin_abandoned")) {
    score += 10;
  }
  return score;
}

export function pickSpeakerKin(character, ctx = {}) {
  const year = yearOf(ctx, character);
  const living = listNpcs(character, { aliveOnly: true, year })
    .filter((npc) => npc.role === "father" || npc.role === "mother" || npc.role === "guardian" || npc.role === "spouse" || npc.role === "sibling");
  if (!living.length) return null;
  return living.sort((a, b) => {
    const rank = { mother: 0, father: 1, guardian: 2, spouse: 3, sibling: 4 };
    return (rank[a.role] ?? 9) - (rank[b.role] ?? 9) || b.affection - a.affection;
  })[0];
}

export function kinVoiceMeta(character, ctx = {}) {
  const npc = pickSpeakerKin(character, ctx);
  if (!npc) return null;
  return {
    speaker: "household",
    who: `${roleLabel(npc.role)}${npc.name}`,
    attitude: VOICE_ATTITUDE[npc.attitude] || "ordinary",
    kinAttitude: npc.attitude,
    npcId: npc.id,
    affection: npc.affection,
  };
}
