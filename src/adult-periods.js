const YEAR_MIN = 1501;
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
  { adultYear = null } = {}
) {
  const periods = [];
  const errors = [];

  (rows ?? []).forEach((row, index) => {
    const line = index + 1;
    const start = parseYear(row.start);
    const end = parseYear(row.end, { allowBlank: true });
    const label = cleanLabel(row.label);

    if (!Number.isFinite(start)) {
      errors.push(`${line}行目: 開始年を${YEAR_MIN}〜${YEAR_MAX}年で指定してください。`);
      return;
    }

    if (end !== null && !Number.isFinite(end)) {
      errors.push(`${line}行目: 終了年を${YEAR_MIN}〜${YEAR_MAX}年で指定するか、空欄にしてください。`);
      return;
    }

    if (end !== null && end < start) {
      errors.push(`${line}行目: 終了年は開始年以後にしてください。`);
      return;
    }

    if (!label) {
      errors.push(`${line}行目: 期間名を入力してください。`);
      return;
    }

    if (adultYear != null && start < adultYear) {
      errors.push(
        `${line}行目: 開始年は成人期の開始年 ${adultYear}年以後にしてください。`
      );
      return;
    }

    periods.push({
      start,
      end,
      label,
    });
  });

  periods.sort((a, b) => a.start - b.start);

  for (let i = 1; i < periods.length; i += 1) {
    const previous = periods[i - 1];
    const current = periods[i];

    if (previous.end === null) {
      errors.push(
        `「${previous.label}」は終了年が空欄なので、その後に別の期間を置けません。`
      );
      continue;
    }

    if (current.start <= previous.end) {
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
        year >= period.start &&
        (period.end === null || year <= period.end)
    ) ?? null
  );
}
