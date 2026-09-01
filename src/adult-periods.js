const YEAR_MIN = 1930;
const YEAR_MAX = 2100;

const cleanLabel = (value) =>
  String(value ?? "")
    .replace(/\t/g, " ")
    .replace(/\r?\n/g, " ")
    .trim();

const parseYear = (value, { allowBlank = false } = {}) => {
  if (value === "" || value == null) {
    return allowBlank ? null : NaN;
  }

  const year = Number(value);

  return Number.isInteger(year) &&
    year >= YEAR_MIN &&
    year <= YEAR_MAX
    ? year
    : NaN;
};

export function validateAdultPeriods(
  rows,
  { adultYear = null, retirementYear = null } = {}
) {
  const periods = [];
  const errors = [];

  (rows ?? []).forEach((row, index) => {
    const line = index + 1;
    const from = parseYear(row.from ?? row.start);
    const to = parseYear(row.to ?? row.end, { allowBlank: true });
    const label = cleanLabel(row.label);

    if (!Number.isFinite(from)) {
      errors.push(`${line}行目: 開始年を1930〜2100年で指定してください。`);
      return;
    }

    if (to !== null && !Number.isFinite(to)) {
      errors.push(`${line}行目: 終了年を1930〜2100年で指定するか、空欄にしてください。`);
      return;
    }

    if (to !== null && to < from) {
      errors.push(`${line}行目: 終了年は開始年以後にしてください。`);
      return;
    }

    if (!label) {
      errors.push(`${line}行目: 期間名を入力してください。`);
      return;
    }

    if (adultYear != null && from < adultYear) {
      errors.push(
        `${line}行目: 開始年は成人期の開始年 ${adultYear}年以後にしてください。`
      );
      return;
    }

    if (retirementYear != null && from >= retirementYear) {
      errors.push(
        `${line}行目: 開始年は退職年 ${retirementYear}年より前にしてください。`
      );
      return;
    }

    if (
      retirementYear != null &&
      to !== null &&
      to >= retirementYear
    ) {
      errors.push(
        `${line}行目: 終了年は退職年 ${retirementYear}年より前にしてください。`
      );
      return;
    }

    periods.push({
      from,
      to,
      label,
    });
  });

  periods.sort((a, b) => a.from - b.from);

  for (let i = 1; i < periods.length; i += 1) {
    const previous = periods[i - 1];
    const current = periods[i];

    if (previous.to === null) {
      errors.push(
        `「${previous.label}」は終了年が空欄なので、その後に別の期間を置けません。`
      );
      continue;
    }

    if (current.from <= previous.to) {
      errors.push(
        `「${previous.label}」と「${current.label}」の期間が重複しています。`
      );
    }
  }

  return { periods, errors };
}

export function adultPeriodOf(year, periods) {
  return (
    (periods ?? []).find(
      (period) =>
        year >= period.from &&
        (period.to === null || year <= period.to)
    ) ?? null
  );
}

export function serializeAdultPeriodsTsv(rows) {
  const { periods, errors } = validateAdultPeriods(rows);

  if (errors.length > 0) {
    throw new Error(errors.join("\n"));
  }

  const lines = [
    "start\tend\tlabel",
    ...periods.map((period) =>
      [
        period.from,
        period.to ?? "",
        cleanLabel(period.label),
      ].join("\t")
    ),
  ];

  return lines.join("\n") + "\n";
}

export function parseAdultPeriodsTsv(text) {
  const source = String(text ?? "")
    .replace(/^\uFEFF/, "")
    .replace(/\r\n?/g, "\n");

  const lines = source
    .split("\n")
    .filter((line) => line.trim() !== "");

  if (lines.length === 0) {
    return [];
  }

  const header = lines[0].split("\t");

  if (
    header.length !== 3 ||
    header[0] !== "start" ||
    header[1] !== "end" ||
    header[2] !== "label"
  ) {
    throw new Error(
      "1行目は start<TAB>end<TAB>label にしてください。"
    );
  }

  const rows = lines.slice(1).map((line, index) => {
    const cells = line.split("\t");

    if (cells.length !== 3) {
      throw new Error(
        `${index + 2}行目: 3列（start / end / label）で入力してください。`
      );
    }

    return {
      start: cells[0],
      end: cells[1],
      label: cells[2],
    };
  });

  const { periods, errors } = validateAdultPeriods(rows);

  if (errors.length > 0) {
    throw new Error(errors.join("\n"));
  }

  return periods;
}
