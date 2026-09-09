import assert from "node:assert/strict";

import {
  LIFE_SETTINGS_FORMAT,
  LIFE_SETTINGS_VERSION,
  createInitialEducationSettings,
  mergeLifeSettings,
  parseLifeSettingsTsv,
  serializeLifeSettingsTsv,
} from "../src/life-settings.js";

const source = {
  birth: 1953,
  month: 4,
  education: [
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
      start: "1978",
      years: "3",
      type: "doctorate",
    },
  ],
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
  catOff: {
    society: true,
  },
};

assert.deepEqual(
  createInitialEducationSettings(
    {},
    { education: [] },
    1953,
    4
  ),
  [
    {
      start: "1958",
      years: "2",
      type: "kindergarten",
    },
  ]
);

assert.deepEqual(
  createInitialEducationSettings(
    { education: [] },
    {
      education: [
        {
          start: "1972",
          years: "4",
          type: "university",
        },
      ],
    },
    1953,
    4
  ),
  []
);

assert.deepEqual(
  createInitialEducationSettings(
    {},
    {
      education: [
        {
          start: "1972",
          years: "4",
          type: "university",
        },
      ],
    },
    1953,
    4
  ),
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
  ]
);

const text =
  serializeLifeSettingsTsv(source);

assert.equal(LIFE_SETTINGS_VERSION, 3);
assert.equal(
  text.includes("adult_periods_enabled"),
  false
);

const oldVersion1Text = text.replace(
  `\tversion\t${LIFE_SETTINGS_VERSION}\n`,
  "\tversion\t1\n"
);

const oldVersion2Text = text.replace(
  `\tversion\t${LIFE_SETTINGS_VERSION}\n`,
  "\tversion\t2\n"
);

assert.throws(
  () => parseLifeSettingsTsv(oldVersion1Text),
  /対応していないversion/
);

assert.throws(
  () => parseLifeSettingsTsv(oldVersion2Text),
  /対応していないversion/
);

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
  /education\t1955\t\t3\tnursery\t/
);

assert.equal(
  /\n(?:early|higher|graduate)\t/.test(text),
  false
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
  parsed.education.length,
  5
);

assert.equal(
  Object.hasOwn(parsed, "earlyChildhoodHistory"),
  false
);

assert.equal(
  Object.hasOwn(parsed, "higherEducationHistory"),
  false
);

assert.equal(
  Object.hasOwn(parsed, "graduateEducationHistory"),
  false
);
assert.equal(
  parsed.adultPeriods.length,
  2
);
const merged = mergeLifeSettings(
  {
    birth: 1965,
    catOff: {
      culture: true,
    },
    speed: 1.5,
  },
  parsed
);

assert.equal(merged.birth, 1953);
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
        "\neducation\t",
        "\nunknown\t"
      )
    ),
  /section/
);

// 修学年数には恣意的な上限を設けず、終了年2100年を境界とする。
const longEducationText = serializeLifeSettingsTsv({
  ...source,
  education: [
    {
      start: "2050",
      years: "51",
      type: "university",
    },
  ],
});

assert.match(
  longEducationText,
  /education\t2050\t\t51\tuniversity\t/
);

assert.throws(
  () =>
    serializeLifeSettingsTsv({
      ...source,
      education: [
        {
          start: "2050",
          years: "52",
          type: "university",
        },
      ],
    }),
  /終了年が2100年を超えます/
);

// 年表開始年以後なら、歴史シミュレーション用の古い生年も扱える。
const historicalSimulationText =
  serializeLifeSettingsTsv({
    birth: 1750,
    month: 4,
    education: [
      {
        start: "1755",
        years: "2",
        type: "kindergarten",
      },
      {
        start: "1769",
        years: "4",
        type: "university",
      },
    ],
    adultPeriods: [
      {
        start: "1773",
        end: "",
        label: "仮想成人期",
      },
    ],
  });

assert.equal(
  parseLifeSettingsTsv(
    historicalSimulationText
  ).birth,
  1750
);

assert.throws(
  () =>
    serializeLifeSettingsTsv({
      ...source,
      birth: 1500,
    }),
  /1501〜2100/
);

console.log(
  "OK: 人生設定TSVの書き出し・読込・既存設定保持を検査しました"
);
