import assert from "node:assert/strict";

import {
  buildLifeModel,
  migrateEducationSettings,
} from "../src/life-stages.js";

function model(overrides = {}) {
  return buildLifeModel({
    birth: 1953,
    month: 4,
    higherEdYear: "",
    higherEdType: "university",
    graduateYear: "",
    graduateType: "masters",
    adultYear: "",
    retirementYear: "",
    ...overrides,
  });
}

{
  const life = model({
    higherEdYear: "1972",
    graduateYear: "1976",
    graduateType: "mastersDoctorate",
    adultYear: "1981",
    retirementYear: "2019",
  });

  assert.equal(life.stageOf(1972).label, "大学生");
  assert.equal(life.gradeLabel(1975), "大4");
  assert.equal(life.gradeLabel(1976), "修1");
  assert.equal(life.gradeLabel(1978), "博1");
  assert.equal(life.stageOf(1981).label, "社会人");
  assert.equal(life.stageOf(2019).label, "自由人");
}

{
  const life = model({
    higherEdYear: "2000",
    higherEdType: "vocational",
    adultYear: "2003",
  });

  assert.equal(life.gradeLabel(2002), "専3");
  assert.equal(life.stageOf(2003).label, "社会人");
}

{
  const life = model({
    higherEdYear: "2000",
    higherEdType: "vocational",
  });

  assert.equal(life.adultYear, 2002);
  assert.equal(life.stageOf(2002).label, "社会人");
}

{
  const life = model({
    higherEdYear: "1969",
    higherEdType: "kosen",
  });

  assert.equal(life.gradeLabel(1969), "高専1");
  assert.equal(life.gradeLabel(1973), "高専5");
  assert.equal(life.adultYear, 1974);
}

{
  const life = model({
    higherEdYear: "1972",
    higherEdType: "medical",
  });

  assert.equal(life.gradeLabel(1977), "大6");
  assert.equal(life.adultYear, 1978);
}

{
  const life = model({
    higherEdYear: "1972",
    graduateYear: "1975",
    graduateType: "masters",
  });

  assert.equal(life.gradeLabel(1974), "大3");
  assert.equal(life.gradeLabel(1975), "修1");
  assert.equal(life.adultYear, 1977);
}

{
  const life = model({
    higherEdYear: "1972",
    graduateYear: "1978",
    graduateType: "masters",
    adultYear: "1982",
  });

  assert.equal(life.stageOf(1976).label, "大学院に入学する前");
  assert.equal(life.stageOf(1980).label, "社会人になる前");
}

{
  const life = model({
    higherEdYear: "1972",
    graduateYear: "1976",
    graduateType: "mastersDoctorate",
    adultYear: "1979",
  });

  assert.equal(life.gradeLabel(1978), "博1");
  assert.equal(life.stageOf(1979).label, "社会人");
}

{
  const migrated = migrateEducationSettings(
    {
      path: "phd",
      ronin: 1,
      ryunen: 0,
      adultY: "",
      retirementY: "2019",
    },
    {
      higherEdYear: "",
      higherEdType: "university",
      graduateYear: "",
      graduateType: "masters",
      adultYear: "",
      retirementYear: "",
    },
    1953,
    4
  );

  assert.deepEqual(migrated, {
    higherEdYear: "1973",
    higherEdType: "university",
    graduateYear: "1977",
    graduateType: "mastersDoctorate",
    adultYear: "",
    retirementYear: "2019",
  });
}

{
  const migrated = migrateEducationSettings(
    {
      higherEdYear: "1972",
      higherEdType: "university",
      graduateYear: "1976",
      graduateType: "masters",
      adultYear: "1978",
      retirementYear: "2019",
    },
    {},
    1953,
    4
  );

  assert.equal(migrated.adultYear, "1978");
  assert.equal(migrated.retirementYear, "2019");
}

{
  const migrated = migrateEducationSettings(
    {},
    {
      path: "kosen",
      roninYears: 0,
      ryunenYears: 0,
      adultYear: "",
      retirementYear: "",
    },
    1953,
    4
  );

  assert.equal(migrated.higherEdYear, "1969");
  assert.equal(migrated.higherEdType, "kosen");
}

console.log("OK: 人生段階の境界年と旧設定移行を検査しました");
