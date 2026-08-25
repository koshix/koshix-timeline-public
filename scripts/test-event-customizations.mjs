import assert from "node:assert/strict";
import { applyEventCustomizations } from "../src/event-customizations.js";

const base = [
  {
    id: "a",
    date: "1900",
    y: 1900,
    t: "元の項目A",
    n: "元の要約A",
    cats: ["science"],
    primary: "science",
    importance: 2,
    core: false,
    ic: "flask",
  },
  {
    id: "b",
    date: "1910",
    y: 1910,
    t: "元の項目B",
    n: "元の要約B",
    cats: ["society"],
    primary: "society",
    importance: 2,
    core: false,
    ic: "flag",
  },
];

const customizations = {
  overrides: {
    a: {
      date: "1905",
      n: "ユーザー修正要約",
      importance: 3,
    },
    missing: {
      n: "現在は適用先がない差分",
    },
  },
  hidden: ["b", "also-missing"],
  additions: [
    {
      id: "custom-1",
      date: "1920",
      t: "ユーザー追加項目",
      n: "追加項目の要約",
      cats: ["computer"],
      primary: "computer",
      importance: 2,
      core: false,
      ic: "computer",
    },
  ],
};

const result = applyEventCustomizations(base, customizations);

assert.equal(result.events.length, 2);

const changed = result.events.find((event) => event.id === "a");
assert.ok(changed);
assert.equal(changed.date, "1905");
assert.equal(changed.y, 1905);
assert.equal(changed.t, "元の項目A");
assert.equal(changed.n, "ユーザー修正要約");
assert.equal(changed.importance, 3);

assert.equal(
  result.events.some((event) => event.id === "b"),
  false
);

const added = result.events.find(
  (event) => event.id === "custom-1"
);
assert.ok(added);
assert.equal(added.y, 1920);

assert.deepEqual(
  result.orphaned,
  ["also-missing", "missing"]
);

assert.equal(base[0].date, "1900");
assert.equal(base[0].n, "元の要約A");
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
