import assert from "node:assert/strict";
import {
  backgroundEraOf,
  halfCenturyMarkerOf,
  japaneseEraOf,
  preBirthPeriodsOf,
} from "../src/timeline-eras.js";

assert.equal(
  backgroundEraOf(1601)?.key,
  "scientific-revolution"
);
assert.equal(
  backgroundEraOf(1687)?.key,
  "scientific-revolution"
);
assert.equal(
  backgroundEraOf(1688)?.key,
  "enlightenment"
);
assert.equal(
  backgroundEraOf(1945)?.key,
  "world-wars"
);
assert.equal(
  backgroundEraOf(1946)?.key,
  "postwar"
);
assert.equal(
  backgroundEraOf(2026)?.key,
  "ai-postpandemic"
);
assert.equal(backgroundEraOf(1600), null);

assert.equal(japaneseEraOf(1867), null);
assert.equal(japaneseEraOf(1868)?.label, "明治");
assert.equal(japaneseEraOf(1912)?.label, "大正");
assert.equal(japaneseEraOf(1926)?.label, "昭和");
assert.equal(japaneseEraOf(1989)?.label, "平成");
assert.equal(japaneseEraOf(2019)?.label, "令和");

assert.equal(halfCenturyMarkerOf(2000), null);
assert.equal(
  halfCenturyMarkerOf(2001)?.key,
  "21c-first"
);
assert.equal(
  halfCenturyMarkerOf(2050)?.key,
  "21c-first"
);
assert.equal(halfCenturyMarkerOf(2051), null);

assert.deepEqual(preBirthPeriodsOf(1601), []);
assert.deepEqual(preBirthPeriodsOf("invalid"), []);

{
  const periods = preBirthPeriodsOf(1953);

  assert.equal(periods.length, 8);
  assert.deepEqual(periods[0], {
    key: "pre-17-first",
    label: "17世紀前半",
    from: 1601,
    to: 1650,
  });
  assert.deepEqual(periods.at(-1), {
    key: "pre-20-second",
    label: "20世紀後半",
    from: 1951,
    to: 1952,
  });
}

console.log(
  "OK: 背景史・元号・出生前期間の境界を検査しました"
);
