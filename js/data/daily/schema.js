/**
 * Daily-life slice schema.
 * Drop new files into js/data/daily/ and register them in catalog.js.
 * Each slice is one microscopic beat: a procedure, a body fact, a social rule.
 *
 * audience:
 *   child_safe — 5–12 family / play / illness / primary school
 *   teen       — 13–17 campus and adolescent only
 *   teen_up    — 18+ (legal labor that used to span apprenticeship; now adult work)
 *   gray       — 18+ street / cover / informal
 *   adult      — 18+ politics, prison, felony-adjacent daily camouflage
 *
 * Never put sexual harm involving anyone under 18 in any slice.
 * Adult prison/underworld may name a convict caste for sexual crimes against
 * minors as ecology (ostracism, extra-legal violence, contamination tags)
 * without describing acts, victims, or offender sexual interiority.
 * Player cannot choose to commit that crime.
 * After 18, occupation / politics / commerce / crime slices follow real-world
 * pricing: no sermons, no protagonist halo, no over-censorship of adult darkness.
 * Player-as-victim non-sexual trauma (beating, neglect, labor extraction) is allowed
 * and must be written as injury, never as education or romance.
 * Peer school bullying / gangs may appear as stance options (victim or perpetrator).
 */

export const DAILY_PHASES = Object.freeze([
  "dawn",
  "transit",
  "site",
  "meal",
  "body",
  "paper",
  "social",
  "night",
  "wait",
]);

export const DAILY_AUDIENCE = Object.freeze({
  child_safe: { minAge: 5, maxAge: 12 },
  teen: { minAge: 13, maxAge: 17 },
  teen_up: { minAge: 18, maxAge: 120 },
  gray: { minAge: 18, maxAge: 120 },
  adult: { minAge: 18, maxAge: 120 },
});

export function dailySlice({
  id,
  state,
  phase,
  age,
  year,
  tagsAny,
  tagsAll,
  tagsNone,
  classes,
  regions,
  pathsAny,
  occupationAny,
  audience = "child_safe",
  sensory = "",
  procedure = "",
  social = "",
  logic = "",
  effects = null,
  optionText = null,
  risk = null,
  addTags = null,
  hooks = ["daily"],
  domain = null,
  weight = 1.55,
  trauma = null,
  caste = null,
  perpCaste = false,
  consequence = null,
}) {
  if (!id || !state || !phase) throw new Error("dailySlice requires id, state, phase");
  const when = {};
  if (age) when.age = age;
  if (year) when.year = year;
  if (tagsAny) when.tagsAny = tagsAny;
  if (tagsAll) when.tagsAll = tagsAll;
  if (tagsNone) when.tagsNone = tagsNone;
  if (classes) when.classes = classes;
  if (regions) when.regions = regions;
  if (pathsAny) when.pathsAny = pathsAny;
  if (occupationAny) when.occupationAny = occupationAny;

  const text = [sensory, procedure, social].filter(Boolean).join("");
  const followUps = ["你把這一段做完了。日子繼續。"];
  const action = optionText
    ? {
      id: `dailyopt_${id}`,
      text: optionText,
      effects: effects || { mood: 0 },
      followUps,
      when: { ...when },
      daily: true,
      lifeState: state,
      phase,
      hooks,
      risk,
      addTags,
      domain,
      weight,
      trauma: trauma ? { ...trauma, tags: (trauma.tags || []).slice() } : null,
      traumaVictim: Boolean(trauma),
      traumaNonsexual: true,
      caste: caste ? { ...caste, tags: (caste.tags || []).slice() } : null,
      perpCasteEcology: Boolean(perpCaste || caste),
      noSexualMinorActs: true,
      consequence: consequence ? { ...consequence } : null,
    }
    : null;

  return {
    id,
    state,
    phase,
    audience,
    when,
    sensory,
    procedure,
    social,
    logic,
    text,
    effects: effects || {},
    action,
    trauma: trauma ? { ...trauma, tags: (trauma.tags || []).slice() } : null,
    caste: caste ? { ...caste, tags: (caste.tags || []).slice() } : null,
    perpCasteEcology: Boolean(perpCaste || caste),
  };
}

export function renderSlice(slice) {
  if (!slice) return "";
  return [slice.sensory, slice.procedure, slice.social].filter(Boolean).join("");
}

/** Weekly log: one beat of conflict/procedure, not the full recap. */
export function renderSliceLead(slice) {
  if (!slice) return "";
  return slice.social || slice.procedure || slice.sensory || "";
}
