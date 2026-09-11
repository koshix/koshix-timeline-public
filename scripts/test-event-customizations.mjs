import assert from "node:assert/strict";
import { applyEventCustomizations } from "../src/event-customizations.js";
import { eventYear } from "../src/event-schema.js";

const base = [
  {
    id: "a",
    date: "1900",
    title: "元の項目A",
    summary: "元の要約A",
    cats: ["science"],
    primary: "science",
    importance: 2,
    icon: "flask",
  },
  {
    id: "b",
    date: "1910",
    title: "元の項目B",
    summary: "元の要約B",
    cats: ["society"],
    primary: "society",
    importance: 2,
    icon: "flag",
  },
];

const customizations = {
  overrides: {
    a: {
      date: "1905",
      summary: "ユーザー修正要約",
      importance: 3,
    },
    missing: {
      summary: "現在は適用先がない差分",
    },
  },
  hidden: ["b", "also-missing"],
  additions: [
    {
      id: "custom-1",
      date: "1920",
      title: "ユーザー追加項目",
      summary: "追加項目の要約",
      cats: ["computer"],
      primary: "computer",
      importance: 2,
      icon: "computer",
    },
  ],
};

const result = applyEventCustomizations(base, customizations);

assert.equal(result.events.length, 2);

const changed = result.events.find((event) => event.id === "a");
assert.ok(changed);
assert.equal(changed.date, "1905");
assert.equal(eventYear(changed), 1905);
assert.equal(changed.title, "元の項目A");
assert.equal(changed.summary, "ユーザー修正要約");
assert.equal(changed.importance, 3);

assert.equal(
  result.events.some((event) => event.id === "b"),
  false
);

const added = result.events.find(
  (event) => event.id === "custom-1"
);
assert.ok(added);
assert.equal(eventYear(added), 1920);

assert.deepEqual(
  result.orphaned,
  ["also-missing", "missing"]
);

assert.equal(base[0].date, "1900");
assert.equal(base[0].summary, "元の要約A");
assert.equal(base[1].id, "b");

assert.throws(
  () =>
    applyEventCustomizations(base, {
      overrides: {
        a: { id: "changed-id" },
      },
    }),
  /id は変更できません/
);

console.log("OK: event customizations");
console.log(`effective events: ${result.events.length}`);
console.log(`orphaned customizations: ${result.orphaned.length}`);
