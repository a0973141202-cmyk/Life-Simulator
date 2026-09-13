/**
 * Persona tag mechanics for rare special presets.
 * Hardboiled / brotherhood / quit-ahead / Shimokitazawa beast rules stay player-facing only.
 */
import { characterHasTag } from "./tag-system.js";
import { applyWealthDelta, ensureWealth, wealthPressureScore } from "./wealth-engine.js";
import {
  applyAffectionDelta,
  ensureNpcNetwork,
  listNpcs,
  roleLabel,
} from "./npc-social-engine.js";
import { composeChoiceLine } from "./dynamic-prose.js";
import { scanNarrativeFacts } from "./narrative-facts.js";
import { formatCulturalName } from "./naming-engine.js";
import { defaultBloodlineRegistry } from "./bloodlines.js";
import { findSettlement } from "./settlements.js";

const UNJUST_OPTION_RE = /出賣|栽贓|落井下石|坑害朋友|誣告|吞下別人|背叛|勒索弱|假造帳|栽害|借刀殺人|騙朋友|賣友/;

const ABYSS_NOTES = Object.freeze([
  "巷口忽然多了一個說話不按常理的人，像被什麼磁場拽過來。",
  "對頭與巷友同一週撞上：命運交錯得荒唐，卻又像註定。",
  "深夜的酒館燈把一個怪人照進你的路，之後帳本就亂了。",
]);

const ATHLETE_MEME_NOTES = Object.freeze([
  "下北澤打工練出來的肺還夠用，班表與惡臭傳說卻從後腦勺往下扣——有人笑他「還能撐」，他自己只覺得耳鳴。",
  "高壓打工忽然想笑：腿還在，腦子卻像被誰用哨子吹歪了。",
  "旁人說他「野獸還能跑」；他只覺得精神帳比體能帳先見紅。",
  "突發遭遇帶點黑色玩笑：活著本身像一場罰跑，哨響了卻沒人告訴終點在哪。",
]);

const RICARDO_DRIVERS = Object.freeze([
  "persona_banana_legend",
  "persona_meme_dancer",
  "persona_brazil_samba",
  "persona_absolute_freedom",
  "persona_invincible_smile",
]);

function tagsOf(character = {}) {
  const bag = [
    ...(character.tags || []),
    ...(character.tagRecords || []).map((row) => row.id),
  ];
  return new Set(bag.map((tag) => String(tag || "")).filter(Boolean));
}

export function hasPersona(character, id) {
  if (!character || !id) return false;
  if (characterHasTag(character, id)) return true;
  return tagsOf(character).has(id);
}

function hasAnyPersona(character, ids = []) {
  return (ids || []).some((id) => hasPersona(character, id));
}

export function ensurePersonaState(character) {
  if (!character.personaState || typeof character.personaState !== "object") {
    character.personaState = {
      favors: [],
      lastStopLossTurn: -99,
      lastPaybackTurn: -99,
      brotherhoodStands: 0,
      crisisSwing: 0,
      lastCrisisSwingTurn: -99,
      lastAthleteDrainTurn: -99,
      lastAbyssTurn: -99,
    };
  }
  if (!Array.isArray(character.personaState.favors)) character.personaState.favors = [];
  if (character.personaState.crisisSwing == null) character.personaState.crisisSwing = 0;
  return character.personaState;
}

function roll01(rng) {
  return typeof rng === "function" ? rng() : Math.random();
}

/**
 * Legend + beast instinct: extreme crisis volatility stored for the week.
 * Positive swing lowers crisis score; negative deepens it.
 */
export function rollPersonaCrisisSwing(character, rng, ctx = {}) {
  if (!character) return { applied: false, note: "" };
  const state = ensurePersonaState(character);
  const turn = Number(ctx.turnCount ?? ctx.time?.turnCount ?? 0);
  if (!hasPersona(character, "persona_beast_senpai")
    || !hasAnyPersona(character, ["persona_shimokita_labor", "persona_114514"])) {
    state.crisisSwing = 0;
    return { applied: false, note: "" };
  }
  if (turn === Number(state.lastCrisisSwingTurn)) {
    return { applied: true, note: "", swing: state.crisisSwing };
  }
  const r = roll01(rng);
  let swing = 0;
  let note = "";
  if (r < 0.36) {
    swing = -26 - Math.round(roll01(rng) * 10);
    note = "野獸直覺這回把路走窄了：危機像潮水灌進下北澤的窄巷。";
  } else if (r > 0.64) {
    swing = 28 + Math.round(roll01(rng) * 12);
    note = "絕處一閃：野獸直覺把人從牆縫與汽笛縫裡拽了出來。";
  } else {
    swing = Math.round((r - 0.5) * 44);
    if (Math.abs(swing) >= 10) {
      note = swing > 0
        ? "傳奇這兩週還肯給一條縫，危機沒有咬死。"
        : "磁場發沉，街頭生存的帳比往常更難算。";
    }
  }
  state.crisisSwing = swing;
  state.lastCrisisSwingTurn = turn;
  return { applied: true, swing, note };
}

