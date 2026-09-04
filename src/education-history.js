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

export const normalizeEducationHistory = (rows, types, fallbackType) =>
  (Array.isArray(rows) ? rows : [])
    .map((row) => ({
      start: String(row?.start ?? row?.year ?? ""),
      years: String(row?.years ?? row?.duration ?? ""),
      type: types[row?.type] ? row.type : fallbackType,
    }))
    .filter((row) => row.start !== "" || row.years !== "");

export const defaultYearsFor = (types, type) =>
  String(types[type]?.defaultYears ?? "");
