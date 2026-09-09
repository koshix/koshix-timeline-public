import {
  EDUCATION_TYPES,
  educationForKind,
  normalizeEducation,
} from "./education-history.js";
import { validateAdultPeriods } from "./adult-periods.js";

export const LIFE_SETTINGS_FORMAT = "koshix-timeline-life-settings";
export const LIFE_SETTINGS_VERSION = 3;

const HEADER = [
  "section",
  "start",
  "end",
  "years",
  "type",
  "label",
  "value",
];

const YEAR_MIN = 1930;
const YEAR_MAX = 2100;

const cleanCell = (value) =>
  String(value ?? "")
    .replace(/\t/g, " ")
    .replace(/\r?\n/g, " ")
    .trim();

const isObject = (value) =>
  value !== null &&
  typeof value === "object" &&
  !Array.isArray(value);

export function createInitialEducationSettings(
  saved = {},
  defaults = {},
  birth,
  month
) {
  const cohortBirth =
    month >= 1 && month <= 3
      ? birth - 1
      : birth;

  const savedEducation =
    Array.isArray(saved.education)
      ? saved.education
      : null;

  let education =
    savedEducation !== null
      ? normalizeEducation(savedEducation)
      : normalizeEducation(defaults.education);

  if (
    savedEducation === null &&
    educationForKind(
      education,
      "early"
    ).length === 0
  ) {
    education = [
      {
        start: String(cohortBirth + 5),
        years: "2",
        type: "kindergarten",
      },
      ...education,
    ];
  }

  return education;
}

const parseYear = (value, label) => {
  const year = Number(value);

  if (
    !Number.isInteger(year) ||
    year < YEAR_MIN ||
    year > YEAR_MAX
  ) {
    throw new Error(
      `${label}を${YEAR_MIN}〜${YEAR_MAX}年で指定してください。`
    );
  }

  return year;
};

const normalizeEducationRows = (rows) => {
  if (rows == null) return [];

  if (!Array.isArray(rows)) {
    throw new Error(
      "教育歴は配列で指定してください。"
    );
  }

  return rows.map((row, index) => {
    if (!isObject(row)) {
      throw new Error(
        `教育歴の${index + 1}行目が不正です。`
      );
    }

    const start = parseYear(
      row.start,
      `教育歴の${index + 1}行目の開始年`
    );
    const years = Number(row.years);
    const type = cleanCell(row.type);

    if (
      !Number.isInteger(years) ||
      years < 1
    ) {
      throw new Error(
        `教育歴の${index + 1}行目の在年数を1以上の整数で指定してください。`
      );
    }

    if (start + years - 1 > YEAR_MAX) {
      throw new Error(
        `教育歴の${index + 1}行目の終了年が${YEAR_MAX}年を超えます。`
      );
    }

    if (
      !Object.hasOwn(
        EDUCATION_TYPES,
        type
      )
    ) {
      throw new Error(
        `教育歴の${index + 1}行目の種類 "${type}" は不正です。`
      );
    }

    return {
      start: String(start),
      years: String(years),
      type,
    };
  });
};

const normalizeAdultRows = (rows) => {
  if (rows == null) return [];

  if (!Array.isArray(rows)) {
    throw new Error(
      "成人期の期間設定は配列で指定してください。"
    );
  }

  const { periods, errors } =
    validateAdultPeriods(rows);

  if (errors.length > 0) {
    throw new Error(errors.join("\n"));
  }

  return periods.map((period) => ({
    start: String(period.start),
    end:
      period.end == null
        ? ""
        : String(period.end),
    label: period.label,
  }));
};

export function createLifeSettingsSnapshot(
  saved = {}
) {
  if (!isObject(saved)) {
    throw new Error("人生設定が不正です。");
  }

  const birth = parseYear(
    saved.birth,
    "生年"
  );

  const month = Number(saved.month ?? 0);

  if (
    !Number.isInteger(month) ||
    month < 0 ||
    month > 12
  ) {
    throw new Error(
      "出生月を0〜12で指定してください。"
    );
  }

  return {
    birth,
    month,
    education:
      normalizeEducationRows(
        saved.education
      ),
    adultPeriods:
      normalizeAdultRows(
        saved.adultPeriods
      ),
  };
}

