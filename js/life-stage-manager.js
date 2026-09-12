/**
 * LifeStageManager — progressive arcs and turning-point gates.
 * Does not replace getLifeStage age labels. Does not write UI.
 */
import { getLifeStage } from "./constants.js";
import { EARLY_CHILD_MAX, STUDENT_MIN, STUDENT_MAX, ADULT_MIN } from "./data/age-gate-rules.js";
import { LIFE_ARCS, TURNING_POINTS } from "./data/life-stage-catalog.js";
import { classifyLane } from "./age-gate.js";

export function emptyLifeProgress() {
  return {
    arcId: "early_survival",
    completed: [],
    unlocked: ["early_survival"],
    dueId: null,
    log: [],
  };
}

export function ensureLifeProgress(character) {
  if (!character) return emptyLifeProgress();
  if (!character.lifeProgress || typeof character.lifeProgress !== "object") {
    character.lifeProgress = emptyLifeProgress();
  }
  const progress = character.lifeProgress;
  if (!Array.isArray(progress.completed)) progress.completed = [];
  if (!Array.isArray(progress.unlocked)) progress.unlocked = ["early_survival"];
  if (!Array.isArray(progress.log)) progress.log = [];
  return progress;
}

export function resolveLifeStage(ageYears) {
  const stage = getLifeStage(ageYears);
  const age = Math.max(0, Number(ageYears) || 0);
  const arc = currentArcForAge(age);
  return {
    ...stage,
    arcId: arc?.id || stage.id,
    arcLabel: arc?.label || stage.label,
    band: age <= EARLY_CHILD_MAX ? "early_child" : age <= STUDENT_MAX ? "student" : "adult",
  };
}

function currentArcForAge(age) {
  const rows = LIFE_ARCS.filter((arc) => age >= arc.minAge && age <= arc.maxAge && !arc.optional);
  return rows.sort((a, b) => b.order - a.order)[0] || LIFE_ARCS[0];
}

function hasThread(ctx, list) {
  const live = ctx.upheaval?.threads || ctx.character?.upheavalState?.threads || [];
  return (list || []).some((thread) => live.includes(thread));
}

function prereqsMet(arc, completed) {
  return (arc.requires || []).every((id) => completed.includes(id));
}

function autoCompleteIfPassed(arc, age, completed) {
  if (completed.includes(arc.id)) return false;
  if (age > arc.maxAge && prereqsMet(arc, completed)) return true;
  if (arc.id === "early_survival" && age >= STUDENT_MIN) return true;
  if (arc.id === "exam_fork" && age >= ADULT_MIN) return true;
  if (arc.id === "society_entry" && age >= ADULT_MIN) return true;
  return false;
}

export function tickLifeProgress(character, ctx = {}) {
  const progress = ensureLifeProgress(character);
  const age = Number(ctx.ageYears ?? ctx.time?.ageYears ?? character?.ageYears ?? 0);
  const completed = new Set(progress.completed);
  const unlocked = new Set(progress.unlocked.length ? progress.unlocked : ["early_survival"]);

  if (character?.socialPhase === "adult") {
    completed.add("society_entry");
    unlocked.add("society_entry");
    if (!completed.has("exam_fork")) completed.add("exam_fork");
  }
  if (character?.education && character.education !== "none") {
    completed.add("first_school");
    unlocked.add("first_school");
    completed.add("early_survival");
  }

  for (const arc of LIFE_ARCS) {
    if (arc.optional && !hasThread(ctx, arc.threadsAny) && !completed.has(arc.id)) continue;
    if (age < arc.minAge) continue;
    if (!prereqsMet(arc, [...completed]) && !autoCompleteIfPassed(arc, age, [...completed])) continue;
    unlocked.add(arc.id);
    if (autoCompleteIfPassed(arc, age, [...completed])) completed.add(arc.id);
  }

  const dueGates = LIFE_ARCS.filter((arc) => (
    arc.gate
    && unlocked.has(arc.id)
    && !completed.has(arc.id)
    && age >= arc.minAge
    && age <= arc.maxAge
    && (!arc.optional || hasThread(ctx, arc.threadsAny))
    && TURNING_POINTS[arc.id]
  ));
  const due = dueGates.sort((a, b) => a.order - b.order)[0] || null;
  const liveArc = currentArcForAge(age);

  progress.completed = [...completed];
  progress.unlocked = [...unlocked];
  progress.dueId = due?.id || null;
  progress.arcId = liveArc?.id || progress.arcId;
  if (due && !progress.log.some((row) => row.id === due.id && row.status === "due")) {
    progress.log.push({ id: due.id, status: "due", year: ctx.year || ctx.time?.year || null, age });
    if (progress.log.length > 24) progress.log.splice(0, progress.log.length - 24);
  }
  return progress;
}

export function dueTurningPoint(character, ctx = {}) {
  const progress = tickLifeProgress(character, ctx);
  if (!progress.dueId) return null;
  return TURNING_POINTS[progress.dueId] || null;
}

