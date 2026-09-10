import assert from "node:assert/strict";

import {
  GRADUATE_TYPES,
  buildLifeModel,
} from "../src/life-stages.js";

function model({
  early = [],
  secondary = [],
  higher = [],
  graduate = [],
  education = null,
  ...overrides
} = {}) {
  return buildLifeModel({
    birth: 1953,
    month: 4,
    education:
      education ?? [
        ...early,
        ...secondary,
        ...higher,
        ...graduate,
      ],
    ...overrides,
  });
}

// Life ModelのCanonical教育歴は単一education配列。
{
  const education = [
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
  ];

  const life = model({ education });

  assert.deepEqual(life.education, education);
  assert.equal(life.adultYear, 1978);
  assert.equal(
    Object.hasOwn(
      life,
      "earlyChildhoodHistory"
    ),
    false
  );
  assert.equal(
    Object.hasOwn(
      life,
      "higherEducationHistory"
    ),
    false
  );
  assert.equal(
    Object.hasOwn(
      life,
      "graduateEducationHistory"
    ),
    false
  );
}

// 単一education配列では未知のtypeを推測せず警告する。
{
  const life = model({
    education: [
      {
        start: "1972",
        years: "4",
        type: "unknown",
      },
    ],
  });

  assert.ok(
    life.warnings.some(
      (warning) =>
        warning.includes("未対応の種類")
    )
  );
}

// 大学院の公開選択肢は「修士・専門職・博士」の3つだけ。
{
  assert.deepEqual(Object.keys(GRADUATE_TYPES), [
    "masters",
    "professional",
    "doctorate",
  ]);
}

// 基本の年齢区分。任意教育歴がなければ16〜18歳は青年期。
{
  const life = model();

  assert.equal(life.stageOf(1957).label, "幼児期");
  assert.equal(life.stageOf(1958).label, "幼児期");
  assert.equal(life.stageOf(1959).label, "幼児期");
  assert.equal(life.stageOf(1960).label, "小学校");
  assert.equal(life.stageOf(1966).label, "中学校");
  assert.equal(life.stageOf(1969).label, "青年期");
}

// 高校を設定した場合だけ、その期間を高校として表示する。
{
  const life = model({
    secondary: [
      { start: "1969", years: "3", type: "highSchool" },
    ],
  });

  assert.equal(life.stageOf(1969).label, "高校");
  assert.equal(life.gradeLabel(1969), "高1");
  assert.equal(life.gradeLabel(1971), "高3");
  assert.equal(life.adultYear, 1972);
}

// 高校を途中で終えても、標準の青年期終了前に成人期にはしない。
{
  const life = model({
    secondary: [
      { start: "1969", years: "2", type: "highSchool" },
    ],
  });

  assert.equal(life.stageOf(1969).label, "高校");
  assert.equal(life.stageOf(1970).label, "高校");
  assert.equal(life.stageOf(1971).label, "青年期");
  assert.equal(life.adultYear, 1972);
}

// 幼稚園を設定した場合は、その期間を幼稚園として表示する。
{
  const life = model({
    early: [
      { start: "1958", years: "2", type: "kindergarten" },
    ],
  });

  assert.equal(life.stageOf(1958).label, "幼稚園");
  assert.equal(life.stageOf(1959).label, "幼稚園");
  assert.equal(life.stageOf(1960).label, "小学校");
}

// 保育所から幼稚園への移行を複数行で表せる。
{
  const life = model({
    early: [
      { start: "1955", years: "3", type: "nursery" },
      { start: "1958", years: "2", type: "kindergarten" },
    ],
  });

  assert.equal(life.stageOf(1955).label, "保育所");
  assert.equal(life.stageOf(1957).label, "保育所");
  assert.equal(life.stageOf(1958).label, "幼稚園");
  assert.equal(life.stageOf(1959).label, "幼稚園");
  assert.equal(life.stageOf(1960).label, "小学校");
}

// こども園も独立した幼保区分として扱う。
{
  const life = model({
    early: [
      { start: "1957", years: "3", type: "kodomoen" },
    ],
  });

  assert.equal(life.stageOf(1957).label, "こども園");
  assert.equal(life.stageOf(1959).label, "こども園");
  assert.equal(life.stageOf(1960).label, "小学校");
}

// 大学4年＋修士2年＋博士3年を別行で表す。
{
  const life = model({
    higher: [
      { start: "1972", years: "4", type: "university" },
    ],
    graduate: [
      { start: "1976", years: "2", type: "masters" },
      { start: "1978", years: "3", type: "doctorate" },
    ],
  });

  assert.equal(life.stageOf(1972).label, "大学");
  assert.equal(life.gradeLabel(1975), "大4");
  assert.equal(life.gradeLabel(1976), "修1");
  assert.equal(life.gradeLabel(1978), "博1");
  assert.equal(life.adultYear, 1981);
  assert.equal(life.stageOf(1981).label, "成人期");
  assert.equal(life.stageOf(2019).label, "成人期");
  assert.equal(life.stageOf(2050).label, "成人期");
}

