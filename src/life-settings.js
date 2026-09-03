import {
  EARLY_CHILDHOOD_TYPES,
  HIGHER_ED_TYPES,
  GRADUATE_TYPES,
} from "./education-history.js";
import { validateAdultPeriods } from "./adult-periods.js";

export const LIFE_SETTINGS_FORMAT = "koshix-timeline-life-settings";
export const LIFE_SETTINGS_VERSION = 1;

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

const normalizeEducationRows = (
  rows,
  types,
  label
) => {
  if (rows == null) return [];

  if (!Array.isArray(rows)) {
    throw new Error(`${label}は配列で指定してください。`);
  }

  return rows.map((row, index) => {
    if (!isObject(row)) {
      throw new Error(
        `${label}の${index + 1}行目が不正です。`
      );
    }

    const start = parseYear(
      row.start,
      `${label}の${index + 1}行目の開始年`
    );
    const years = Number(row.years);
    const type = cleanCell(row.type);

    if (
      !Number.isInteger(years) ||
      years < 1 ||
      years > 50
    ) {
      throw new Error(
        `${label}の${index + 1}行目の在年数を1〜50年で指定してください。`
      );
    }

    if (!Object.hasOwn(types, type)) {
      throw new Error(
        `${label}の${index + 1}行目の種類 "${type}" は不正です。`
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
    start: String(period.from),
    end:
      period.to == null
        ? ""
        : String(period.to),
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
    earlyChildhoodHistory:
      normalizeEducationRows(
        saved.earlyChildhoodHistory,
        EARLY_CHILDHOOD_TYPES,
        "幼稚園・保育所歴"
      ),
    higherEducationHistory:
      normalizeEducationRows(
        saved.higherEducationHistory,
        HIGHER_ED_TYPES,
        "大学等の履歴"
      ),
    graduateEducationHistory:
      normalizeEducationRows(
        saved.graduateEducationHistory,
        GRADUATE_TYPES,
        "大学院履歴"
      ),
    adultPeriodsEnabled:
      Boolean(saved.adultPeriodsEnabled),
    adultPeriods:
      normalizeAdultRows(
        saved.adultPeriods
      ),
  };
}

const educationLines = (
  section,
  rows,
  types
) =>
  rows.map((row) => [
    section,
    row.start,
    "",
    row.years,
    row.type,
    types[row.type]?.stageLabel ??
      types[row.type]?.label ??
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
    [
      "profile",
      "",
      "",
      "",
      "",
      "adult_periods_enabled",
      life.adultPeriodsEnabled
        ? "1"
        : "0",
    ],
    ...educationLines(
      "early",
      life.earlyChildhoodHistory,
      EARLY_CHILDHOOD_TYPES
    ),
    ...educationLines(
      "higher",
      life.higherEducationHistory,
      HIGHER_ED_TYPES
    ),
    ...educationLines(
      "graduate",
      life.graduateEducationHistory,
      GRADUATE_TYPES
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
  const early = [];
  const higher = [];
  const graduate = [];
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

      if (section === "early") {
        early.push({
          start,
          years,
          type,
        });
        return;
      }

      if (section === "higher") {
        higher.push({
          start,
          years,
          type,
        });
        return;
      }

      if (section === "graduate") {
        graduate.push({
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

  if (
    profile.adult_periods_enabled !==
      "0" &&
    profile.adult_periods_enabled !==
      "1"
  ) {
    throw new Error(
      "adult_periods_enabled は0または1にしてください。"
    );
  }

  return createLifeSettingsSnapshot({
    birth: profile.birth_year,
    month: profile.birth_month,
    earlyChildhoodHistory: early,
    higherEducationHistory: higher,
    graduateEducationHistory:
      graduate,
    adultPeriodsEnabled:
      profile.adult_periods_enabled ===
      "1",
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

  [
    "path",
    "ronin",
    "ryunen",
    "higherEdYear",
    "higherEdType",
    "graduateYear",
    "graduateType",
    "adultYear",
    "adultY",
    "retirementYear",
    "retirementY",
  ].forEach((key) => {
    delete next[key];
  });

  return {
    ...next,
    birth: life.birth,
    month: life.month,
    earlyChildhoodHistory:
      life.earlyChildhoodHistory,
    higherEducationHistory:
      life.higherEducationHistory,
    graduateEducationHistory:
      life.graduateEducationHistory,
    adultPeriodsEnabled:
      life.adultPeriodsEnabled,
    adultPeriods:
      life.adultPeriods,
  };
}