export function completeTurningPoint(character, pointId, ctx = {}) {
  const progress = ensureLifeProgress(character);
  if (!pointId) return progress;
  const point = TURNING_POINTS[pointId] || null;
  if (!progress.completed.includes(pointId)) progress.completed.push(pointId);
  if (!progress.unlocked.includes(pointId)) progress.unlocked.push(pointId);
  if (progress.dueId === pointId) progress.dueId = null;
  if (point?.education && (!character.education || character.education === "none")) {
    character.education = point.education;
  }
  progress.log.push({
    id: pointId,
    status: "done",
    year: ctx.year || ctx.time?.year || null,
    age: ctx.ageYears ?? ctx.time?.ageYears ?? null,
  });
  return progress;
}

export function allowedArcIds(progress, ctx = {}) {
  const unlocked = new Set(progress?.unlocked || ["early_survival"]);
  const completed = new Set(progress?.completed || []);
  const age = Number(ctx.ageYears ?? 0);
  const ids = [];
  for (const arc of LIFE_ARCS) {
    if (unlocked.has(arc.id) || completed.has(arc.id)) ids.push(arc.id);
    else if (age >= arc.minAge && !arc.gate) ids.push(arc.id);
  }
  if (age <= EARLY_CHILD_MAX) ids.push("early_survival");
  if (age >= STUDENT_MIN && age <= STUDENT_MAX) ids.push("primary_years", "first_school", "exam_fork");
  if (age >= ADULT_MIN) ids.push("society_entry", "career", "conscription");
  return [...new Set(ids)];
}

export function inferActionArc(action, ctx = {}) {
  if (action?.arc) return action.arc;
  if (action?.turningPointId) return action.turningPointId;
  const lane = classifyLane(action) || action?.lane || "";
  const age = ctx.ageYears ?? 0;
  if (lane === "school") return age <= 8 ? "first_school" : (age <= 12 ? "primary_years" : "exam_fork");
  if (lane === "adolescent") return "exam_fork";
  if (lane === "play" || (lane === "family" && age <= EARLY_CHILD_MAX)) return "early_survival";
  if (lane === "adult_work" || lane === "adult_society" || lane === "adult_romance" || lane === "adult_drink") {
    const text = `${action?.text || ""}`;
    if (/徵兵|入伍|名冊|當兵/.test(text)) return "conscription";
    return age <= 25 ? "society_entry" : "career";
  }
  return "";
}

export function progressAllowsAction(action, ctx = {}) {
  if (!action) return false;
  const progress = ctx.character?.lifeProgress || emptyLifeProgress();
  const age = Number(ctx.ageYears ?? 0);
  if (action.turningPointId) {
    return progress.dueId === action.turningPointId;
  }
  if (progress.dueId && action.turningPoint) return false;

  const arc = inferActionArc(action, ctx);
  if (!arc) return true;

  if (arc === "early_survival" && age >= STUDENT_MIN && action.earlyChildOnly) return false;
  if (arc === "first_school" && age < STUDENT_MIN) return false;
  if (arc === "exam_fork" && age < 13) return false;
  if ((arc === "society_entry" || arc === "career" || arc === "conscription") && age < ADULT_MIN) return false;
  if (arc === "conscription" && !hasThread(ctx, ["conscription", "war"])) return false;

  const allowed = allowedArcIds(progress, ctx);
  if (arc === "primary_years" && allowed.includes("first_school")) return age >= STUDENT_MIN;
  return allowed.includes(arc);
}

export function progressAllowsIncident(kind, ctx = {}) {
  const progress = ctx.character?.lifeProgress || emptyLifeProgress();
  const age = Number(ctx.ageYears ?? 0);
  if (kind === "school") {
    if (age < STUDENT_MIN || age > STUDENT_MAX) return false;
    if (progress.dueId === "first_school") return false;
    return progress.completed.includes("first_school") || age >= 9;
  }
  if (kind === "adult") {
    if (age < ADULT_MIN) return false;
    return ctx.character?.socialPhase === "adult" || progress.completed.includes("society_entry");
  }
  return true;
}

export function attachLifeProgress(ctx = {}) {
  const character = ctx.character;
  if (!character) return ctx;
  const progress = tickLifeProgress(character, ctx);
  const stage = resolveLifeStage(ctx.ageYears ?? ctx.time?.ageYears ?? 0);
  ctx.lifeProgress = progress;
  ctx.stage = { id: stage.id, label: stage.label, arcId: stage.arcId, arcLabel: stage.arcLabel };
  ctx.dueTurningPoint = dueTurningPoint(character, ctx);
  ctx.progressiveLifeStages = true;
  return ctx;
}

export function publicProgressView(character, ctx = {}) {
  const progress = character?.lifeProgress || emptyLifeProgress();
  const stage = resolveLifeStage(ctx.ageYears ?? ctx.time?.ageYears ?? 0);
  const due = progress.dueId ? TURNING_POINTS[progress.dueId] : null;
  const arc = LIFE_ARCS.find((row) => row.id === progress.arcId) || currentArcForAge(stage.minAge || 5);
  return {
    arcId: progress.arcId,
    arcLabel: arc?.label || stage.arcLabel,
    stageId: stage.id,
    stageLabel: stage.label,
    dueId: progress.dueId,
    dueTitle: due?.title || "",
    completed: progress.completed.slice(),
    unlocked: progress.unlocked.slice(),
  };
}

export { LIFE_ARCS, TURNING_POINTS, getLifeStage };