/** Hardy+principled, athlete buffer, muscle wrestler resist, and weekly beast swing. */
export function personaCrisisResistBonus(character) {
  let bonus = 0;
  if (hasPersona(character, "persona_hardy") && hasPersona(character, "persona_principled")) {
    bonus += 18;
  }
  if (hasPersona(character, "persona_shimokita_labor") || hasPersona(character, "persona_onmad_classic")) {
    bonus += 7;
  }
  if (hasPersona(character, "persona_aniki_wrestle") || hasPersona(character, "persona_biochem")) {
    bonus += 24;
  }
  const state = character?.personaState;
  bonus += Number(state?.crisisSwing || 0);
  return bonus;
}

/**
 * Athlete + high-pressure: body holds, sanity drains under class/era upheaval;
 * occasional dark-humor encounter lines.
 */
export function applyAthleteHighPressureTick(character, rng, ctx = {}) {
  if (!character) return { applied: false, note: "" };
  if (!hasPersona(character, "persona_shimokita_labor") && !hasPersona(character, "persona_stench_foul")) {
    return { applied: false, note: "" };
  }
  const state = ensurePersonaState(character);
  const turn = Number(ctx.turnCount ?? 0);
  if (turn - Number(state.lastAthleteDrainTurn || -99) < 1) return { applied: false, note: "" };

  const upheaval = Number(ctx.upheavalScore ?? ctx.upheaval?.score ?? character.upheavalState?.score ?? 0);
  const era = Number(ctx.eraCrisis ?? ctx.eraCrisisScore ?? ctx.pressure?.eraCrisis ?? 0);
  const wealthGap = Number(ctx.wealthGap ?? wealthPressureScore(character) ?? 0);
  const casteHit = (character.tags || []).some((tag) => String(tag).startsWith("caste_"))
    || (character.tagRecords || []).some((row) => String(row.id || "").startsWith("caste_"));
  const pressure = upheaval * 0.45 + era * 0.55 + wealthGap * 0.25 + (casteHit ? 14 : 0);
  if (pressure < 10) return { applied: false, note: "" };

  state.lastAthleteDrainTurn = turn;
  const drain = Math.min(9, Math.max(2, Math.round(2 + pressure * 0.07)));
  if (character.stats) {
    character.stats.sanity = Math.max(1, Number(character.stats.sanity ?? 50) - drain);
    character.stats.health = Math.min(100, Number(character.stats.health ?? 50) + 1);
  }

  let note = "下北澤打工練出的身子還撐著，時代與班表的壓卻從精神帳上先扣。";
  if (roll01(rng) < 0.32) {
    note = ATHLETE_MEME_NOTES[Math.floor(roll01(rng) * ATHLETE_MEME_NOTES.length)];
  }
  return { applied: true, note, drain };
}

/**
 * Billy: major setback / betrayal → 「男人的浪漫與眼淚」— crisis into willpower.
 */
export function applyBillyRomanceCrisis(character, rng, ctx = {}) {
  if (!character || character.specialPresetId !== "billy_herrington") {
    return { applied: false, note: "" };
  }
  if (!hasAnyPersona(character, ["persona_aniki_wrestle", "persona_deep_philosophy", "persona_loyal_bond"])) {
    return { applied: false, note: "" };
  }
  const state = ensurePersonaState(character);
  const turn = Number(ctx.turnCount ?? 0);
  if (turn - Number(state.lastBillyRomanceTurn || -99) < 8) return { applied: false, note: "" };
  const health = Number(character.stats?.health ?? 50);
  const sanity = Number(character.stats?.sanity ?? 50);
  const crisis = Number(ctx.pressure?.score ?? 0);
  const betrayal = (listNpcs(character, { aliveOnly: true, year: ctx.year || ctx.time?.year }) || [])
    .some((npc) => (npc.affection || 50) <= 28 && (npc.role === "friend" || npc.role === "rival"));
  const major = health <= 32 || sanity <= 28 || crisis >= 52 || betrayal;
  if (!major || roll01(rng) > 0.55) return { applied: false, note: "" };
  state.lastBillyRomanceTurn = turn;
  if (character.stats) {
    character.stats.sanity = Math.min(100, sanity + 8);
    character.stats.health = Math.min(100, health + 3);
  }
  state.crisisSwing = Math.max(Number(state.crisisSwing || 0), 22);
  return {
    applied: true,
    note: "男人的浪漫與眼淚這兩週強制上場：挫折與背叛被摔角手的哲學寫成不屈的意志。",
  };
}

