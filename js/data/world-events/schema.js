/**
 * One world event = one factual beat in a year × place × geo-band,
 * plus three player stances. Feelings are not written into the fact.
 *
 * To add events later: create a pack file, export an array, append in catalog.js.
 * Leave `when` strict. Omit a filter only when the phenomenon is truly universal
 * across 1920–2025 and all mapped settlements.
 */

import { WORLD_KIND_LOCK } from "../world-event-rules.js";

export function worldEvent({
  id,
  kind,
  lock = null,
  age = [5, 90],
  year = [1920, 2025],
  regions,
  countriesAny,
  settlementIds,
  settlementKinds,
  geoBands,
  geoBandsNone,
  climates,
  envTagsAny,
  historyIds,
  tagsAny,
  tagsAll,
  tagsNone,
  tagPrefixesAny,
  classes,
  weight = 1,
  audience = "span",
  speaker = null,
  threads = null,
  fact,
  procedure = "",
  options = [],
}) {
  if (!id || !kind || !fact || options.length < 3) {
    throw new Error(`worldEvent ${id || "?"} needs id, kind, fact, and 3 options`);
  }
  const when = {
    age: age.slice(),
    year: year.slice(),
  };
  if (regions) when.regions = regions.slice();
  if (countriesAny) when.countriesAny = countriesAny.slice();
  if (settlementIds) when.settlementIds = settlementIds.slice();
  if (settlementKinds) when.settlementKinds = settlementKinds.slice();
  if (geoBands) when.geoBands = geoBands.slice();
  if (geoBandsNone) when.geoBandsNone = geoBandsNone.slice();
  if (climates) when.climates = climates.slice();
  if (envTagsAny) when.envTagsAny = envTagsAny.slice();
  if (historyIds) when.historyIds = historyIds.slice();
  if (tagsAny) when.tagsAny = tagsAny.slice();
  if (tagsAll) when.tagsAll = tagsAll.slice();
  if (tagsNone) when.tagsNone = tagsNone.slice();
  if (tagPrefixesAny) when.tagPrefixesAny = tagPrefixesAny.slice();
  if (classes) when.classes = classes.slice();

  const resolvedLock = lock || WORLD_KIND_LOCK[kind] || "scene";

  return {
    id,
    kind,
    lock: resolvedLock,
    audience,
    weight,
    when,
    fact,
    procedure,
    speaker: speaker || null,
    threads: threads ? threads.slice() : [],
    options: options.map((opt, index) => {
      const dark = Boolean(opt.dark || opt.perpetrator);
      return {
        id: opt.id || `${id}_${opt.stance || index}`,
        text: opt.text,
        effects: opt.effects || { mood: 0 },
        followUps: opt.followUps || [],
        addTags: opt.addTags || [],
        hooks: opt.hooks || ["world"],
        risk: opt.risk || null,
        consequence: opt.consequence || null,
        attempt: opt.attempt || null,
        ending: opt.ending || null,
        path: opt.path || (dark ? "crime" : null),
        domain: opt.domain || (kind === "historical" ? "world" : kind),
        trauma: opt.trauma ? { ...opt.trauma, tags: (opt.trauma.tags || []).slice() } : null,
        traumaVictim: Boolean(opt.trauma) && !dark,
        traumaNonsexual: true,
        worldEvent: true,
        worldEventId: id,
        worldKind: kind,
        speaker: opt.speaker || speaker || null,
        threads: (opt.threads || threads || []).slice(),
        worldLock: resolvedLock,
        worldNonsexual: true,
        noSexualMinorActs: true,
        affectChoice: true,
        stance: opt.stance || "unspecified",
        dark,
        perpetrator: Boolean(opt.perpetrator),
        asymmetric: opt.asymmetric || null,
        tagDriven: Boolean(opt.tagDriven),
        tagLink: Boolean(opt.tagLink),
        when: { ...when },
        weight,
      };
    }),
  };
}
