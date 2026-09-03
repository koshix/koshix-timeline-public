import {
  EARLY_CHILDHOOD_TYPES,
  GRADUATE_TYPES,
  HIGHER_ED_TYPES,
  expandLegacyGraduateHistory,
  normalizeEducationHistory,
} from "./education-history.js";

export {
  EARLY_CHILDHOOD_TYPES,
  GRADUATE_TYPES,
  HIGHER_ED_TYPES,
};

const YEAR_MIN = 1930;
const YEAR_MAX = 2100;
const YEARS_MIN = 1;
const YEARS_MAX = 20;

export function validYear(value) {
  if (value === "" || value == null) return null;
  const year = Number(value);
  return Number.isInteger(year) && year >= YEAR_MIN && year <= YEAR_MAX
    ? year
    : null;
}

export function validStudyYears(value) {
  if (value === "" || value == null) return null;
  const years = Number(value);
  return Number.isInteger(years) && years >= YEARS_MIN && years <= YEARS_MAX
    ? years
    : null;
}

const stage = (key, label, from, to, color, bg, extra = {}) => ({
  key,
  label,
  from,
  to,
  color,
  bg,
  ...extra,
});

function addStage(stages, item) {
  if (item.to >= item.from) stages.push(item);
}

function truncateBefore(stages, year) {
  return stages
    .filter((item) => item.from < year)
    .map((item) => ({ ...item, to: Math.min(item.to, year - 1) }))
    .filter((item) => item.to >= item.from);
}

function addGap(stages, from, to, label = "次の段階に進む前") {
  addStage(
    stages,
    stage("gap", label, from, to, "#7a6a55", "#f5f1e8")
  );
}

const legacyHigherType = (type) => {
  if (type === "kosen") return "kosen";
  if (type === "vocational") return "vocational";
  if (type === "juniorCollege") return "juniorCollege";
  return "university";
};

const legacyHigherYears = (type) => {
  if (type === "kosen") return 5;
  if (type === "vocational") return 2;
  if (type === "juniorCollege") return 2;
  if (type === "medical") return 6;
  return 4;
};

const legacyGraduateType = (type) =>
  GRADUATE_TYPES[type] ? type : "masters";

const legacyGraduateYears = (type) =>
  type === "mastersDoctorate" ? 5 : 2;

const savedArray = (value) => Array.isArray(value);