/**
 * Ricardo: extreme joy infection — sanity may convert toward bliss under rhythm.
 */
export function applyRicardoBlissTick(character, rng, ctx = {}) {
  if (!character || character.specialPresetId !== "ricardo_milos") {
    return { applied: false, note: "" };
  }
  if (!hasAnyPersona(character, RICARDO_DRIVERS)) return { applied: false, note: "" };
  const state = ensurePersonaState(character);
  const turn = Number(ctx.turnCount ?? 0);
  if (turn - Number(state.lastRicardoBlissTurn || -99) < 6) return { applied: false, note: "" };
  if (roll01(rng) > 0.34) return { applied: false, note: "" };
  state.lastRicardoBlissTurn = turn;
  const sanity = Number(character.stats?.sanity ?? 50);
  if (character.stats) {
    // Bliss: pull sanity toward a high "極樂" band without soft-locking death.
    character.stats.sanity = Math.min(100, Math.max(sanity, 62) + 4);
    character.stats.mood = Math.min(100, Number(character.stats.mood ?? 50) + 3);
  }
  return {
    applied: true,
    note: "無敵笑容與巴西森巴把神智往極樂一邊拽：嚴肅教條這兩週先失效。",
  };
}

/**
 * Abyss magnetism: warp NPC affection or pull eccentric friend/rival into the network.
 */
export function resolveAbyssMagnetism(character, rng, ctx = {}) {
  if (!character || !hasPersona(character, "persona_onmad_classic")) {
    return { applied: false, note: "" };
  }
  const state = ensurePersonaState(character);
  const turn = Number(ctx.turnCount ?? 0);
  if (turn - Number(state.lastAbyssTurn || -99) < 7) return { applied: false, note: "" };
  if (roll01(rng) > 0.42) return { applied: false, note: "" };

  state.lastAbyssTurn = turn;
  const year = Number(ctx.year || ctx.time?.year || character.birthYear || 1920);
  const network = ensureNpcNetwork(character);
  const others = listNpcs(character, { aliveOnly: true, year })
    .filter((npc) => npc.role !== "father" && npc.role !== "mother");

  if (others.length && roll01(rng) < 0.55) {
    const target = others[Math.floor(roll01(rng) * others.length)];
    const spike = roll01(rng) < 0.5 ? -22 - Math.round(roll01(rng) * 16) : 18 + Math.round(roll01(rng) * 20);
    applyAffectionDelta(character, target.id, spike, ctx);
    const who = `${roleLabel(target.role)}${target.name}`;
    return {
      applied: true,
      note: spike < 0
        ? `深淵磁場一顫：${who}忽然變得難相處，像被另一條命運線拽歪。`
        : `深淵磁場一顫：${who}莫名貼近，交錯得像劇本寫錯了頁。`,
    };
  }

  const eth = defaultBloodlineRegistry.getEthnicity(
    character.bloodline?.primaryEthnicityId || "japanese",
  );
  const settlement = findSettlement(character.cityId) || findSettlement("shimokitazawa");
  const gender = roll01(rng) < 0.5 ? "female" : "male";
  const by = year - Math.round(12 + roll01(rng) * 28);
  const name = formatCulturalName(eth, gender, rng, settlement, by);
  const asFriend = roll01(rng) < 0.55;
  const affection = asFriend
    ? 70 + Math.round(roll01(rng) * 22)
    : 10 + Math.round(roll01(rng) * 22);
  network.npcs.push({
    id: `npc_abyss_${turn}_${Math.floor(roll01(rng) * 1e6)}`,
    role: asFriend ? "friend" : "rival",
    name,
    gender,
    birthYear: by,
    deathYear: null,
    alive: true,
    affection,
    attitude: affection >= 60 ? "warm" : "hostile",
    stance: affection >= 60 ? "warm" : "hostile",
    notes: "深淵磁場牽來的巷口奇人",
    source: "abyss_magnet",
  });
  const note = ABYSS_NOTES[Math.floor(roll01(rng) * ABYSS_NOTES.length)];
  return {
    applied: true,
    note: `${note}——${asFriend ? "巷友" : "對頭"}${name}就此寫進你的路。`,
  };
}

