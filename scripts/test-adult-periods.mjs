import assert from "node:assert/strict";

import {
  adultPeriodOf,
  parseAdultPeriodsTsv,
  serializeAdultPeriodsTsv,
  validateAdultPeriods,
} from "../src/adult-periods.js";

{
  const { periods, errors } = validateAdultPeriods(
    [
      { from: "1991", to: "2005", label: "奈良勤務" },
      { from: "1982", to: "1990", label: "最初の勤務期" },
      { from: "2006", to: "2018", label: "大学勤務" },
    ],
    {
      adultYear: 1982,
      retirementYear: 2019,
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
    { from: "1982", to: "1995", label: "前半" },
    { from: "1990", to: "2000", label: "後半" },
  ]);

  assert.equal(errors.length, 1);
  assert.match(errors[0], /重複/);
}

{
  const { periods, errors } = validateAdultPeriods([
    { from: "2020", to: "", label: "現在の仕事" },
  ]);

  assert.deepEqual(errors, []);
  assert.equal(periods[0].to, null);
  assert.equal(adultPeriodOf(2090, periods)?.label, "現在の仕事");
}

{
  const source =
    "start\tend\tlabel\n" +
    "1982\t1990\t最初の勤務期\n" +
    "1991\t2005\t奈良勤務\n" +
    "2006\t2018\t大学勤務\n";

  const periods = parseAdultPeriodsTsv(source);

  assert.equal(periods.length, 3);
  assert.equal(periods[1].label, "奈良勤務");

  const output = serializeAdultPeriodsTsv(periods);
  assert.equal(output, source);
}

console.log("OK: 社会人期間の分割・検査・TSV入出力を検査しました");