export function migrateEducationSettings(saved, defaults, birth, month) {
  const cohortBirth = month >= 1 && month <= 3 ? birth - 1 : birth;

  const savedEarlyHistory = savedArray(saved.earlyChildhoodHistory)
    ? saved.earlyChildhoodHistory
    : null;
  const defaultEarlyHistory = savedArray(defaults.earlyChildhoodHistory)
    ? defaults.earlyChildhoodHistory
    : null;

  const savedHigherHistory = savedArray(saved.higherEducationHistory)
    ? saved.higherEducationHistory
    : savedArray(saved.higherEdHistory)
      ? saved.higherEdHistory
      : null;
  const savedGraduateHistory = savedArray(saved.graduateEducationHistory)
    ? saved.graduateEducationHistory
    : savedArray(saved.graduateHistory)
      ? saved.graduateHistory
      : null;
  const defaultHigherHistory = savedArray(defaults.higherEducationHistory)
    ? defaults.higherEducationHistory
    : savedArray(defaults.higherEdHistory)
      ? defaults.higherEdHistory
      : null;
  const defaultGraduateHistory = savedArray(defaults.graduateEducationHistory)
    ? defaults.graduateEducationHistory
    : savedArray(defaults.graduateHistory)
      ? defaults.graduateHistory
      : null;

  const initialEarlyHistory =
    savedEarlyHistory !== null
      ? savedEarlyHistory
      : defaultEarlyHistory?.length
        ? defaultEarlyHistory
        : [{
            start: String(cohortBirth + 5),
            years: "2",
            type: "kindergarten",
          }];

  let earlyChildhoodHistory = normalizeEducationHistory(
    initialEarlyHistory,
    EARLY_CHILDHOOD_TYPES,
    "kindergarten"
  );
  let higherEducationHistory;
  let graduateEducationHistory;

  if (savedHigherHistory !== null || defaultHigherHistory !== null) {
    higherEducationHistory = normalizeEducationHistory(
      savedHigherHistory ?? defaultHigherHistory,
      HIGHER_ED_TYPES,
      "university"
    );
  } else {
    const higherEdYear = saved.higherEdYear ?? defaults.higherEdYear ?? "";
    const rawHigherType =
      saved.higherEdType ?? defaults.higherEdType ?? "university";
    higherEducationHistory = higherEdYear === ""
      ? []
      : [{
          start: String(higherEdYear),
          years: String(
            saved.higherEdYears ??
            defaults.higherEdYears ??
            legacyHigherYears(rawHigherType)
          ),
          type: legacyHigherType(rawHigherType),
        }];
  }

  if (savedGraduateHistory !== null || defaultGraduateHistory !== null) {
    graduateEducationHistory = normalizeEducationHistory(
      savedGraduateHistory ?? defaultGraduateHistory,
      GRADUATE_TYPES,
      "masters"
    );
  } else {
    const graduateYear = saved.graduateYear ?? defaults.graduateYear ?? "";
    const rawGraduateType =
      saved.graduateType ?? defaults.graduateType ?? "masters";
    graduateEducationHistory = graduateYear === ""
      ? []
      : [{
          start: String(graduateYear),
          years: String(
            saved.graduateYears ??
            defaults.graduateYears ??
            legacyGraduateYears(rawGraduateType)
          ),
          type: legacyGraduateType(rawGraduateType),
        }];
  }

  const savedHasModernSettings = [
    "higherEdYear",
    "higherEdType",
    "graduateYear",
    "graduateType",
    "higherEducationHistory",
    "graduateEducationHistory",
    "higherEdHistory",
    "graduateHistory",
    "adultYear",
    "retirementYear",
  ].some((key) => Object.hasOwn(saved, key));
  const savedHasLegacySettings = ["path", "ronin", "ryunen"].some(
    (key) => Object.hasOwn(saved, key)
  );
  const defaultsHaveModernSettings = [
    "higherEdYear",
    "higherEdType",
    "graduateYear",
    "graduateType",
    "higherEducationHistory",
    "graduateEducationHistory",
  ].some((key) => Object.hasOwn(defaults, key));
  const defaultsHaveLegacySettings = Object.hasOwn(defaults, "path");
  const shouldUseLegacyPath =
    (!savedHasModernSettings && savedHasLegacySettings) ||
    (!savedHasModernSettings &&
      !savedHasLegacySettings &&
      defaultsHaveLegacySettings &&
      !defaultsHaveModernSettings);

  if (shouldUseLegacyPath) {
    const legacyPath = saved.path ?? defaults.path;
    const legacyRonin = Number(saved.ronin ?? defaults.roninYears ?? 0);
    const legacyRyunen = Number(saved.ryunen ?? defaults.ryunenYears ?? 0);
    const path = legacyPath || "univ";

    if (path === "hs_job") {
      higherEducationHistory = [];
      graduateEducationHistory = [];
    } else {
      const higherType =
        path === "kosen"
          ? "kosen"
          : path === "vocational"
            ? "vocational"
            : "university";
      const start = cohortBirth + (path === "kosen" ? 16 : 19 + legacyRonin);
      const baseYears =
        path === "kosen"
          ? 5
          : path === "vocational"
            ? 2
            : path === "univ6"
              ? 6
              : 4;
      const years = baseYears + legacyRyunen;
      higherEducationHistory = [{
        start: String(start),
        years: String(years),
        type: higherType,
      }];

      if (path === "masters" || path === "phd") {
        graduateEducationHistory = [{
          start: String(start + years),
          years: path === "phd" ? "5" : "2",
          type: path === "phd" ? "mastersDoctorate" : "masters",
        }];
      } else {
        graduateEducationHistory = [];
      }
    }
  }

  graduateEducationHistory = expandLegacyGraduateHistory(
    graduateEducationHistory
  );

  const firstHigher = higherEducationHistory[0] ?? null;
  const firstGraduate = graduateEducationHistory[0] ?? null;

  return {
    earlyChildhoodHistory,
    higherEducationHistory,
    graduateEducationHistory,
    // 旧Appとの移行期間中に使う互換値。
    higherEdYear: firstHigher?.start ?? "",
    higherEdType: firstHigher?.type ?? "university",
    higherEdYears: firstHigher?.years ?? "",
    graduateYear: firstGraduate?.start ?? "",
    graduateType: firstGraduate?.type ?? "masters",
    graduateYears: firstGraduate?.years ?? "",
    adultYear:
      saved.adultYear ?? saved.adultY ?? defaults.adultYear ?? "",
    retirementYear:
      saved.retirementYear ??
      saved.retirementY ??
      defaults.retirementYear ??
      "",
  };
}

