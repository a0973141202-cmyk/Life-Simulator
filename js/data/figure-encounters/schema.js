/**
 * One figure encounter = one factual beat with a living, visible historical body,
 * plus three stances. Intervention is allowed and expensive.
 */

export function figureEncounter({
  id,
  kind = "glimpse",
  lock = "crisis",
  roles = null,
  figureIds = null,
  venues = null,
  age = [12, 90],
  proximityAny = null,
  weight = 1,
  audience = "span",
  fact,
  procedure = "",
  options = [],
}) {
  if (!id || !fact || options.length < 3) {
    throw new Error(`figureEncounter ${id || "?"} needs id, fact, and 3 options`);
  }
  const when = { age: age.slice() };
  if (roles) when.roles = roles.slice();
  if (figureIds) when.figureIds = figureIds.slice();
  if (venues) when.venues = venues.slice();
  if (proximityAny) when.proximityAny = proximityAny.slice();

  return {
    id,
    kind,
    lock,
    audience,
    weight,
    when,
    fact,
    procedure,
    options: options.map((opt, index) => {
      const dark = Boolean(opt.dark || opt.perpetrator || opt.butterfly);
      const optWhen = { ...when, ...(opt.when || {}) };
      if (opt.when?.age) optWhen.age = opt.when.age.slice();
      return {
        id: opt.id || `${id}_${opt.stance || index}`,
        text: opt.text,
        effects: opt.effects || { mood: 0 },
        followUps: opt.followUps || [],
        addTags: opt.addTags || [],
        hooks: opt.hooks || ["historical"],
        risk: opt.risk || null,
        consequence: opt.consequence || null,
        attempt: opt.attempt || null,
        ending: opt.ending || null,
        butterfly: opt.butterfly ? { ...opt.butterfly } : null,
        path: opt.path || (opt.butterfly?.kind === "early_death" ? "militant" : dark ? "politics" : null),
        domain: opt.domain || (opt.butterfly?.kind === "early_death" ? "historical" : "world"),
        relation: opt.relation || null,
        figureEncounter: true,
        figureEncounterId: id,
        figureKind: kind,
        figureNonsexual: true,
        worldNonsexual: true,
        noSexualMinorActs: true,
        affectChoice: true,
        stance: opt.stance || "unspecified",
        dark,
        perpetrator: Boolean(opt.perpetrator),
        when: optWhen,
        weight,
      };
    }),
  };
}