/** Principled: strip clearly unjust options from the weekly triad. */
export function filterUnjustPersonaOptions(options = [], character = null) {
  if (!character || !hasPersona(character, "persona_principled")) return options || [];
  const kept = (options || []).filter((option) => {
    if (option?.personaAllowUnjust) return true;
    const text = `${option?.text || ""} ${option?.trueText || ""}`;
    return !UNJUST_OPTION_RE.test(text);
  });
  return kept.length ? kept : options;
}

/**
 * High roller + quit ahead: juicier stakes, but win path trims greed.
 */
export function enhanceWealthStakeForPersona(option, character) {
  if (!option?.wealthStake || !character) return option;
  if (!hasPersona(character, "persona_high_roller")) return option;
  const next = { ...option };
  next.stakeCash = Math.round(Number(option.stakeCash || 40) * 1.45);
  next.stakeChance = Math.min(0.52, Number(option.stakeChance || 0.3) + 0.12);
  next.personaHighRoller = true;
  if (hasPersona(character, "persona_quit_ahead")) {
    next.personaQuitAhead = true;
    next.stakeChance = Math.min(0.48, next.stakeChance);
  }
  return next;
}

export function applyQuitAheadStopLoss(character, ctx = {}) {
  if (!character || !hasPersona(character, "persona_quit_ahead")) return { applied: false };
  const wealth = ensureWealth(character);
  const state = ensurePersonaState(character);
  const turn = Number(ctx.turnCount ?? ctx.time?.turnCount ?? 0);
  if (turn - Number(state.lastStopLossTurn || -99) < 6) return { applied: false };
  const nearRuin = wealth.band === "bankrupt" || wealth.debt >= 70 || (wealth.cash <= 2 && wealth.assets <= 4 && wealth.debt >= 40);
  if (!nearRuin) return { applied: false };
  const cutDebt = Math.min(wealth.debt, Math.max(12, Math.round(wealth.debt * 0.35)));
  applyWealthDelta(character, {
    debt: -cutDebt,
    cash: Math.max(6, Math.round(8 + cutDebt * 0.15)),
    assets: Math.max(wealth.assets, 4),
  }, ctx.time || ctx);
  state.lastStopLossTurn = turn;
  return {
    applied: true,
    note: "見好就收：帳還能砍一截，人先撤出來。",
  };
}

export function canMintBrotherhoodStand(ctx = {}) {
  const character = ctx.character;
  if (!character) return false;
  if (!hasPersona(character, "persona_loyal_friend") || !hasPersona(character, "persona_brotherhood")) return false;
  const age = Number(ctx.ageYears || 0);
  if (age < 10) return false;
  const living = listNpcs(character, { aliveOnly: true, year: ctx.year || ctx.time?.year });
  return living.some((npc) => npc.role === "sibling" || npc.role === "friend" || npc.role === "spouse" || npc.role === "father" || npc.role === "mother");
}

export function mintBrotherhoodStandOption(rng, ctx = {}, index = 1) {
  const facts = ctx.narrativeFacts || scanNarrativeFacts(ctx);
  const year = facts.year || ctx.year || "";
  const living = listNpcs(ctx.character, { aliveOnly: true, year })
    .filter((npc) => npc.role !== "rival")
    .sort((a, b) => (b.affection || 0) - (a.affection || 0));
  const npc = living[0];
  const who = npc ? `${roleLabel(npc.role)}${npc.name}` : "還肯喊你一聲的人";
  const city = facts.city || "此地";
  const text = composeChoiceLine(rng, ctx, "family", index + 17, {
    direction: "help",
    driverTags: ["persona_brotherhood", "persona_loyal_friend"],
    tagFocus: "persona",
    tagLabel: "重義氣",
  }) || `挺身替${who}擋這一回，先把${city}${year}年這兩週的帳扛住`;
  return {
    id: `persona_brotherhood_${index}`,
    text,
    trueText: text,
    tagDriven: true,
    liveTagMint: true,
    driverTags: ["persona_brotherhood", "persona_loyal_friend"],
    direction: "help",
    situation: "family",
    hooks: ["family", "social", "survival"],
    brotherhoodStand: true,
    kinDelta: npc ? { npcId: npc.id, affection: 14 } : { affection: 8 },
    effects: { mood: 1, sanity: -1 },
    wealthDelta: { cash: -10, assets: -2 },
    risk: { chance: 0.28, effects: { health: -2, sanity: -1 } },
  };
}

export function canMintHighRollerStake(ctx = {}) {
  const character = ctx.character;
  if (!character) return false;
  if (!hasPersona(character, "persona_high_roller")) return false;
  return Number(ctx.ageYears || 0) >= 14;
}