function normalizeRowsForModel({
  rows,
  types,
  fallbackType,
  label,
  kind,
  warnings,
}) {
  const normalized = normalizeEducationHistory(rows, types, fallbackType);
  const complete = [];

  normalized.forEach((row, index) => {
    const start = validYear(row.start);
    const years = validStudyYears(row.years);

    if ((row.start === "") !== (row.years === "")) {
      warnings.push(
        `${label}${index + 1}行目は、入学年と修学年数を両方指定してください。`
      );
      return;
    }

    if (row.start === "" && row.years === "") return;

    if (start == null) {
      warnings.push(
        `${label}${index + 1}行目の入学年を${YEAR_MIN}〜${YEAR_MAX}年で指定してください。`
      );
      return;
    }

    if (years == null) {
      warnings.push(
        `${label}${index + 1}行目の修学年数を${YEARS_MIN}〜${YEARS_MAX}年で指定してください。`
      );
      return;
    }

    complete.push({
      kind,
      inputIndex: index,
      start,
      years,
      end: start + years - 1,
      type: types[row.type] ? row.type : fallbackType,
    });
  });

  return complete;
}

function resolveHistories({
  earlyChildhoodHistory,
  higherEducationHistory,
  graduateEducationHistory,
  higherEdYear,
  higherEdType,
  graduateYear,
  graduateType,
}) {
  const explicitEarly = Array.isArray(earlyChildhoodHistory)
    ? earlyChildhoodHistory
    : null;
  const explicitHigher = Array.isArray(higherEducationHistory)
    ? higherEducationHistory
    : null;
  const explicitGraduate = Array.isArray(graduateEducationHistory)
    ? graduateEducationHistory
    : null;

  if (explicitEarly || explicitHigher || explicitGraduate) {
    return {
      earlyChildhoodHistory: explicitEarly ?? [],
      higherEducationHistory: explicitHigher ?? [],
      graduateEducationHistory: explicitGraduate ?? [],
    };
  }

  return {
    earlyChildhoodHistory: [],
    higherEducationHistory:
      higherEdYear === "" || higherEdYear == null
        ? []
        : [{
            start: String(higherEdYear),
            years: String(legacyHigherYears(higherEdType)),
            type: legacyHigherType(higherEdType),
          }],
    graduateEducationHistory:
      graduateYear === "" || graduateYear == null
        ? []
        : [{
            start: String(graduateYear),
            years: String(legacyGraduateYears(graduateType)),
            type: legacyGraduateType(graduateType),
          }],
  };
}

function addHigherStage(stages, entry, sequence) {
  const config = HIGHER_ED_TYPES[entry.type] ?? HIGHER_ED_TYPES.university;
  addStage(
    stages,
    stage(
      `higher-${sequence}`,
      config.stageLabel,
      entry.start,
      entry.end,
      entry.type === "kosen" ? "#0f6f8a" : "#6b3fa0",
      entry.type === "kosen" ? "#e3f1f5" : "#f1e9fa",
      { gradePrefix: config.gradePrefix }
    )
  );
}

function addGraduateStages(stages, entry, sequence) {
  if (entry.type === "mastersDoctorate") {
    const mastersYears = Math.min(2, entry.years);
    if (mastersYears > 0) {
      addStage(
        stages,
        stage(
          `graduate-${sequence}-masters`,
          "大学院（修士）",
          entry.start,
          entry.start + mastersYears - 1,
          "#4a5fb0",
          "#eaeefb",
          { gradePrefix: "修" }
        )
      );
    }
    const doctorateYears = entry.years - mastersYears;
    if (doctorateYears > 0) {
      addStage(
        stages,
        stage(
          `graduate-${sequence}-doctorate`,
          "大学院（博士）",
          entry.start + mastersYears,
          entry.end,
          "#31589c",
          "#e5ecf8",
          { gradePrefix: "博" }
        )
      );
    }
    return;
  }

  const config = GRADUATE_TYPES[entry.type] ?? GRADUATE_TYPES.masters;
  addStage(
    stages,
    stage(
      `graduate-${sequence}`,
      config.stageLabel,
      entry.start,
      entry.end,
      "#4a5fb0",
      "#eaeefb",
      { gradePrefix: config.gradePrefix }
    )
  );
}

