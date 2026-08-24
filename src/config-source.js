const BUILTIN_CONFIG = {
  title: "自分史プロジェクション",
  hashtag: "#自分史プロジェクション",
  shareUrl: "",
  defaults: {
    birthYear: 1965,
    birthMonth: 0,
    higherEdYear: "",
    higherEdType: "university",
    graduateYear: "",
    graduateType: "masters",
    adultYear: "",
    retirementYear: "",
  },
};

let currentConfig = {
  ...BUILTIN_CONFIG,
  defaults: { ...BUILTIN_CONFIG.defaults },
};

function numberOr(value, fallback) {
  if (value === "" || value == null) return fallback;
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function yearOrBlank(value) {
  if (value === "" || value == null) return "";
  const n = Number(value);
  return Number.isFinite(n) ? String(n) : "";
}

function choiceOr(value, choices, fallback) {
  return choices.includes(value) ? value : fallback;
}

function normalizeConfig(raw) {
  const defaults = raw?.defaults ?? {};
  const normalizedDefaults = {
    birthYear: numberOr(
      defaults.birthYear,
      BUILTIN_CONFIG.defaults.birthYear
    ),
    birthMonth: numberOr(
      defaults.birthMonth,
      BUILTIN_CONFIG.defaults.birthMonth
    ),
    higherEdYear: yearOrBlank(defaults.higherEdYear),
    higherEdType: choiceOr(
      defaults.higherEdType,
      ["university", "vocational", "kosen", "medical"],
      BUILTIN_CONFIG.defaults.higherEdType
    ),
    graduateYear: yearOrBlank(defaults.graduateYear),
    graduateType: choiceOr(
      defaults.graduateType,
      ["masters", "mastersDoctorate"],
      BUILTIN_CONFIG.defaults.graduateType
    ),
    adultYear: yearOrBlank(defaults.adultYear),
    retirementYear: yearOrBlank(defaults.retirementYear),
  };

  // 旧config.jsonから新しい入力方式へ移行するため、存在する旧項目だけ残す。
  if (typeof defaults.path === "string" && defaults.path) {
    normalizedDefaults.path = defaults.path;
    normalizedDefaults.roninYears = numberOr(defaults.roninYears, 0);
    normalizedDefaults.ryunenYears = numberOr(defaults.ryunenYears, 0);
  }

  return {
    title:
      typeof raw?.title === "string" && raw.title.trim()
        ? raw.title.trim()
        : BUILTIN_CONFIG.title,

    hashtag:
      typeof raw?.hashtag === "string"
        ? raw.hashtag.trim()
        : BUILTIN_CONFIG.hashtag,

    shareUrl:
      typeof raw?.shareUrl === "string"
        ? raw.shareUrl.trim()
        : BUILTIN_CONFIG.shareUrl,

    defaults: normalizedDefaults,
  };
}

export async function prepareConfig() {
  const res = await fetch(
    `${import.meta.env.BASE_URL}config.json`,
    { cache: "no-store" }
  );

  if (res.status === 404) {
    console.warn("config.json がないため、内蔵設定を使用します");
    return;
  }

  if (!res.ok) {
    throw new Error(`config.json の読み込みに失敗しました: HTTP ${res.status}`);
  }

  let raw;

  try {
    raw = await res.json();
  } catch (err) {
    throw new Error(`config.json のJSON形式が不正です: ${err.message}`);
  }

  currentConfig = normalizeConfig(raw);

  if (typeof document !== "undefined") {
    document.title = currentConfig.title;
  }

  console.info(`Runtime config loaded: ${currentConfig.title}`);
}

export function loadConfig() {
  return currentConfig;
}
