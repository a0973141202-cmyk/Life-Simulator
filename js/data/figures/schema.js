/**
 * One historical figure = dated visibility + geography + a track of public mission.
 * Canonical deathYear is the default exit. historyState may overwrite it.
 */

export function figure({
  id,
  name,
  roles,
  venues = ["street", "media"],
  birthYear,
  deathYear,
  visibleFrom,
  visibleTo,
  powerFrom = null,
  powerTo = null,
  regions = null,
  countriesAny = null,
  settlementIds = null,
  proximity = "country",
  track = [],
  shocks = [],
  weight = 1,
}) {
  if (!id || !name || !roles?.length || birthYear == null || deathYear == null) {
    throw new Error(`figure ${id || "?"} needs id, name, roles, birthYear, deathYear`);
  }
  const rise = visibleFrom ?? Math.max(1920, birthYear + 18);
  const exit = visibleTo ?? deathYear;
  return Object.freeze({
    id,
    name,
    roles: roles.slice(),
    venues: venues.slice(),
    birthYear,
    deathYear,
    visibleFrom: rise,
    visibleTo: exit,
    powerFrom,
    powerTo,
    regions: regions ? regions.slice() : null,
    countriesAny: countriesAny ? countriesAny.slice() : null,
    settlementIds: settlementIds ? settlementIds.slice() : null,
    proximity,
    track: Object.freeze(track.map((row) => Object.freeze({
      years: row.years.slice(),
      status: row.status,
      venue: row.venue || venues[0],
      mission: row.mission,
      weight: row.weight ?? 1,
    }))),
    shocks: shocks.slice(),
    weight,
  });
}
