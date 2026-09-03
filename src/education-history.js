export const EARLY_CHILDHOOD_TYPES = {
  nursery: {
    label: "保育所",
    stageLabel: "保育所",
    defaultYears: 2,
  },
  kodomoen: {
    label: "こども園",
    stageLabel: "こども園",
    defaultYears: 2,
  },
  kindergarten: {
    label: "幼稚園",
    stageLabel: "幼稚園",
    defaultYears: 2,
  },
};

export const HIGHER_ED_TYPES = {
  kosen: { label: "高専", stageLabel: "高専", gradePrefix: "高専", defaultYears: 5 },
  vocational: { label: "専門", stageLabel: "専門", gradePrefix: "専", defaultYears: 2 },
  juniorCollege: { label: "短大", stageLabel: "短大", gradePrefix: "短", defaultYears: 2 },
  university: { label: "大学", stageLabel: "大学", gradePrefix: "大", defaultYears: 4 },
};

export const GRADUATE_TYPES = {
  masters: { label: "修士", stageLabel: "大学院（修士）", gradePrefix: "修", defaultYears: 2 },
  professional: { label: "専門職", stageLabel: "大学院（専門職）", gradePrefix: "専職", defaultYears: 2 },
  doctorate: { label: "博士", stageLabel: "大学院（博士）", gradePrefix: "博", defaultYears: 3 },
};

// v2.1.1までの保存値との互換専用。Object.entries()には出ないため、
// UIの選択肢には「修士＋博士」を表示しない。
Object.defineProperty(GRADUATE_TYPES, "mastersDoctorate", {
  value: {
    label: "修士＋博士",
    stageLabel: "大学院（修士＋博士）",
    gradePrefix: "院",
    defaultYears: 5,
  },
  enumerable: false,
});

export const normalizeEducationHistory = (rows, types, fallbackType) =>
  (Array.isArray(rows) ? rows : [])
    .map((row) => ({
      start: String(row?.start ?? row?.year ?? ""),
      years: String(row?.years ?? row?.duration ?? ""),
      type: types[row?.type] ? row.type : fallbackType,
    }))
    .filter((row) => row.start !== "" || row.years !== "");

export const expandLegacyGraduateHistory = (rows) =>
  normalizeEducationHistory(rows, GRADUATE_TYPES, "masters").flatMap((row) => {
    if (row.type !== "mastersDoctorate") return [row];

    const start = Number(row.start);
    const totalYears = Number(row.years || 5);

    if (
      !Number.isInteger(start) ||
      !Number.isInteger(totalYears) ||
      totalYears < 1
    ) {
      return [{ ...row, type: "masters" }];
    }

    const mastersYears = Math.min(2, totalYears);
    const expanded = [
      {
        start: String(start),
        years: String(mastersYears),
        type: "masters",
      },
    ];

    if (totalYears > mastersYears) {
      expanded.push({
        start: String(start + mastersYears),
        years: String(totalYears - mastersYears),
        type: "doctorate",
      });
    }

    return expanded;
  });

export const defaultYearsFor = (types, type) =>
  String(types[type]?.defaultYears ?? "");
