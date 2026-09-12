/**
 * One campus incident = one factual beat + three player stances.
 * Feelings are not written into the fact paragraph.
 */

export function schoolIncident({
  id,
  kind,
  age,
  year,
  regions,
  countriesAny,
  tagsAny,
  tagsAll,
  tagsNone,
  classes,
  settlementKinds,
  weight = 1,
  audience = "child_safe",
  fact,
  procedure = "",
  options = [],
}) {
  if (!id || !kind || !fact || options.length < 3) {
    throw new Error(`schoolIncident ${id || "?"} needs id, kind, fact, and 3 options`);
  }
  const when = {};
  if (age) when.age = age;
  if (year) when.year = year;
  if (regions) when.regions = regions;
  if (countriesAny) when.countriesAny = countriesAny;
  if (tagsAny) when.tagsAny = tagsAny;
  if (tagsAll) when.tagsAll = tagsAll;
  if (tagsNone) when.tagsNone = tagsNone;
  if (classes) when.classes = classes;
  if (settlementKinds) when.settlementKinds = settlementKinds;

  return {
    id,
    kind,
    audience,
    weight,
    when,
    fact,
    procedure,
    options: options.map((opt, index) => {
      const perpetrator = Boolean(opt.perpetrator);
      return {
        id: opt.id || `${id}_${opt.stance || index}`,
        text: opt.text,
        effects: opt.effects || { mood: 0 },
        followUps: opt.followUps || [],
        addTags: opt.addTags || [],
        hooks: opt.hooks || ["school"],
        risk: opt.risk || null,
        consequence: opt.consequence || null,
        attempt: opt.attempt || null,
        ending: opt.ending || null,
        path: opt.path || (perpetrator ? "crime" : null),
        domain: opt.domain || null,
        trauma: opt.trauma ? { ...opt.trauma, tags: (opt.trauma.tags || []).slice() } : null,
        traumaVictim: Boolean(opt.trauma) && !perpetrator,
        traumaNonsexual: true,
        schoolIncident: true,
        schoolIncidentId: id,
        schoolKind: kind,
        schoolPeerHarm: perpetrator,
        schoolNonsexual: true,
        affectChoice: true,
        stance: opt.stance || "unspecified",
        perpetrator,
        when: { ...when },
        weight,
      };
    }),
  };
}
