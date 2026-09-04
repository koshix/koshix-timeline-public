import {
  EARLY_CHILDHOOD_TYPES,
  GRADUATE_TYPES,
  HIGHER_ED_TYPES,
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
  adultYear = "",
}) {
  const cohortBirth = month >= 1 && month <= 3 ? birth - 1 : birth;
  const earlyHistoryWasExplicit = Array.isArray(earlyChildhoodHistory);
  const explicitAdult = validYear(adultYear);
  const warnings = [];
  const histories = {
    earlyChildhoodHistory: Array.isArray(earlyChildhoodHistory)
      ? earlyChildhoodHistory
      : [],
    higherEducationHistory: Array.isArray(higherEducationHistory)
      ? higherEducationHistory
      : [],
    graduateEducationHistory: Array.isArray(graduateEducationHistory)
      ? graduateEducationHistory
      : [],
  };

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
      Infinity,
      "#37414f",
      "#eef1f5"
    )
  );
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
    earlyChildhoodHistory: histories.earlyChildhoodHistory,
    higherEducationHistory: histories.higherEducationHistory,
    graduateEducationHistory: histories.graduateEducationHistory,
    warnings: [...new Set(warnings)],
  };
}
