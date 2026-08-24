export const HIGHER_ED_TYPES = {
  university: {
    label: "大学・4年",
    stageLabel: "大学生",
    years: 4,
    gradePrefix: "大",
  },
  vocational: {
    label: "短大・専門・2〜3年",
    stageLabel: "短大・専門",
    years: 2,
    flexibleYears: [2, 3],
    gradePrefix: "専",
  },
  kosen: {
    label: "高専・5年",
    stageLabel: "高専生",
    years: 5,
    gradePrefix: "高専",
  },
  medical: {
    label: "医歯薬獣医・6年",
    stageLabel: "大学生（6年制）",
    years: 6,
    gradePrefix: "大",
  },
};

export const GRADUATE_TYPES = {
  masters: { label: "修士", years: 2 },
  mastersDoctorate: { label: "修士＋博士", years: 5 },
};

const YEAR_MIN = 1930;
const YEAR_MAX = 2100;

export function validYear(value) {
  if (value === "" || value == null) return null;
  const year = Number(value);
  return Number.isInteger(year) && year >= YEAR_MIN && year <= YEAR_MAX
    ? year
    : null;
}

const stage = (key, label, from, to, color, bg) => ({
  key,
  label,
  from,
  to,
  color,
  bg,
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

function higherEducationYears(type, startYear, nextYear) {
  const config = HIGHER_ED_TYPES[type] ?? HIGHER_ED_TYPES.university;

  if (
    config.flexibleYears &&
    nextYear != null &&
    config.flexibleYears.includes(nextYear - startYear)
  ) {
    return nextYear - startYear;
  }

  return config.years;
}

export function migrateEducationSettings(saved, defaults, birth, month) {
  const newKeys = [
    "higherEdYear",
    "higherEdType",
    "graduateYear",
    "graduateType",
    "adultYear",
    "retirementYear",
  ];
  const savedHasNewSettings = newKeys.some((key) => Object.hasOwn(saved, key));
  const savedHasLegacySettings = ["path", "ronin", "ryunen"].some(
    (key) => Object.hasOwn(saved, key)
  );
  const defaultsHaveNewSettings = newKeys.some(
    (key) => Object.hasOwn(defaults, key)
  );
  const defaultsHaveLegacySettings = Object.hasOwn(defaults, "path");
  const hasNewSettings =
    savedHasNewSettings ||
    (!savedHasLegacySettings &&
      !defaultsHaveLegacySettings &&
      defaultsHaveNewSettings);

  if (hasNewSettings) {
    return {
      higherEdYear: saved.higherEdYear ?? defaults.higherEdYear ?? "",
      higherEdType:
        saved.higherEdType ?? defaults.higherEdType ?? "university",
      graduateYear: saved.graduateYear ?? defaults.graduateYear ?? "",
      graduateType:
        saved.graduateType ?? defaults.graduateType ?? "masters",
      adultYear:
        saved.adultYear ?? saved.adultY ?? defaults.adultYear ?? "",
      retirementYear:
        saved.retirementYear ??
        saved.retirementY ??
        defaults.retirementYear ??
        "",
    };
  }

  const legacyPath = saved.path ?? defaults.path;
  const legacyRonin = Number(
    saved.ronin ?? defaults.roninYears ?? 0
  );
  const legacyRyunen = Number(
    saved.ryunen ?? defaults.ryunenYears ?? 0
  );
  const cohortBirth = month >= 1 && month <= 3 ? birth - 1 : birth;
  const path = legacyPath || "univ";

  if (path === "hs_job") {
    return {
      higherEdYear: "",
      higherEdType: "university",
      graduateYear: "",
      graduateType: "masters",
      adultYear:
        saved.adultY ?? defaults.adultYear ?? String(cohortBirth + 19),
      retirementYear:
        saved.retirementY ?? defaults.retirementYear ?? "",
    };
  }

  const higherEdType =
    path === "kosen"
      ? "kosen"
      : path === "vocational"
        ? "vocational"
        : path === "univ6"
          ? "medical"
          : "university";
  const higherEdYear =
    cohortBirth + (path === "kosen" ? 16 : 19 + legacyRonin);
  const higherYears = HIGHER_ED_TYPES[higherEdType].years + legacyRyunen;
  const hasGraduate = path === "masters" || path === "phd";
  const graduateYear = hasGraduate ? higherEdYear + higherYears : null;
  const graduateType = path === "phd" ? "mastersDoctorate" : "masters";
  const automaticAdultYear = hasGraduate
    ? graduateYear + GRADUATE_TYPES[graduateType].years
    : higherEdYear + higherYears;
  const legacyAdultYear = saved.adultY ?? defaults.adultYear ?? "";

  return {
    higherEdYear: String(higherEdYear),
    higherEdType,
    graduateYear: graduateYear == null ? "" : String(graduateYear),
    graduateType,
    adultYear:
      legacyAdultYear ||
      (legacyRyunen > 0 ? String(automaticAdultYear) : ""),
    retirementYear:
      saved.retirementY ?? defaults.retirementYear ?? "",
  };
}

export function buildLifeModel({
  birth,
  month,
  higherEdYear,
  higherEdType,
  graduateYear,
  graduateType,
  adultYear,
  retirementYear,
}) {
  const cohortBirth = month >= 1 && month <= 3 ? birth - 1 : birth;
  const higherStart = validYear(higherEdYear);
  const graduateStart = validYear(graduateYear);
  const explicitAdult = validYear(adultYear);
  const requestedRetirement = validYear(retirementYear);
  const higherConfig =
    HIGHER_ED_TYPES[higherEdType] ?? HIGHER_ED_TYPES.university;
  const graduateConfig =
    GRADUATE_TYPES[graduateType] ?? GRADUATE_TYPES.masters;
  const warnings = [];

  if (higherEdYear !== "" && higherStart == null) {
    warnings.push("大学等に入学した年を1930〜2100年で指定してください。");
  }
  if (graduateYear !== "" && graduateStart == null) {
    warnings.push("大学院に入学した年を1930〜2100年で指定してください。");
  }
  if (graduateStart != null && higherStart == null) {
    warnings.push("大学院の年を使うには、大学等に入学した年も指定してください。");
  }
  if (
    graduateStart != null &&
    higherStart != null &&
    graduateStart <= higherStart
  ) {
    warnings.push("大学院に入学した年は、大学等の入学年より後にしてください。");
  }
  if (adultYear !== "" && explicitAdult == null) {
    warnings.push("社会人になった年を1930〜2100年で指定してください。");
  }
  if (
    explicitAdult != null &&
    higherStart != null &&
    explicitAdult <= higherStart
  ) {
    warnings.push("社会人になった年が大学等の入学年以前のため、大学等の期間は表示しません。");
  }
  if (
    explicitAdult != null &&
    graduateStart != null &&
    explicitAdult <= graduateStart
  ) {
    warnings.push("社会人になった年が大学院の入学年以前のため、大学院の期間は表示しません。");
  }

  const usableGraduateStart =
    graduateStart != null &&
    higherStart != null &&
    graduateStart > higherStart
      ? graduateStart
      : null;
  const nextAfterHigher = usableGraduateStart ?? explicitAdult;
  const higherYears = higherStart == null
    ? 0
    : higherEducationYears(higherEdType, higherStart, nextAfterHigher);
  const higherEnd = higherStart == null ? null : higherStart + higherYears - 1;
  const graduateEnd = usableGraduateStart == null
    ? null
    : usableGraduateStart + graduateConfig.years - 1;
  const automaticAdultYear =
    graduateEnd != null
      ? graduateEnd + 1
      : higherEnd != null
        ? higherEnd + 1
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
    warnings.push("定年退職年は社会人になった年以後にしてください。");
  } else if (retirementYear !== "" && requestedRetirement == null) {
    warnings.push("定年退職年を1930〜2100年で指定してください。");
  }

  let stages = [
    stage("infant", "幼少期", birth, cohortBirth + 6, "#b0771e", "#fdf3e0"),
    stage("elem", "小学生", cohortBirth + 7, cohortBirth + 12, "#c2452d", "#fdeae5"),
    stage("jhs", "中学生", cohortBirth + 13, cohortBirth + 15, "#1f7a4d", "#e6f5ec"),
    stage("hs", "高校生", cohortBirth + 16, cohortBirth + 18, "#1e5fa8", "#e7f0fb"),
  ];

  if (higherStart != null) {
    stages = truncateBefore(stages, higherStart);
    const previousEnd = stages.at(-1)?.to ?? birth - 1;
    addGap(stages, previousEnd + 1, higherStart - 1, "大学等に入学する前");
    addStage(
      stages,
      stage(
        "higher",
        higherConfig.stageLabel,
        higherStart,
        higherEnd,
        higherEdType === "kosen" ? "#0f6f8a" : "#6b3fa0",
        higherEdType === "kosen" ? "#e3f1f5" : "#f1e9fa"
      )
    );
  }

  if (usableGraduateStart != null) {
    // 実際の大学院入学年を優先し、標準修業年数と重なる場合は大学等を短縮する。
    stages = truncateBefore(stages, usableGraduateStart);
    const previousEnd = stages.at(-1)?.to ?? birth - 1;
    addGap(stages, previousEnd + 1, usableGraduateStart - 1, "大学院に入学する前");
    addStage(
      stages,
      stage(
        "ms",
        "大学院（修士）",
        usableGraduateStart,
        usableGraduateStart + 1,
        "#4a5fb0",
        "#eaeefb"
      )
    );
    if (graduateType === "mastersDoctorate") {
      addStage(
        stages,
        stage(
          "dr",
          "大学院（博士）",
          usableGraduateStart + 2,
          usableGraduateStart + 4,
          "#31589c",
          "#e5ecf8"
        )
      );
    }
  }

  stages = truncateBefore(stages, resolvedAdultYear);
  const educationEnd = stages.at(-1)?.to ?? birth - 1;
  addGap(stages, educationEnd + 1, resolvedAdultYear - 1, "社会人になる前");
  addStage(
    stages,
    stage(
      "adult",
      "社会人",
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
    if (item.key === "higher") {
      return `${higherConfig.gradePrefix}${year - item.from + 1}`;
    }
    if (item.key === "ms") return `修${year - item.from + 1}`;
    if (item.key === "dr") return `博${year - item.from + 1}`;
    return `${age}歳`;
  }

  return {
    stages: [preStage, ...stages],
    stageOf,
    gradeLabel,
    cohortBirth,
    adultYear: resolvedAdultYear,
    retirementYear: retirement,
    warnings,
  };
}
