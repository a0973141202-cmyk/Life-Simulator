/**
 * Temporary mood tags. Mood itself is 0–100; only streaks create/remove tags.
 * High arousal can be charisma in a festival and recklessness in a purge.
 */

export const MOOD_TAG_RULES = [
  {
    id: "depressed",
    tag: "mood_depressed",
    label: "長期低落",
    enterWhen: "low",
    enterStreak: 4,
    exitStreak: 3,
    threshold: 22,
    advantageIn: ["empathy", "study", "night"],
    strainIn: ["social", "health", "labor"],
    reason: "心情連續數週停在極低區間，系統賦予暫時性低落標籤。",
  },
  {
    id: "euphoric",
    tag: "mood_euphoric",
    label: "持續亢奮",
    enterWhen: "high",
    enterStreak: 4,
    exitStreak: 3,
    threshold: 82,
    advantageIn: ["social", "art", "leadership"],
    strainIn: ["study", "health", "risk"],
    reason: "心情連續數週停在極高區間，系統賦予暫時性狂熱標籤。",
  },
];

export const MOOD_MID_MIN = 35;
export const MOOD_MID_MAX = 75;

export function emptyMoodState() {
  return {
    lowStreak: 0,
    highStreak: 0,
    midStreak: 0,
    active: [],
  };
}
