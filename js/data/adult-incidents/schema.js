/**
 * One adult-society incident = one factual beat + three player stances.
 * Feelings are not written into the fact paragraph. Heart stays with the triad.
 */

export function adultIncident({
  id,
  kind,
  sector = null,
  age = [18, 90],
  year,
  regions,
  countriesAny,
  tagsAny,
  tagsAll,
  tagsNone,
  classes,
  settlementKinds,
  occupationAny,
  pathsAny,
  weight = 1,
  audience = "adult",
  fact,
  procedure = "",
  options = [],
}) {
  if (!id || !kind || !fact || options.length < 3) {
    throw new Error(`adultIncident ${id || "?"} needs id, kind, fact, and 3 options`);
  }
  const when = { age: age.slice() };
  if (year) when.year = year;
  if (regions) when.regions = regions;
  if (countriesAny) when.countriesAny = countriesAny;
  if (tagsAny) when.tagsAny = tagsAny;
  if (tagsAll) when.tagsAll = tagsAll;
  if (tagsNone) when.tagsNone = tagsNone;
  if (classes) when.classes = classes;
  if (settlementKinds) when.settlementKinds = settlementKinds;
  if (occupationAny) when.occupationAny = occupationAny;
  if (pathsAny) when.pathsAny = pathsAny;
  if (sector) when.sector = sector;

  return {
    id,
    kind,
    sector,
    audience,
    weight,
    when,
    fact,
    procedure,
    options: options.map((opt, index) => {
      const dark = Boolean(opt.dark || opt.perpetrator);
      return {
        id: opt.id || `${id}_${opt.stance || index}`,
        text: opt.text,
        effects: opt.effects || { mood: 0 },
        followUps: opt.followUps || [],
        addTags: opt.addTags || [],
        hooks: opt.hooks || ["work"],
        risk: opt.risk || null,
        consequence: opt.consequence || null,
        attempt: opt.attempt || null,
        ending: opt.ending || null,
        path: opt.path || (dark ? "crime" : null),
        domain: opt.domain || sector || null,
        occupationId: opt.occupationId || null,
        adultIncident: true,
        adultIncidentId: id,
        adultKind: kind,
        adultSector: sector,
        adultNonsexual: true,
        noSexualMinorActs: true,
        affectChoice: true,
        stance: opt.stance || "unspecified",
        dark,
        perpetrator: Boolean(opt.perpetrator),
        crisisDelta: opt.crisisDelta || (dark ? 12 : 0),
        burnoutDelta: opt.burnoutDelta || 0,
        when: { ...when },
        weight,
      };
    }),
  };
}
