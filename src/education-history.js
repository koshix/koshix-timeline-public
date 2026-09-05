export const EDUCATION_TYPES = {
  nursery: {
    kind: "early",
    label: "保育所",
    stageLabel: "保育所",
    defaultYears: 2,
  },
  kodomoen: {
    kind: "early",
    label: "こども園",
    stageLabel: "こども園",
    defaultYears: 2,
  },
  kindergarten: {
    kind: "early",
    label: "幼稚園",
    stageLabel: "幼稚園",
    defaultYears: 2,
  },
  kosen: {
    kind: "higher",
    label: "高専",
    stageLabel: "高専",
    gradePrefix: "高専",
    defaultYears: 5,
  },
  vocational: {
    kind: "higher",
    label: "専門",
    stageLabel: "専門",
    gradePrefix: "専",
    defaultYears: 2,
  },
  juniorCollege: {
    kind: "higher",
    label: "短大",
    stageLabel: "短大",
    gradePrefix: "短",
    defaultYears: 2,
  },
  university: {
    kind: "higher",
    label: "大学",
    stageLabel: "大学",
    gradePrefix: "大",
    defaultYears: 4,
  },
  masters: {
    kind: "graduate",
    label: "修士",
    stageLabel: "大学院（修士）",
    gradePrefix: "修",
    defaultYears: 2,
  },
  professional: {
    kind: "graduate",
    label: "専門職",
    stageLabel: "大学院（専門職）",
    gradePrefix: "専職",
    defaultYears: 2,
  },
  doctorate: {
    kind: "graduate",
    label: "博士",
    stageLabel: "大学院（博士）",
    gradePrefix: "博",
    defaultYears: 3,
  },
};

const educationTypesForKind = (kind) =>
  Object.fromEntries(
    Object.entries(EDUCATION_TYPES).filter(
      ([, config]) => config.kind === kind
    )
  );

export const EARLY_CHILDHOOD_TYPES =
  educationTypesForKind("early");

export const HIGHER_ED_TYPES =
  educationTypesForKind("higher");

export const GRADUATE_TYPES =
  educationTypesForKind("graduate");

export const educationKindOf = (type) =>
  EDUCATION_TYPES[type]?.kind ?? null;

export const normalizeEducation = (rows) =>
  (Array.isArray(rows) ? rows : [])
    .map((row) => ({
      start: String(row?.start ?? ""),
      years: String(row?.years ?? ""),
      type: String(row?.type ?? ""),
    }))
    .filter(
      (row) =>
        row.start !== "" ||
        row.years !== ""
    );

export const educationForKind = (
  education,
  kind
) =>
  normalizeEducation(education).filter(
    (row) =>
      educationKindOf(row.type) === kind
  );

const EDUCATION_KINDS = [
  "early",
  "higher",
  "graduate",
];

export const replaceEducationForKind = (
  education,
  kind,
  rows
) => {
  if (!EDUCATION_KINDS.includes(kind)) {
    throw new Error(
      `教育歴の分類 "${kind}" は不正です。`
    );
  }

  const current =
    normalizeEducation(education);

  const replacement =
    normalizeEducation(rows).filter(
      (row) =>
        educationKindOf(row.type) === kind
    );

  const unknown = current.filter(
    (row) =>
      educationKindOf(row.type) === null
  );

  return [
    ...EDUCATION_KINDS.flatMap(
      (currentKind) =>
        currentKind === kind
          ? replacement
          : educationForKind(
              current,
              currentKind
            )
    ),
    ...unknown,
  ];
};

export const normalizeEducationHistory = (rows, types, fallbackType) =>
  (Array.isArray(rows) ? rows : [])
    .map((row) => ({
      start: String(row?.start ?? ""),
      years: String(row?.years ?? ""),
      type: types[row?.type] ? row.type : fallbackType,
    }))
    .filter((row) => row.start !== "" || row.years !== "");

export const defaultYearsFor = (types, type) =>
  String(types[type]?.defaultYears ?? "");