export function mintHighRollerStakeOption(rng, ctx = {}, index = 2) {
  const facts = ctx.narrativeFacts || scanNarrativeFacts(ctx);
  const text = composeChoiceLine(rng, ctx, "money", index + 33, {
    direction: "seek",
    driverTags: ["persona_high_roller", "persona_quit_ahead"],
    tagFocus: "persona",
    tagLabel: "賭豪",
  }) || `把口袋裏能押的押進${facts.city || "此地"}這一局，贏了就收，不戀戰`;
  const option = {
    id: `persona_high_roller_${index}`,
    text,
    trueText: text,
    tagDriven: true,
    liveTagMint: true,
    driverTags: ["persona_high_roller", "persona_quit_ahead"].filter((id) => hasPersona(ctx.character, id)),
    direction: "seek",
    situation: "money",
    hooks: ["commerce", "scarcity"],
    wealthStake: true,
    stakeCash: 48,
    stakeChance: 0.34,
    effects: { sanity: -1, mood: 1 },
    risk: { chance: 0.4, effects: { sanity: -2 } },
  };
  return enhanceWealthStakeForPersona(option, ctx.character);
}

export function canMintBeastInstinct(ctx = {}) {
  const character = ctx.character;
  if (!character) return false;
  if (!hasPersona(character, "persona_beast_senpai")
    || !hasAnyPersona(character, ["persona_shimokita_labor", "persona_114514"])) {
    return false;
  }
  return Number(ctx.ageYears || 0) >= 8;
}

export function canMintRicardoRhythm(ctx = {}) {
  const character = ctx.character;
  if (!character) return false;
  if (!hasAnyPersona(character, RICARDO_DRIVERS)) {
    return false;
  }
  return Number(ctx.ageYears || 0) >= 8;
}

export function mintRicardoRhythmOption(rng, ctx = {}, index = 1) {
  const facts = ctx.narrativeFacts || scanNarrativeFacts(ctx);
  const city = facts.city || "里約熱內盧";
  const text = composeChoiceLine(rng, ctx, "family", index + 83, {
    direction: "seek",
    driverTags: RICARDO_DRIVERS.slice(),
    tagFocus: "persona",
    tagLabel: "迷因舞王",
  }) || `把巴西森巴與自由的舞步踩進${city}這兩週，危機來了也不先收住無敵笑容`;
  return {
    id: `persona_ricardo_${index}`,
    text,
    trueText: text,
    tagDriven: true,
    liveTagMint: true,
    driverTags: RICARDO_DRIVERS.filter((id) => hasPersona(ctx.character, id)),
    direction: "seek",
    situation: "family",
    hooks: ["social", "survival"],
    ricardoRhythm: true,
    effects: { mood: 2, sanity: 1, charm: 1 },
    risk: { chance: 0.18, effects: { sanity: -1 } },
  };
}

export function mintBeastInstinctOption(rng, ctx = {}, index = 0) {
  const facts = ctx.narrativeFacts || scanNarrativeFacts(ctx);
  const city = facts.city || "下北澤";
  const text = composeChoiceLine(rng, ctx, "family", index + 41, {
    direction: "resist",
    driverTags: ["persona_beast_senpai", "persona_shimokita_labor", "persona_114514"],
    tagFocus: "persona",
    tagLabel: "野獸先輩",
  }) || `憑野獸先輩的直覺在${city}街頭的縫裡找一條活路，危機來也不先低頭`;
  return {
    id: `persona_beast_${index}`,
    text,
    trueText: text,
    tagDriven: true,
    liveTagMint: true,
    driverTags: ["persona_beast_senpai", "persona_shimokita_labor", "persona_114514"]
      .filter((id) => hasPersona(ctx.character, id)),
    direction: "resist",
    situation: "family",
    hooks: ["survival", "social"],
    beastInstinct: true,
    effects: { health: 1, sanity: -1, mood: 1 },
    risk: { chance: 0.36, effects: { health: -3, sanity: -2 } },
  };
}

export function canMintMuscleWrestle(ctx = {}) {
  const character = ctx.character;
  if (!character) return false;
  if (!hasPersona(character, "persona_aniki_wrestle")) return false;
  return Number(ctx.ageYears || 0) >= 10;
}

