import assert from "node:assert/strict";

import {
  decodeEventRow,
  encodeEventRow,
} from "../src/event-codec.js";
import {
  PERSONAL_EVENT_TSV_HEADER,
  PUBLIC_EVENT_CATEGORIES,
  PUBLIC_EVENT_TSV_HEADER,
  isValidEventDate,
  splitEventList,
  validatePersonalEventRow,
  validatePublicEventRow,
} from "../src/event-schema.js";

assert.deepEqual(
  PERSONAL_EVENT_TSV_HEADER,
  PUBLIC_EVENT_TSV_HEADER.slice(0, -1)
);

assert.equal(PUBLIC_EVENT_CATEGORIES.has("science"), true);
assert.equal(PUBLIC_EVENT_CATEGORIES.has("me"), false);


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
  subs: "physics|school",
  region: "日本",
  importance: "3",
  icon: "atom",
  summary: "要約",
  sources: "https://example.com::Example",
  search: "検索語",
  note: "注記",
  core: "1",
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

const decodedPublic = decodeEventRow(
  publicRow,
  { includeCore: true }
);

assert.deepEqual(decodedPublic, {
  id: "event-1",
  date: "2000-01-02",
  end_date: "2000-01-03",
  title: "試験項目",
  cats: ["science", "education"],
  primary: "science",
  subs: ["physics", "school"],
  region: "日本",
  importance: 3,
  core: true,
  icon: "atom",
  summary: "要約",
  sources: ["https://example.com::Example"],
  search: "検索語",
  note: "注記",
});

assert.deepEqual(
  encodeEventRow(
    decodedPublic,
    { includeCore: true }
  ),
  publicRow
);

const personalRow = {
  ...publicRow,
  primary: "me",
  cats: "me|education",
};
delete personalRow.core;

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
assert.equal(
  Object.prototype.hasOwnProperty.call(
    decodedPersonal,
    "core"
  ),
  false
);

console.log(
  "OK: event schema / codec のヘッダー・日付・検証・フィールド対応・公開/個人史変換を検査しました"
);
