/**
 * NPC social network schema: roles, affection bands, crisis kinds, tags.
 * Numbers and ids only. Player-facing copy is minted live.
 */

export const KIN_CRISIS_COOLDOWN = 12;

export const NPC_ROLES = Object.freeze([
  "father",
  "mother",
  "sibling",
  "spouse",
  "rival",
  "guardian",
]);

export const ROLE_LABEL = Object.freeze({
  father: "父親",
  mother: "母親",
  sibling: "兄姊弟妹",
  spouse: "伴侶",
  rival: "對頭",
  friend: "巷友",
  guardian: "監護人",
});

/** Affection 0–100 bands → attitude toward the protagonist. */
export const AFFECTION_BANDS = Object.freeze([
  { id: "hostile", max: 18, attitude: "hostile", label: "敵視" },
  { id: "cold", max: 38, attitude: "cold", label: "冷淡" },
  { id: "ordinary", max: 58, attitude: "ordinary", label: "平常" },
  { id: "warm", max: 78, attitude: "warm", label: "親近" },
  { id: "devoted", max: 100, attitude: "devoted", label: "牽絆" },
]);

/** Map engine attitude → npc-voice attitude keys where useful. */
export const VOICE_ATTITUDE = Object.freeze({
  hostile: "disdain",
  cold: "ordinary",
  ordinary: "ordinary",
  warm: "trust",
  devoted: "trust",
});

export const KIN_CRISIS_KINDS = Object.freeze([
  "parent_death",
  "orphan",
  "abandonment",
  "betrayal",
  "rival_strike",
  "spouse_loss",
]);

export const KIN_TAG_RULES = Object.freeze([
  { id: "kin_orphan", label: "孤兒", crisis: "orphan", strain: ["family", "health", "hunger"] },
  { id: "kin_grief", label: "至親新喪", crisis: "parent_death", strain: ["family", "health"] },
  { id: "kin_abandoned", label: "被人拋下", crisis: "abandonment", strain: ["family", "social"] },
  { id: "kin_betrayed", label: "至親反目", crisis: "betrayal", strain: ["family", "social"] },
  { id: "kin_rival_hot", label: "對頭盯上", crisis: "rival_strike", strain: ["violence", "social"] },
  { id: "kin_widow", label: "喪偶", crisis: "spouse_loss", strain: ["family", "health"] },
  { id: "kin_bonded", label: "有人牽著", minAffection: 72, strain: [] },
  { id: "kin_estranged", label: "至親決裂", maxAffection: 16, strain: ["family"] },
]);

/** Base fortnight mortality chance for living NPCs (before era / war / age). */
export const NPC_BASE_DEATH = Object.freeze({
  father: 0.004,
  mother: 0.0035,
  sibling: 0.0025,
  spouse: 0.003,
  rival: 0.002,
  guardian: 0.004,
});

export const HOUSEHOLD_AFFECTION_SEED = Object.freeze({
  household_extractive: -14,
  household_volatile: -10,
  household_alcohol: -12,
  household_neglect: -16,
  household_step_tension: -8,
  household_silent: -6,
  household_absent: -10,
  household_hungry: -4,
  household_warm: 10,
  household_strict_care: 6,
});
