import { inferCategory, makeTagRecord, TAG_PREFIX } from "./data/tag-schema.js";

function asRecord(input) {
  if (!input) return null;
  if (typeof input === "string") return makeTagRecord({ id: input, category: inferCategory(input), label: input });
  return makeTagRecord(input);
}

export class TagStore {
  constructor(records = []) {
    this.records = [];
    this.index = new Map();
    for (const item of records) this.add(item);
  }

  add(input) {
    const record = asRecord(input);
    if (!record) return false;
    if (this.index.has(record.id)) return false;
    this.records.push(record);
    this.index.set(record.id, record);
    return true;
  }

  addMany(list) {
    for (const item of list || []) this.add(item);
    return this;
  }

  remove(id) {
    if (!this.index.has(id)) return false;
    this.index.delete(id);
    this.records = this.records.filter((item) => item.id !== id);
    return true;
  }

  has(id) {
    return this.index.has(id);
  }

  hasAny(ids = []) {
    return ids.some((id) => this.has(id));
  }

  hasAll(ids = []) {
    return ids.every((id) => this.has(id));
  }

  get(id) {
    return this.index.get(id) || null;
  }

  byPrefix(prefix) {
    return this.records.filter((item) => item.id.startsWith(prefix));
  }

  byCategory(category) {
    return this.records.filter((item) => item.category === category);
  }

  ids() {
    return this.records.map((item) => item.id);
  }

  labels() {
    return this.records.map((item) => item.label).filter(Boolean);
  }

  match({ any, all, none } = {}) {
    if (any && any.length && !this.hasAny(any)) return false;
    if (all && all.length && !this.hasAll(all)) return false;
    if (none && none.length && this.hasAny(none)) return false;
    return true;
  }

  toJSON() {
    return this.records.map((item) => ({
      ...item,
      hooks: item.hooks.slice(),
      modifiers: { ...item.modifiers },
      advantageIn: (item.advantageIn || []).slice(),
      strainIn: (item.strainIn || []).slice(),
    }));
  }

  static fromJSON(data) {
    return new TagStore(data || []);
  }
}

export function characterHasTag(character, tag) {
  if (!character) return false;
  if (character.tagStore instanceof TagStore) return character.tagStore.has(tag);
  if (character.tags?.includes(tag)) return true;
  if (character.tagRecords?.some((item) => item.id === tag)) return true;
  return false;
}

export function characterHasAnyTag(character, tags) {
  return (tags || []).some((tag) => characterHasTag(character, tag));
}

export function addCharacterTag(character, input) {
  if (!character) return false;
  const record = asRecord(input);
  if (!record) return false;
  if (!character.tagStore) character.tagStore = new TagStore(character.tagRecords || character.tags || []);
  const added = character.tagStore.add(record);
  character.tagRecords = character.tagStore.toJSON();
  character.tags = uniqueTags([
    ...(character.tags || []),
    record.id,
    record.label,
  ]);
  return added;
}

export function removeCharacterTag(character, tagId) {
  if (!character || !tagId) return false;
  if (!character.tagStore) character.tagStore = new TagStore(character.tagRecords || character.tags || []);
  const removed = character.tagStore.remove(tagId);
  character.tagRecords = character.tagStore.toJSON();
  character.tags = uniqueTags(character.tagRecords.flatMap((item) => [item.id, item.label]));
  return removed;
}

export function patchCharacterTag(character, tagId, patch = {}) {
  if (!character || !tagId) return false;
  if (!character.tagStore) character.tagStore = new TagStore(character.tagRecords || character.tags || []);
  const record = character.tagStore.get(tagId);
  if (!record) return false;
  if (patch.hidden != null) record.hidden = Boolean(patch.hidden);
  if (patch.temporary != null) record.temporary = Boolean(patch.temporary);
  if (patch.label) record.label = patch.label;
  if (patch.reason != null) record.reason = patch.reason;
  if (patch.data !== undefined) record.data = patch.data;
  character.tagRecords = character.tagStore.toJSON();
  character.tags = uniqueTags(character.tagRecords.flatMap((item) => [item.id, item.label]));
  return true;
}

export function uniqueTags(list) {
  return [...new Set((list || []).filter(Boolean))];
}

export function visibleTagIds(character) {
  const records = character?.tagRecords || character?.tagStore?.records || [];
  if (records.length) return records.filter((item) => !item.hidden).map((item) => item.id);
  return character?.tags || [];
}

export function hiddenTagRecords(character) {
  const records = character?.tagRecords || character?.tagStore?.records || [];
  return records.filter((item) => item.hidden);
}

export function tagsByCategory(character) {
  const records = character?.tagRecords || character?.tagStore?.records || [];
  const out = {};
  for (const record of records) {
    const key = record.category || "misc";
    if (!out[key]) out[key] = [];
    out[key].push(record.id);
  }
  return out;
}

export { TAG_PREFIX };
