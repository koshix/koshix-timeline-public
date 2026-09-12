import assert from "node:assert/strict";

import {
  decodeEventRow,
  encodeEventRow,
} from "../src/event-codec.js";
import {
  EVENT_TSV_HEADER,
  PERSONAL_EVENT_TSV_HEADER,
  PUBLIC_EVENT_CATEGORIES,
  PUBLIC_EVENT_SUB_TAG_KEYS,
  PUBLIC_EVENT_SUB_TAGS,
  PUBLIC_EVENT_TSV_HEADER,
  isValidEventDate,
  splitEventList,
  validatePersonalEventRow,
  validatePublicEventRow,
} from "../src/event-schema.js";

assert.strictEqual(
  PUBLIC_EVENT_TSV_HEADER,
  EVENT_TSV_HEADER
);
assert.strictEqual(
  PERSONAL_EVENT_TSV_HEADER,
  EVENT_TSV_HEADER
);

assert.equal(PUBLIC_EVENT_CATEGORIES.has("science"), true);
assert.equal(PUBLIC_EVENT_CATEGORIES.has("me"), false);

assert.equal(PUBLIC_EVENT_SUB_TAG_KEYS.length, 16);
assert.equal(PUBLIC_EVENT_SUB_TAGS.has("thought"), true);
assert.equal(PUBLIC_EVENT_SUB_TAGS.has("technology"), true);
assert.equal(PUBLIC_EVENT_SUB_TAGS.has("space"), true);
assert.equal(PUBLIC_EVENT_SUB_TAGS.has("audio"), false);
assert.equal(PUBLIC_EVENT_SUB_TAGS.has("sf"), false);

assert.deepEqual(
  splitEventList("science| education |science"),
  ["science", "education", "science"]
);

for (const value of [
  "2000",
  "2000-01",
  "2000-01-31",
]) {
  assert.equal(isValidEventDate(value), true);
}

for (const value of [
  "",
  "2000-00",
  "2000-13",
  "2000-01-00",
  "2000-01-32",
]) {
  assert.equal(isValidEventDate(value), false);
}

const publicRow = {
  id: "event-1",
  date: "2000-01-02",
  end_date: "2000-01-03",
  title: "試験項目",
  cats: "science|education",
  primary: "science",
  subs: "math|technology",
  region: "日本",
  importance: "3",
  icon: "atom",
  summary: "要約",
  sources: "https://example.com::Example",
  search: "検索語",
  note: "注記",
};

assert.deepEqual(
  validatePublicEventRow(publicRow),
  {
    cats: ["science", "education"],
    importance: 3,
  }
);

assert.throws(
  () => validatePublicEventRow({
    ...publicRow,
    primary: "me",
  }),
  /primary "me" が不正/
);

assert.throws(
  () => validatePublicEventRow({
    ...publicRow,
    cats: "work|sf",
    primary: "sf",
  }),
  /primary "sf" が不正/
);

assert.throws(
  () => validatePublicEventRow({
    ...publicRow,
    subs: "audio",
  }),
  /未知のsubsタグ "audio"/
);

const decodedPublic = decodeEventRow(
  publicRow
);

assert.deepEqual(decodedPublic, {
  id: "event-1",
  date: "2000-01-02",
  end_date: "2000-01-03",
  title: "試験項目",
  cats: ["science", "education"],
  primary: "science",
  subs: ["math", "technology"],
  region: "日本",
  importance: 3,
  icon: "atom",
  summary: "要約",
  sources: ["https://example.com::Example"],
  search: "検索語",
  note: "注記",
});

assert.deepEqual(
  encodeEventRow(
    decodedPublic
  ),
  publicRow
);

const personalRow = {
  ...publicRow,
  primary: "me",
  cats: "me|education",
};

assert.deepEqual(
  validatePersonalEventRow(personalRow),
  {
    cats: ["me", "education"],
    importance: 3,
  }
);

assert.throws(
  () => validatePersonalEventRow({
    ...personalRow,
    cats: "education",
  }),
  /cats に me が必要/
);

const decodedPersonal = decodeEventRow(
  {
    ...personalRow,
    icon: "",
  },
  {
    forcePrimary: "me",
    defaultIcon: "flag",
  }
);

assert.equal(decodedPersonal.primary, "me");
assert.equal(decodedPersonal.icon, "flag");
assert.deepEqual(
  decodedPersonal.cats,
  ["me", "education"]
);
console.log(
  "OK: event schema / codec のヘッダー・日付・検証・フィールド対応・公開/個人史変換を検査しました"
);