export function mintMuscleWrestleOption(rng, ctx = {}, index = 0) {
  const facts = ctx.narrativeFacts || scanNarrativeFacts(ctx);
  const city = facts.city || "紐約";
  const text = composeChoiceLine(rng, ctx, "family", index + 53, {
    direction: "resist",
    driverTags: ["persona_aniki_wrestle", "persona_biochem", "persona_forest_fairy"],
    tagFocus: "persona",
    tagLabel: "兄貴摔角",
  }) || `用兄貴摔角練出的身子，把${city}這兩週的勞動、衝突或危機硬扛過去`;
  return {
    id: `persona_wrestle_${index}`,
    text,
    trueText: text,
    tagDriven: true,
    liveTagMint: true,
    driverTags: ["persona_aniki_wrestle", "persona_biochem", "persona_forest_fairy"]
      .filter((id) => hasPersona(ctx.character, id)),
    direction: "resist",
    situation: "family",
    hooks: ["survival", "labor", "conflict"],
    muscleWrestle: true,
    effects: { health: 2, mood: 1, sanity: 1 },
    risk: { chance: 0.16, effects: { health: -1 } },
  };
}

export function canMintAnikiUplift(ctx = {}) {
  const character = ctx.character;
  if (!character || !hasAnyPersona(character, ["persona_aniki_wrestle", "persona_loyal_bond"])) return false;
  if (Number(ctx.ageYears || 0) < 10) return false;
  const living = listNpcs(character, { aliveOnly: true, year: ctx.year || ctx.time?.year });
  return living.some((npc) => npc.role !== "rival");
}

export function mintAnikiUpliftOption(rng, ctx = {}, index = 1) {
  const facts = ctx.narrativeFacts || scanNarrativeFacts(ctx);
  const year = facts.year || ctx.year || "";
  const living = listNpcs(ctx.character, { aliveOnly: true, year })
    .filter((npc) => npc.role !== "rival")
    .sort((a, b) => (a.affection || 50) - (b.affection || 50));
  const low = living.find((npc) => (npc.affection || 50) <= 48) || living[0];
  const who = low ? `${roleLabel(low.role)}${low.name}` : "還肯跟你說話的同伴";
  const city = facts.city || "此地";
  const bonded = hasPersona(ctx.character, "persona_loyal_bond");
  const text = composeChoiceLine(rng, ctx, "family", index + 61, {
    direction: "help",
    driverTags: ["persona_aniki_wrestle", "persona_loyal_bond"],
    tagFocus: "persona",
    tagLabel: "重情重義",
  }) || `以兄貴摔角的勁頭把${who}從低谷拉起來，先把${city}${year}年這兩週的逆境扛過`;
  return {
    id: `persona_aniki_${index}`,
    text,
    trueText: text,
    tagDriven: true,
    liveTagMint: true,
    driverTags: ["persona_aniki_wrestle", "persona_loyal_bond"].filter((id) => hasPersona(ctx.character, id)),
    direction: "help",
    situation: "family",
    hooks: ["family", "social", "survival"],
    anikiUplift: true,
    kinDelta: low ? { npcId: low.id, affection: bonded ? 22 : 16 } : { affection: 12 },
    effects: { mood: 2, sanity: 1, charm: 1 },
    risk: { chance: 0.12, effects: { sanity: -1 } },
  };
}

export function canMintLeaderRally(ctx = {}) {
  const character = ctx.character;
  if (!character) return false;
  if (!hasAnyPersona(character, ["persona_deep_philosophy", "persona_forest_fairy"])) return false;
  return Number(ctx.ageYears || 0) >= 12;
}

export function mintLeaderRallyOption(rng, ctx = {}, index = 2) {
  const facts = ctx.narrativeFacts || scanNarrativeFacts(ctx);
  const city = facts.city || "此地";
  const text = composeChoiceLine(rng, ctx, "family", index + 71, {
    direction: "help",
    driverTags: ["persona_deep_philosophy", "persona_forest_fairy", "persona_loyal_bond"],
    tagFocus: "persona",
    tagLabel: "深邃哲學",
  }) || `以森之妖精的氣度站到人群前，把${city}這兩週能一起做完的事先帶起來`;
  return {
    id: `persona_leader_${index}`,
    text,
    trueText: text,
    tagDriven: true,
    liveTagMint: true,
    driverTags: ["persona_deep_philosophy", "persona_forest_fairy", "persona_loyal_bond"]
      .filter((id) => hasPersona(ctx.character, id)),
    direction: "help",
    situation: "family",
    hooks: ["social", "labor", "family"],
    leaderRally: true,
    effects: { charm: 2, mood: 2, sanity: 1 },
    risk: { chance: 0.14, effects: { sanity: -1 } },
  };
}

/**
 * Cheerful + born leader: halve sanity decay under era / social pressure.
 */