const educationLines = (rows) =>
  rows.map((row) => [
    "education",
    row.start,
    "",
    row.years,
    row.type,
    EDUCATION_TYPES[row.type]?.stageLabel ??
      EDUCATION_TYPES[row.type]?.label ??
      "",
    "",
  ]);

export function serializeLifeSettingsTsv(
  saved
) {
  const life =
    createLifeSettingsSnapshot(saved);

  const rows = [
    [
      "profile",
      "",
      "",
      "",
      "",
      "format",
      LIFE_SETTINGS_FORMAT,
    ],
    [
      "profile",
      "",
      "",
      "",
      "",
      "version",
      String(LIFE_SETTINGS_VERSION),
    ],
    [
      "profile",
      "",
      "",
      "",
      "",
      "birth_year",
      String(life.birth),
    ],
    [
      "profile",
      "",
      "",
      "",
      "",
      "birth_month",
      String(life.month),
    ],
    ...educationLines(
      life.education
    ),
    ...life.adultPeriods.map(
      (period) => [
        "adult",
        period.start,
        period.end,
        "",
        "",
        period.label,
        "",
      ]
    ),
  ];

  return [
    HEADER.join("\t"),
    ...rows.map((row) =>
      row.map(cleanCell).join("\t")
    ),
  ].join("\n") + "\n";
}

export function parseLifeSettingsTsv(
  text
) {
  const source = String(text ?? "")
    .replace(/^\uFEFF/, "")
    .replace(/\r\n?/g, "\n");

  const lines = source
    .split("\n")
    .filter((line) => line.trim() !== "");

  if (lines.length === 0) {
    throw new Error(
      "人生設定TSVが空です。"
    );
  }

  const header =
    lines[0].split("\t");

  if (
    header.length !== HEADER.length ||
    !HEADER.every(
      (cell, index) =>
        header[index] === cell
    )
  ) {
    throw new Error(
      `1行目は ${HEADER.join("<TAB>")} にしてください。`
    );
  }

  const profile = {};
  const education = [];
  const adult = [];

  lines.slice(1).forEach(
    (line, index) => {
      const lineNo = index + 2;
      const cells = line.split("\t");

      if (
        cells.length !== HEADER.length
      ) {
        throw new Error(
          `${lineNo}行目: ${HEADER.length}列で入力してください。`
        );
      }

      const [
        section,
        start,
        end,
        years,
        type,
        label,
        value,
      ] = cells;

      if (section === "profile") {
        if (!label) {
          throw new Error(
            `${lineNo}行目: profile の項目名がありません。`
          );
        }

        profile[label] = value;
        return;
      }

      if (section === "education") {
        education.push({
          start,
          years,
          type,
        });
        return;
      }

      if (section === "adult") {
        adult.push({
          start,
          end,
          label,
        });
        return;
      }

      throw new Error(
        `${lineNo}行目: section "${section}" は不正です。`
      );
    }
  );

  if (
    profile.format !==
    LIFE_SETTINGS_FORMAT
  ) {
    throw new Error(
      `format は "${LIFE_SETTINGS_FORMAT}" にしてください。`
    );
  }

  if (
    Number(profile.version) !==
    LIFE_SETTINGS_VERSION
  ) {
    throw new Error(
      `対応していないversionです: ${profile.version}`
    );
  }

  return createLifeSettingsSnapshot({
    birth: profile.birth_year,
    month: profile.birth_month,
    education,
    adultPeriods: adult,
  });
}

export function mergeLifeSettings(
  current,
  snapshot
) {
  const next = isObject(current)
    ? { ...current }
    : {};

  const life =
    createLifeSettingsSnapshot(
      snapshot
    );

  return {
    ...next,
    birth: life.birth,
    month: life.month,
    education:
      life.education,
    adultPeriods:
      life.adultPeriods,
  };
}
