import assert from "node:assert/strict";
import {
  EARLY_CHILDHOOD_TYPES,
  EDUCATION_TYPES,
  GRADUATE_TYPES,
  HIGHER_ED_TYPES,
  defaultYearsFor,
  educationForKind,
  educationKindOf,
  normalizeEducation,
  normalizeEducationHistory,
  replaceEducationForKind,
} from "../src/education-history.js";

assert.equal(
  Object.keys(EDUCATION_TYPES).length,
  10
);

assert.equal(
  educationKindOf("kindergarten"),
  "early"
);
assert.equal(
  educationKindOf("university"),
  "higher"
);
assert.equal(
  educationKindOf("doctorate"),
  "graduate"
);
assert.equal(
  educationKindOf("unknown"),
  null
);

const canonicalEducation = normalizeEducation([
  {
    start: 1958,
    years: 2,
    type: "kindergarten",
  },
  {
    start: "1972",
    years: "4",
    type: "university",
  },
  {
    start: "1976",
    years: "2",
    type: "masters",
  },
  {
    start: "",
    years: "",
    type: "doctorate",
  },
]);

assert.deepEqual(
  canonicalEducation,
  [
    {
      start: "1958",
      years: "2",
      type: "kindergarten",
    },
    {
      start: "1972",
      years: "4",
      type: "university",
    },
    {
      start: "1976",
      years: "2",
      type: "masters",
    },
  ]
);

assert.deepEqual(
  educationForKind(
    canonicalEducation,
    "higher"
  ),
  [
    {
      start: "1972",
      years: "4",
      type: "university",
    },
  ]
);

const replacedEducation =
  replaceEducationForKind(
    [
      ...canonicalEducation,
      {
        start: "1980",
        years: "1",
        type: "unknown",
      },
    ],
    "higher",
    [
      {
        start: "1971",
        years: "5",
        type: "kosen",
      },
      {
        start: "1976",
        years: "2",
        type: "masters",
      },
    ]
  );

assert.deepEqual(
  replacedEducation,
  [
    {
      start: "1958",
      years: "2",
      type: "kindergarten",
    },
    {
      start: "1971",
      years: "5",
      type: "kosen",
    },
    {
      start: "1976",
      years: "2",
      type: "masters",
    },
    {
      start: "1980",
      years: "1",
      type: "unknown",
    },
  ]
);

assert.throws(
  () =>
    replaceEducationForKind(
      canonicalEducation,
      "unknown",
      []
    ),
  /種類/
);

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


assert.deepEqual(
  normalizeEducationHistory(
    [
      { start: 1972, years: 4, type: "university" },
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

console.log("OK: 教育歴の型定義・正規化を検査しました");