export function applyLeaderOptimismShield(character, sanityWeek = {}) {
  if (!character || !hasAnyPersona(character, ["persona_deep_philosophy", "persona_forest_fairy"])) {
    return sanityWeek || { moodDelta: 0, note: "" };
  }
  const delta = Number(sanityWeek.moodDelta || 0);
  if (delta >= 0) return sanityWeek;
  const reduced = Math.trunc(delta / 2);
  return {
    ...sanityWeek,
    moodDelta: reduced,
    note: reduced < 0
      ? "深邃哲學與森之妖精氣還擋得住一半時代壓：神智衰得比旁人慢。"
      : (sanityWeek.note
        ? "哲學視角把這一週的精神扣減頂了回去。"
        : ""),
  };
}

/**
 * Aniki weekly: if allies are in a trough, ambient encouragement may fire.
 */
export function resolveAnikiBondTick(character, rng, ctx = {}) {
  if (!character || !hasAnyPersona(character, ["persona_aniki_wrestle", "persona_loyal_bond"])) {
    return { applied: false, note: "" };
  }
  const state = ensurePersonaState(character);
  const turn = Number(ctx.turnCount ?? 0);
  if (turn - Number(state.lastAnikiTickTurn || -99) < 5) return { applied: false, note: "" };
  if (roll01(rng) > 0.38) return { applied: false, note: "" };
  const year = ctx.year || ctx.time?.year;
  const living = listNpcs(character, { aliveOnly: true, year })
    .filter((npc) => npc.role !== "rival");
  const trough = living.filter((npc) => (npc.affection || 50) <= 42);
  if (!trough.length && roll01(rng) > 0.25) return { applied: false, note: "" };
  state.lastAnikiTickTurn = turn;
  const target = trough[0] || living.sort((a, b) => (a.affection || 0) - (b.affection || 0))[0];
  if (!target) return { applied: false, note: "" };
  const bonded = hasPersona(character, "persona_loyal_bond");
  const bump = bonded ? 10 : 6;
  applyAffectionDelta(character, target.id, bump, ctx);
  if (character.stats) {
    character.stats.sanity = Math.min(100, Number(character.stats.sanity ?? 50) + 1);
  }
  const who = `${roleLabel(target.role)}${target.name}`;
  return {
    applied: true,
    note: `兄貴精神這兩週先到：你把${who}從低谷邊拉回半步，友誼帳又厚了一層。`,
  };
}

export function applyAnikiUpliftChoice(character, option, ctx = {}) {
  if (!option?.anikiUplift || !character) return { applied: false };
  const state = ensurePersonaState(character);
  state.anikiUplifts = (state.anikiUplifts || 0) + 1;
  if (option.kinDelta) {
    const npc = applyAffectionDelta(
      character,
      option.kinDelta.npcId || option.kinDelta.role,
      option.kinDelta.affection ?? 16,
      ctx,
    );
    if (npc) {
      state.favors.push({
        npcId: npc.id,
        strength: 3,
        createdTurn: Number(ctx.turnCount ?? ctx.time?.turnCount ?? 0),
        kind: "aniki",
      });
      if (state.favors.length > 8) state.favors.shift();
    }
  }
  if (character.stats) {
    character.stats.sanity = Math.min(100, Number(character.stats.sanity ?? 50) + 2);
  }
  return { applied: true, note: "伸出的那一隻手寫進對方的帳：低谷過了，好感與回報都厚了。" };
}

export function applyLeaderRallyChoice(character, option, ctx = {}) {
  if (!option?.leaderRally || !character) return { applied: false };
  const state = ensurePersonaState(character);
  state.leaderRallies = (state.leaderRallies || 0) + 1;
  const year = ctx.year || ctx.time?.year;
  const allies = listNpcs(character, { aliveOnly: true, year }).filter((npc) => npc.role !== "rival");
  for (const npc of allies.slice(0, 3)) {
    applyAffectionDelta(character, npc.id, 4, ctx);
  }
  if (character.ledger) {
    character.ledger.trust = Math.min(100, Number(character.ledger.trust ?? 50) + 4);
  }
  return { applied: true, note: "人群跟你站了一回：領袖氣寫進這兩週的職場與街坊帳。" };
}

/**
 * Replace one triad slot with persona specials when tags match.
 */
