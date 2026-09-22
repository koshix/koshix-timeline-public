import {
  loadConfig,
} from "./config-source.js";
import {
  loadEvents,
} from "./events-source.js";
import {
  createInitialEducationSettings,
} from "./life-settings.js";
import {
  workspaceStore,
} from "./workspace-store.js";

const DEFAULT_APP_TITLE =
  "自分史プロジェクション";
const DEFAULT_HASHTAG =
  "#自分史プロジェクション";

export function resolveAppShareUrl(
  config = {},
  location = null
) {
  const configured = String(
    config?.shareUrl || ""
  ).trim();

  if (configured) {
    return configured;
  }

  if (!location) {
    return "";
  }

  return `${location.origin}${location.pathname}`;
}

export function createAppRuntimeState({
  config = {},
  events = [],
  saved = {},
  location = null,
  settingsStorageStatus = "ok",
} = {}) {
  const savedSettings =
    saved &&
    typeof saved === "object" &&
    !Array.isArray(saved)
      ? saved
      : {};

  const defaults =
    config?.defaults &&
    typeof config.defaults === "object"
      ? config.defaults
      : {};

  const initialBirth =
    savedSettings.birth ??
    defaults.birthYear ??
    null;

  const initialMonth =
    savedSettings.month ??
    defaults.birthMonth ??
    0;

  return {
    config,
    events,
    saved: savedSettings,
    initialBirth,
    initialMonth,
    initialEducation:
      createInitialEducationSettings(
        savedSettings,
        defaults
      ),
    initialAdultPeriods:
      Array.isArray(
        savedSettings.adultPeriods
      )
        ? savedSettings.adultPeriods
        : [],
    appTitle:
      config?.title ||
      DEFAULT_APP_TITLE,
    hashtag:
      config?.hashtag ??
      DEFAULT_HASHTAG,
    shareUrl: resolveAppShareUrl(
      config,
      location
    ),
    showBeginnerGuide:
      savedSettings.beginnerGuideSeen !== true,
    settingsStorageStatus,
    settingsAutoSaveEnabled:
      settingsStorageStatus === "ok" ||
      settingsStorageStatus === "missing" ||
      settingsStorageStatus === "obsolete",
  };
}

export function loadAppRuntimeState() {
  const config = loadConfig();
  const events = loadEvents();

  const settingsStorage =
    typeof window !== "undefined"
      ? workspaceStore.settings.read()
      : {
          status: "unavailable",
          data: null,
          error: null,
        };

  if (
    settingsStorage.error &&
    (
      settingsStorage.status === "future" ||
      settingsStorage.status === "invalid" ||
      settingsStorage.status === "unavailable"
    )
  ) {
    console.warn(
      "Browser settings were not loaded; automatic saving is disabled:",
      settingsStorage.error
    );
  }

  const saved =
    settingsStorage.data || {};

  const location =
    typeof window !== "undefined"
      ? window.location
      : null;

  return createAppRuntimeState({
    config,
    events,
    saved,
    location,
    settingsStorageStatus:
      settingsStorage.status,
  });
}
