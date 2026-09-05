import assert from "node:assert/strict";

import {
  adultPeriodOf,
  validateAdultPeriods,
} from "../src/adult-periods.js";

{
  const { periods, errors } = validateAdultPeriods(
    [
      { start: "1991", end: "2005", label: "奈良勤務" },
      { start: "1982", end: "1990", label: "最初の勤務期" },
      { start: "2006", end: "2018", label: "大学勤務" },
    ],
    {
      adultYear: 1982,
    }
  );

  assert.deepEqual(errors, []);
  assert.deepEqual(
    periods.map((period) => period.label),
    ["最初の勤務期", "奈良勤務", "大学勤務"]
  );

  assert.equal(adultPeriodOf(1985, periods)?.label, "最初の勤務期");
  assert.equal(adultPeriodOf(1998, periods)?.label, "奈良勤務");
  assert.equal(adultPeriodOf(2010, periods)?.label, "大学勤務");
  assert.equal(adultPeriodOf(2020, periods), null);
}

{
  const { errors } = validateAdultPeriods([
    { start: "1982", end: "1995", label: "前半" },
    { start: "1990", end: "2000", label: "後半" },
  ]);

  assert.equal(errors.length, 1);
  assert.match(errors[0], /重複/);
}

{
  const { periods, errors } = validateAdultPeriods([
    { start: "2020", end: "", label: "現在の仕事" },
  ]);

  assert.deepEqual(errors, []);
  assert.equal(periods[0].end, null);
  assert.equal(adultPeriodOf(2090, periods)?.label, "現在の仕事");
}

console.log("OK: 成人期の分割・検証を検査しました");
