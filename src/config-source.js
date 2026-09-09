import {
  normalizeEducation,
} from "./education-history.js";

const BUILTIN_CONFIG = {
  title: "自分史プロジェクション",
  hashtag: "#自分史プロジェクション",
  shareUrl: "",
  downloadUrl: "",
  publicSourceUrl: "",
  accessStats: {
    endpoint: "",
    pageUrl: "",
  },
  defaults: {
    birthYear: null,
    birthMonth: 0,
    education: [],
  },
};

let currentConfig = {
  ...BUILTIN_CONFIG,
  accessStats: { ...BUILTIN_CONFIG.accessStats },
  defaults: { ...BUILTIN_CONFIG.defaults },
};

function numberOr(value, fallback) {
  if (value === "" || value == null) return fallback;
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
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
    education: normalizeEducation(
      defaults.education
    ),
  };

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

    downloadUrl:
      typeof raw?.downloadUrl === "string"
        ? raw.downloadUrl.trim()
        : BUILTIN_CONFIG.downloadUrl,

    publicSourceUrl:
      typeof raw?.publicSourceUrl === "string"
        ? raw.publicSourceUrl.trim()
        : BUILTIN_CONFIG.publicSourceUrl,

    accessStats: {
      endpoint:
        typeof raw?.accessStats?.endpoint === "string"
          ? raw.accessStats.endpoint.trim()
          : BUILTIN_CONFIG.accessStats.endpoint,
      pageUrl:
        typeof raw?.accessStats?.pageUrl === "string"
          ? raw.accessStats.pageUrl.trim()
          : BUILTIN_CONFIG.accessStats.pageUrl,
    },

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