export function buildLifeModel({
  birth,
  month,
  earlyChildhoodHistory,
  higherEducationHistory,
  graduateEducationHistory,
  higherEdYear = "",
  higherEdType = "university",
  graduateYear = "",
  graduateType = "masters",
  adultYear = "",
  retirementYear = "",
}) {
  const cohortBirth = month >= 1 && month <= 3 ? birth - 1 : birth;
  const earlyHistoryWasExplicit = Array.isArray(earlyChildhoodHistory);
  const explicitAdult = validYear(adultYear);
  const requestedRetirement = validYear(retirementYear);
  const warnings = [];
  const histories = resolveHistories({
    earlyChildhoodHistory,
    higherEducationHistory,
    graduateEducationHistory,
    higherEdYear,
    higherEdType,
    graduateYear,
    graduateType,
  });

  const earlyRows = normalizeRowsForModel({
    rows: histories.earlyChildhoodHistory,
    types: EARLY_CHILDHOOD_TYPES,
    fallbackType: "kindergarten",
    label: "幼保の",
    kind: "early",
    warnings,
  });

  const elementaryStart = cohortBirth + 7;

  const usableEarlyRows = earlyRows
    .filter((entry) => {
      if (entry.start < birth) {
        warnings.push("幼保の開始年は出生年以後にしてください。");
        return false;
      }
      if (entry.start >= elementaryStart) {
        warnings.push("幼保の開始年は小学校入学前にしてください。");
        return false;
      }
      return true;
    })
    .map((entry) => {
      if (entry.end >= elementaryStart) {
        warnings.push(
          "幼保の期間が小学校入学年以後に重なるため、小学校入学前年までとして表示します。"
        );
        return { ...entry, end: elementaryStart - 1 };
      }
      return entry;
    })
    .sort((a, b) => a.start - b.start);

  for (let i = 1; i < usableEarlyRows.length; i += 1) {
    if (usableEarlyRows[i].start <= usableEarlyRows[i - 1].end) {
      warnings.push(
        "幼保の期間が重なっています。後から始まる設定を優先して表示します。"
      );
      break;
    }
  }

  const higherRows = normalizeRowsForModel({
    rows: histories.higherEducationHistory,
    types: HIGHER_ED_TYPES,
    fallbackType: "university",
    label: "大学等の",
    kind: "higher",
    warnings,
  });
  const graduateRows = normalizeRowsForModel({
    rows: histories.graduateEducationHistory,
    types: GRADUATE_TYPES,
    fallbackType: "masters",
    label: "大学院の",
    kind: "graduate",
    warnings,
  });

  const educationRows = [...higherRows, ...graduateRows].sort(
    (a, b) => a.start - b.start || (a.kind === "higher" ? -1 : 1)
  );

  for (let i = 1; i < educationRows.length; i += 1) {
    const previous = educationRows[i - 1];
    const current = educationRows[i];
    if (current.start <= previous.end) {
      warnings.push(
        "教育期間が重なっています。後から始まる設定を優先して表示します。"
      );
      break;
    }
  }

  if (adultYear !== "" && explicitAdult == null) {
    warnings.push(`成人期の開始年を${YEAR_MIN}〜${YEAR_MAX}年で指定してください。`);
  }

  let stages;

  if (usableEarlyRows.length === 0) {
    if (earlyHistoryWasExplicit) {
      // 明示的な空配列は「幼保を未設定に戻す」というユーザー操作。
      stages = [
        stage(
          "infant",
          "幼児期",
          birth,
          elementaryStart - 1,
          "#b0771e",
          "#fdf3e0"
        ),
      ];
    } else {
      // 配列形式以前の呼び出しとの互換用。
      stages = [
        stage("infant", "幼児期", birth, cohortBirth + 4, "#b0771e", "#fdf3e0"),
        stage("kindergarten", "幼稚園", cohortBirth + 5, cohortBirth + 6, "#b87835", "#fbefdf"),
      ];
    }
  } else {
    // 実際の幼保歴が設定された場合は、それを標準表示より優先する。
    stages = [
      stage(
        "infant",
        "幼児期",
        birth,
        elementaryStart - 1,
        "#b0771e",
        "#fdf3e0"
      ),
    ];

    usableEarlyRows.forEach((entry, sequence) => {
      stages = truncateBefore(stages, entry.start);

      const previousEnd = stages.at(-1)?.to ?? birth - 1;

      addStage(
        stages,
        stage(
          `infant-gap-${sequence}`,
          "幼児期",
          previousEnd + 1,
          entry.start - 1,
          "#b0771e",
          "#fdf3e0"
        )
      );

      const config =
        EARLY_CHILDHOOD_TYPES[entry.type] ??
        EARLY_CHILDHOOD_TYPES.kindergarten;

      addStage(
        stages,
        stage(
          `early-${sequence}`,
          config.stageLabel,
          entry.start,
          entry.end,
          "#b87835",
          "#fbefdf"
        )
      );
    });

    const previousEnd = stages.at(-1)?.to ?? birth - 1;

    addStage(
      stages,
      stage(
        "infant-after-early",
        "幼児期",
        previousEnd + 1,
        elementaryStart - 1,
        "#b0771e",
        "#fdf3e0"
      )
    );
  }

  stages.push(
    stage("elem", "小学校", cohortBirth + 7, cohortBirth + 12, "#c2452d", "#fdeae5"),
    stage("jhs", "中学校", cohortBirth + 13, cohortBirth + 15, "#1f7a4d", "#e6f5ec"),
    stage("hs", "高校", cohortBirth + 16, cohortBirth + 18, "#1e5fa8", "#e7f0fb")
  );

  educationRows.forEach((entry, sequence) => {
    stages = truncateBefore(stages, entry.start);
    const previousEnd = stages.at(-1)?.to ?? birth - 1;
    addGap(
      stages,
      previousEnd + 1,
      entry.start - 1,
      entry.kind === "graduate"
        ? "大学院に入学する前"
        : "大学等に入学する前"
    );

    if (entry.kind === "graduate") {
      addGraduateStages(stages, entry, sequence);
    } else {
      addHigherStage(stages, entry, sequence);
    }
  });

  const automaticAdultYear = educationRows.length > 0
    ? Math.max(...educationRows.map((entry) => entry.end)) + 1
    : cohortBirth + 19;
  const resolvedAdultYear = explicitAdult ?? automaticAdultYear;
  const retirement =
    requestedRetirement != null && requestedRetirement >= resolvedAdultYear
      ? requestedRetirement
      : null;

  if (
    retirementYear !== "" &&
    requestedRetirement != null &&
    requestedRetirement < resolvedAdultYear
  ) {
    warnings.push("定年退職年は成人期の開始年以後にしてください。");
  } else if (
    retirementYear !== "" &&
    requestedRetirement == null
  ) {
    warnings.push(`定年退職年を${YEAR_MIN}〜${YEAR_MAX}年で指定してください。`);
  }

  if (
    explicitAdult != null &&
    educationRows.some((entry) => entry.start >= explicitAdult)
  ) {
    warnings.push(
      "成人期の開始年以後に教育期間があります。成人期の開始年を優先し、それ以後の教育期間は表示しません。"
    );
  }

  stages = truncateBefore(stages, resolvedAdultYear);
  const educationEnd = stages.at(-1)?.to ?? birth - 1;
  addGap(stages, educationEnd + 1, resolvedAdultYear - 1, "次の段階に進む前");
  addStage(
    stages,
    stage(
      "adult",
      "成人期",
      resolvedAdultYear,
      retirement == null ? Infinity : retirement - 1,
      "#37414f",
      "#eef1f5"
    )
  );
  if (retirement != null) {
    addStage(
      stages,
      stage(
        "retired",
        "自由人",
        retirement,
        Infinity,
        "#37414f",
        "#eef1f5"
      )
    );
  }

  const preStage = stage(
    "pre",
    "生まれる前",
    -Infinity,
    birth - 1,
    "#8a8f98",
    "#f1f2f4"
  );

  function stageOf(year) {
    if (year < birth) return preStage;
    return stages.find((item) => year >= item.from && year <= item.to)
      ?? stages.at(-1);
  }

  function gradeLabel(year) {
    const age = year - birth;
    if (age < 0) return `${-age}年前`;
    const item = stageOf(year);
    if (item.key === "elem") return `小${year - item.from + 1}`;
    if (item.key === "jhs") return `中${year - item.from + 1}`;
    if (item.key === "hs") return `高${year - item.from + 1}`;
    if (item.gradePrefix) {
      return `${item.gradePrefix}${year - item.from + 1}`;
    }
    return `${age}歳`;
  }

  return {
    stages: [preStage, ...stages],
    stageOf,
    gradeLabel,
    cohortBirth,
    adultYear: resolvedAdultYear,
    retirementYear: retirement,
    earlyChildhoodHistory: histories.earlyChildhoodHistory,
    higherEducationHistory: histories.higherEducationHistory,
    graduateEducationHistory: histories.graduateEducationHistory,
    warnings: [...new Set(warnings)],
  };
}
