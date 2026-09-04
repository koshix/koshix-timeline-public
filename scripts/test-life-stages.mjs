import assert from "node:assert/strict";

import {
  GRADUATE_TYPES,
  buildLifeModel,
} from "../src/life-stages.js";

function model(overrides = {}) {
  return buildLifeModel({
    birth: 1953,
    month: 4,
    higherEducationHistory: [],
    graduateEducationHistory: [],
    adultYear: "",
    ...overrides,
  });
}

// 大学院の公開選択肢は「修士・専門職・博士」の3つだけ。
{
  assert.deepEqual(Object.keys(GRADUATE_TYPES), [
    "masters",
    "professional",
    "doctorate",
  ]);
}

// 基本の学齢区分。
{
  const life = model();

  assert.equal(life.stageOf(1957).label, "幼児期");
  assert.equal(life.stageOf(1958).label, "幼稚園");
  assert.equal(life.stageOf(1959).label, "幼稚園");
  assert.equal(life.stageOf(1960).label, "小学校");
  assert.equal(life.stageOf(1966).label, "中学校");
  assert.equal(life.stageOf(1969).label, "高校");
}

// 幼保歴が未設定なら従来どおり幼稚園2年間を表示する。
{
  const life = model();

  assert.equal(life.stageOf(1958).label, "幼稚園");
  assert.equal(life.stageOf(1959).label, "幼稚園");
  assert.equal(life.stageOf(1960).label, "小学校");
}

// 明示的に幼保歴を空配列へ戻した場合は幼稚園を表示しない。
{
  const life = model({
    earlyChildhoodHistory: [],
  });

  assert.equal(life.stageOf(1958).label, "幼児期");
  assert.equal(life.stageOf(1959).label, "幼児期");
  assert.equal(life.stageOf(1960).label, "小学校");
}

// 保育所から幼稚園への移行を複数行で表せる。
{
  const life = model({
    earlyChildhoodHistory: [
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
    earlyChildhoodHistory: [
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
    higherEducationHistory: [
      { start: "1972", years: "4", type: "university" },
    ],
    graduateEducationHistory: [
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
    higherEducationHistory: [
      { start: "1969", years: "5", type: "kosen" },
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
    higherEducationHistory: [
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
    higherEducationHistory: [
      { start: "1972", years: "3", type: "vocational" },
    ],
  });
  assert.equal(vocational.stageOf(1972).label, "専門");
  assert.equal(vocational.gradeLabel(1974), "専3");
  assert.equal(vocational.adultYear, 1975);

  const juniorCollege = model({
    higherEducationHistory: [
      { start: "1972", years: "2", type: "juniorCollege" },
    ],
  });
  assert.equal(juniorCollege.stageOf(1972).label, "短大");
  assert.equal(juniorCollege.gradeLabel(1973), "短2");
}

// 6年制大学も「大学＋修学年数6年」で表現できる。
{
  const life = model({
    higherEducationHistory: [
      { start: "1972", years: "6", type: "university" },
    ],
  });

  assert.equal(life.gradeLabel(1977), "大6");
  assert.equal(life.adultYear, 1978);
}

// 専門職大学院。
{
  const life = model({
    higherEducationHistory: [
      { start: "1972", years: "4", type: "university" },
    ],
    graduateEducationHistory: [
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
    higherEducationHistory: [
      { start: "1972", years: "4", type: "university" },
    ],
    graduateEducationHistory: [
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
    higherEducationHistory: [
      { start: "1972", years: "4", type: "university" },
    ],
    graduateEducationHistory: [
      { start: "1978", years: "2", type: "masters" },
    ],
    adultYear: "1982",
  });

  assert.equal(life.stageOf(1976).label, "大学院に入学する前");
  assert.equal(life.stageOf(1980).label, "次の段階に進む前");
}

// 重複期間は警告し、後から始まる行を優先する。
{
  const life = model({
    higherEducationHistory: [
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
    higherEducationHistory: [
      { start: "1972", years: "", type: "university" },
    ],
  });

  assert.ok(life.warnings.some((warning) => warning.includes("両方指定")));
  assert.equal(life.adultYear, 1972);
}

console.log("OK: 複数行の教育歴・人生段階を検査しました");
