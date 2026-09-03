import assert from "node:assert/strict";

import {
  LIFE_SETTINGS_FORMAT,
  mergeLifeSettings,
  parseLifeSettingsTsv,
  serializeLifeSettingsTsv,
} from "../src/life-settings.js";

const source = {
  birth: 1953,
  month: 4,
  earlyChildhoodHistory: [
    {
      start: "1955",
      years: "3",
      type: "nursery",
    },
    {
      start: "1958",
      years: "2",
      type: "kindergarten",
    },
  ],
  higherEducationHistory: [
    {
      start: "1972",
      years: "4",
      type: "university",
    },
  ],
  graduateEducationHistory: [
    {
      start: "1976",
      years: "2",
      type: "masters",
    },
    {
      start: "1978",
      years: "3",
      type: "doctorate",
    },
  ],
  adultPeriodsEnabled: true,
  adultPeriods: [
    {
      start: "1981",
      end: "1990",
      label: "第1期",
    },
    {
      start: "1991",
      end: "",
      label: "第2期",
    },
  ],
  retirementYear: 2018,
  catOff: {
    society: true,
  },
};

const text =
  serializeLifeSettingsTsv(source);

assert.match(
  text,
  /^section\tstart\tend\tyears\ttype\tlabel\tvalue\n/
);

assert.match(
  text,
  new RegExp(
    `profile\\t\\t\\t\\t\\tformat\\t${LIFE_SETTINGS_FORMAT}`
  )
);

assert.match(
  text,
  /early\t1955\t\t3\tnursery\t/
);

assert.match(
  text,
  /adult\t1981\t1990\t\t\t第1期\t/
);

const parsed =
  parseLifeSettingsTsv(text);

assert.equal(parsed.birth, 1953);
assert.equal(parsed.month, 4);
assert.equal(
  parsed.earlyChildhoodHistory.length,
  2
);
assert.equal(
  parsed.higherEducationHistory.length,
  1
);
assert.equal(
  parsed.graduateEducationHistory.length,
  2
);
assert.equal(
  parsed.adultPeriodsEnabled,
  true
);
assert.equal(
  parsed.adultPeriods.length,
  2
);
assert.equal(
  Object.hasOwn(
    parsed,
    "retirementYear"
  ),
  false
);

const merged = mergeLifeSettings(
  {
    birth: 1965,
    retirementYear: 2025,
    adultYear: 1990,
    higherEdYear: 1984,
    catOff: {
      culture: true,
    },
    speed: 1.5,
  },
  parsed
);

assert.equal(merged.birth, 1953);
assert.equal(
  Object.hasOwn(
    merged,
    "retirementYear"
  ),
  false
);
assert.equal(
  Object.hasOwn(
    merged,
    "adultYear"
  ),
  false
);
assert.equal(
  Object.hasOwn(
    merged,
    "higherEdYear"
  ),
  false
);
assert.deepEqual(
  merged.catOff,
  { culture: true }
);
assert.equal(merged.speed, 1.5);

assert.throws(
  () =>
    parseLifeSettingsTsv(
      "wrong\theader\n"
    ),
  /1行目/
);

assert.throws(
  () =>
    parseLifeSettingsTsv(
      text.replace(
        "\nearly\t",
        "\nunknown\t"
      )
    ),
  /section/
);

console.log(
  "OK: 人生設定TSVの書き出し・読込・旧設定除去を検査しました"
);