export function weavePersonaOptions(rng, options = [], ctx = {}) {
  let next = (options || []).slice(0, 3);
  if (canMintBrotherhoodStand(ctx) && next.length) {
    next[Math.min(1, next.length - 1)] = mintBrotherhoodStandOption(rng, ctx, 1);
  }
  if (canMintHighRollerStake(ctx) && next.length >= 3) {
    next[2] = mintHighRollerStakeOption(rng, ctx, 2);
  }
  if (canMintBeastInstinct(ctx) && next.length) {
    next[0] = mintBeastInstinctOption(rng, ctx, 0);
  }
  if (canMintMuscleWrestle(ctx) && next.length) {
    next[0] = mintMuscleWrestleOption(rng, ctx, 0);
  }
  if (canMintAnikiUplift(ctx) && next.length) {
    next[Math.min(1, next.length - 1)] = mintAnikiUpliftOption(rng, ctx, 1);
  }
  if (canMintLeaderRally(ctx) && next.length >= 3) {
    next[2] = mintLeaderRallyOption(rng, ctx, 2);
  }
  if (canMintRicardoRhythm(ctx) && next.length) {
    next[Math.min(1, next.length - 1)] = mintRicardoRhythmOption(rng, ctx, 1);
  }
  next = filterUnjustPersonaOptions(next, ctx.character);
  return next.slice(0, 3);
}

export function applyBrotherhoodStandChoice(character, option, ctx = {}) {
  if (!option?.brotherhoodStand || !character) return { applied: false };
  const state = ensurePersonaState(character);
  state.brotherhoodStands = (state.brotherhoodStands || 0) + 1;
  if (option.wealthDelta) applyWealthDelta(character, option.wealthDelta, ctx.time || ctx);
  if (option.kinDelta) {
    const npc = applyAffectionDelta(
      character,
      option.kinDelta.npcId || option.kinDelta.role,
      option.kinDelta.affection ?? 12,
      ctx,
    );
    if (npc) {
      state.favors.push({
        npcId: npc.id,
        strength: 2,
        createdTurn: Number(ctx.turnCount ?? ctx.time?.turnCount ?? 0),
      });
      if (state.favors.length > 6) state.favors.shift();
    }
  }
  return { applied: true, note: "義氣這一回寫進別人的帳本。" };
}

/**
 * Hidden payback: when crisis/health bites, a prior favor returns help.
 */
export function resolvePersonaPaybacks(character, rng, ctx = {}) {
  if (!character) return { triggered: false };
  if (
    !hasPersona(character, "persona_loyal_friend")
    && !hasPersona(character, "persona_brotherhood")
    && !hasAnyPersona(character, ["persona_aniki_wrestle", "persona_loyal_bond"])
  ) {
    return { triggered: false };
  }
  const state = ensurePersonaState(character);
  const turn = Number(ctx.turnCount ?? 0);
  if (turn - Number(state.lastPaybackTurn || -99) < 10) return { triggered: false };
  if (!state.favors.length) return { triggered: false };
  const health = Number(character.stats?.health ?? 50);
  const crisis = Number(ctx.pressure?.score ?? 0);
  const needHelp = health <= 34 || crisis >= 42 || character.wealth?.band === "bankrupt";
  if (!needHelp) return { triggered: false };
  const roll = typeof rng === "function" ? rng() : 0.5;
  if (roll > 0.55) return { triggered: false };
  const favor = state.favors.pop();
  state.lastPaybackTurn = turn;
  const anikiBoost = favor?.kind === "aniki" || hasAnyPersona(character, ["persona_aniki_wrestle", "persona_loyal_bond"]);
  applyWealthDelta(character, { cash: anikiBoost ? 18 : 12, debt: anikiBoost ? -12 : -8 }, ctx.time || ctx);
  if (character.stats) {
    character.stats.health = Math.min(100, health + (anikiBoost ? 8 : 6));
    character.stats.sanity = Math.min(100, Number(character.stats.sanity ?? 50) + (anikiBoost ? 6 : 4));
  }
  const npc = listNpcs(character, { aliveOnly: false }).find((row) => row.id === favor.npcId);
  const who = npc ? `${roleLabel(npc.role)}${npc.name}` : "舊時共過患難的人";
  return {
    triggered: true,
    note: anikiBoost
      ? `${who}在關頭上用力還了一手。從前兄貴式的援手，這回連本帶利回來了。`
      : `${who}在關頭上伸了一手。從前挺過的帳，這回還回來了。`,
  };
}

export function specialThemeClassesOf(character = {}) {
  const classes = [];
  if (character.specialThemeClass) classes.push(character.specialThemeClass);
  if (character.specialPresetId === "zhang_junbin") classes.push("preset-hardboiled", "preset-zhang-junbin");
  if (character.specialPresetId === "huang_pinjun") classes.push("preset-yunlin-archive");
  if (character.specialPresetId === "tadokoro_koji") classes.push("preset-shimokita", "preset-tadokoro-koji");
  if (character.specialPresetId === "billy_herrington") classes.push("preset-aniki-archive", "preset-billy-herrington");
  if (character.specialPresetId === "ricardo_milos") classes.push("preset-rio-banana", "preset-ricardo-milos");
  return [...new Set(classes)];
}