// 高専から大学への編入を2行で表す。
{
  const life = model({
    secondary: [
      { start: "1969", years: "5", type: "kosen" },
    ],
    higher: [
      { start: "1974", years: "2", type: "university" },
    ],
  });

  assert.equal(life.gradeLabel(1969), "高専1");
  assert.equal(life.gradeLabel(1973), "高専5");
  assert.equal(life.stageOf(1974).label, "大学");
  assert.equal(life.gradeLabel(1975), "大2");
  assert.equal(life.adultYear, 1976);
}

// 大学等を複数行にして複数の課程を連続して表せる。
{
  const life = model({
    higher: [
      { start: "1972", years: "4", type: "university" },
      { start: "1976", years: "2", type: "university" },
    ],
  });

  assert.equal(life.gradeLabel(1975), "大4");
  assert.equal(life.gradeLabel(1976), "大1");
  assert.equal(life.gradeLabel(1977), "大2");
  assert.equal(life.adultYear, 1978);
}

// 専門・短大も修学年数を固定せず入力値で扱う。
{
  const vocational = model({
    higher: [
      { start: "1972", years: "3", type: "vocational" },
    ],
  });
  assert.equal(vocational.stageOf(1972).label, "専門");
  assert.equal(vocational.gradeLabel(1974), "専3");
  assert.equal(vocational.adultYear, 1975);

  const juniorCollege = model({
    higher: [
      { start: "1972", years: "2", type: "juniorCollege" },
    ],
  });
  assert.equal(juniorCollege.stageOf(1972).label, "短大");
  assert.equal(juniorCollege.gradeLabel(1973), "短2");
}

// 6年制大学も「大学＋修学年数6年」で表現できる。
{
  const life = model({
    higher: [
      { start: "1972", years: "6", type: "university" },
    ],
  });

  assert.equal(life.gradeLabel(1977), "大6");
  assert.equal(life.adultYear, 1978);
}

// 専門職大学院。
{
  const life = model({
    higher: [
      { start: "1972", years: "4", type: "university" },
    ],
    graduate: [
      { start: "1976", years: "2", type: "professional" },
    ],
  });

  assert.equal(life.stageOf(1976).label, "大学院（専門職）");
  assert.equal(life.gradeLabel(1976), "専職1");
  assert.equal(life.adultYear, 1978);
}

// 大学院も複数行にでき、修士と博士を独立して設定できる。
{
  const life = model({
    higher: [
      { start: "1972", years: "4", type: "university" },
    ],
    graduate: [
      { start: "1976", years: "2", type: "masters" },
      { start: "1978", years: "3", type: "doctorate" },
    ],
  });

  assert.equal(life.gradeLabel(1976), "修1");
  assert.equal(life.gradeLabel(1978), "博1");
  assert.equal(life.gradeLabel(1980), "博3");
  assert.equal(life.adultYear, 1981);
}

// 入学までに空白があれば勝手に前の課程を延長しない。
{
  const life = model({
    higher: [
      { start: "1972", years: "4", type: "university" },
    ],
    graduate: [
      { start: "1978", years: "2", type: "masters" },
    ],
  });

  assert.equal(life.stageOf(1976).label, "大学院に入学する前");
  assert.equal(life.adultYear, 1980);
  assert.equal(life.stageOf(1980).label, "成人期");
}

// 重複期間は警告し、後から始まる行を優先する。
{
  const life = model({
    higher: [
      { start: "1969", years: "5", type: "kosen" },
      { start: "1973", years: "2", type: "university" },
    ],
  });

  assert.ok(life.warnings.some((warning) => warning.includes("重なっています")));
  assert.equal(life.stageOf(1972).label, "高専");
  assert.equal(life.stageOf(1973).label, "大学");
}

// 入学年と修学年数の片方だけでは期間として採用しない。
{
  const life = model({
    higher: [
      { start: "1972", years: "", type: "university" },
    ],
  });

  assert.ok(life.warnings.some((warning) => warning.includes("両方指定")));
  assert.equal(life.adultYear, 1972);
}

// 長い修学年数も2100年以内なら扱える。
{
  const life = model({
    education: [
      {
        start: "2050",
        years: "51",
        type: "university",
      },
    ],
  });

  assert.equal(life.stageOf(2100).label, "大学");
  assert.equal(life.gradeLabel(2100), "大51");
  assert.equal(life.adultYear, 2101);
}

// 終了年が2100年を超える教育歴は採用せず警告する。
{
  const life = model({
    education: [
      {
        start: "2099",
        years: "3",
        type: "university",
      },
    ],
  });

  assert.ok(
    life.warnings.some((warning) =>
      warning.includes("終了年が2100年を超えます")
    )
  );
}

console.log("OK: 複数行の教育歴・人生段階を検査しました");
