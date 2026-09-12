import { MOOD_MID_MAX, MOOD_MID_MIN, MOOD_TAG_RULES, emptyMoodState } from "./data/mood-tags-database.js";
import { addCharacterTag, removeCharacterTag } from "./tag-system.js";

export function ensureMoodState(character) {
  if (!character.moodState) character.moodState = emptyMoodState();
  return character.moodState;
}

export function syncMoodTags(character) {
  const mood = character?.stats?.sanity ?? character?.stats?.mood ?? 50;
  const state = ensureMoodState(character);
  const changed = [];

  if (mood <= 22) {
    state.lowStreak += 1;
    state.highStreak = 0;
    state.midStreak = 0;
  } else if (mood >= 82) {
    state.highStreak += 1;
    state.lowStreak = 0;
    state.midStreak = 0;
  } else if (mood >= MOOD_MID_MIN && mood <= MOOD_MID_MAX) {
    state.midStreak += 1;
    state.lowStreak = 0;
    state.highStreak = 0;
  } else {
    state.lowStreak = 0;
    state.highStreak = 0;
    state.midStreak += 1;
  }

  for (const rule of MOOD_TAG_RULES) {
    const streak = rule.enterWhen === "low" ? state.lowStreak : state.highStreak;
    const active = state.active.includes(rule.tag);
    if (!active && streak >= rule.enterStreak) {
      addCharacterTag(character, {
        id: rule.tag,
        category: "mood",
        label: rule.label,
        temporary: true,
        valence: "contextual",
        advantageIn: rule.advantageIn,
        strainIn: rule.strainIn,
        source: "mood",
        reason: rule.reason,
      });
      state.active.push(rule.tag);
      changed.push({ action: "add", tag: rule.tag, label: rule.label });
    } else if (active && state.midStreak >= rule.exitStreak) {
      removeCharacterTag(character, rule.tag);
      state.active = state.active.filter((id) => id !== rule.tag);
      changed.push({ action: "remove", tag: rule.tag, label: rule.label });
    }
  }

  return { mood, state, changed };
}

export { emptyMoodState, MOOD_TAG_RULES };
