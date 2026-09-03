import assert from "node:assert/strict";
import {
  EARLY_CHILDHOOD_TYPES,
  GRADUATE_TYPES,
  HIGHER_ED_TYPES,
  defaultYearsFor,
  expandLegacyGraduateHistory,
  normalizeEducationHistory,
} from "../src/education-history.js";

assert.deepEqual(Object.keys(EARLY_CHILDHOOD_TYPES), [
  "nursery",
  "kodomoen",
  "kindergarten",
]);

assert.deepEqual(Object.keys(HIGHER_ED_TYPES), [
  "kosen",
  "vocational",
  "juniorCollege",
  "university",
]);

assert.deepEqual(Object.keys(GRADUATE_TYPES), [
  "masters",
  "professional",
  "doctorate",
]);

assert.equal(GRADUATE_TYPES.mastersDoctorate.label, "修士＋博士");
assert.equal(defaultYearsFor(GRADUATE_TYPES, "mastersDoctorate"), "5");

assert.deepEqual(
  normalizeEducationHistory(
    [
      { year: 1972, duration: 4, type: "university" },
      { start: "", years: "", type: "university" },
      { start: "1978", years: "2", type: "unknown" },
    ],
    HIGHER_ED_TYPES,
    "university"
  ),
  [
    { start: "1972", years: "4", type: "university" },
    { start: "1978", years: "2", type: "university" },
  ]
);

assert.deepEqual(
  expandLegacyGraduateHistory([
    { start: "1976", years: "5", type: "mastersDoctorate" },
  ]),
  [
    { start: "1976", years: "2", type: "masters" },
    { start: "1978", years: "3", type: "doctorate" },
  ]
);

assert.deepEqual(
  expandLegacyGraduateHistory([
    { start: "1976", years: "2", type: "masters" },
    { start: "1978", years: "3", type: "doctorate" },
  ]),
  [
    { start: "1976", years: "2", type: "masters" },
    { start: "1978", years: "3", type: "doctorate" },
  ]
);

console.log("OK: 教育歴の型定義・正規化・旧大学院設定移行を検査しました");
