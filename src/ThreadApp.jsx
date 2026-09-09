import { useMemo } from "react";
import { loadConfig } from "./config-source.js";
import { loadEvents } from "./events-source.js";
import { createInitialEducationSettings } from "./life-settings.js";
import { buildTimelineLifeContext } from "./timeline-model.js";
import { workspaceStore } from "./workspace-store.js";
import { THREADS } from "./threads.js";
import {
  buildConfiguredThreads,
} from "./thread-model.js";
import ThreadWindow from "./ThreadWindow.jsx";

const CONFIG = loadConfig();
const PROFILE_DEFAULTS = CONFIG.defaults || {};
const EVENTS = loadEvents();
const SAVED =
  (typeof window !== "undefined" &&
    workspaceStore.settings.load()) ||
  {};

const INITIAL_BIRTH =
  SAVED.birth ?? PROFILE_DEFAULTS.birthYear ?? null;
const INITIAL_MONTH =
  SAVED.month ?? PROFILE_DEFAULTS.birthMonth ?? 0;
const INITIAL_EDUCATION = createInitialEducationSettings(
  SAVED,
  PROFILE_DEFAULTS,
  INITIAL_BIRTH,
  INITIAL_MONTH
);
const INITIAL_ADULT_PERIODS = Array.isArray(
  SAVED.adultPeriods
)
  ? SAVED.adultPeriods
  : [];

const APP_TITLE =
  CONFIG.title || "自分史プロジェクション";
const HASHTAG =
  CONFIG.hashtag ?? "#自分史プロジェクション";

const SHARE_URL = (() => {
  const configured = String(
    CONFIG.shareUrl || ""
  ).trim();

  if (configured) return configured;
  if (typeof window === "undefined") return "";

  const { origin, pathname } = window.location;
  return origin + pathname;
})();

const THREAD_QUERY =
  typeof window !== "undefined"
    ? new URLSearchParams(window.location.search)
    : new URLSearchParams();
const INITIAL_DYNAMIC_QUERY = THREAD_QUERY.get("q") || "";
const OPEN_SHARED_DYNAMIC = THREAD_QUERY.get("play") === "1";

const CONFIGURED_THREADS = buildConfiguredThreads(
  THREADS,
  EVENTS
);

export default function ThreadApp() {
  const life = useMemo(
    () =>
      buildTimelineLifeContext({
        birth: INITIAL_BIRTH,
        month: INITIAL_MONTH,
        education: INITIAL_EDUCATION,
        adultPeriods: INITIAL_ADULT_PERIODS,
      }).life,
    []
  );

  return (
    <ThreadWindow
      appTitle={APP_TITLE}
      configuredThreads={CONFIGURED_THREADS}
      events={EVENTS}
      gradeLabel={life.gradeLabel}
      birth={INITIAL_BIRTH}
      hashtag={HASHTAG}
      shareUrl={SHARE_URL}
      initialQuery={INITIAL_DYNAMIC_QUERY}
      openSharedDynamic={OPEN_SHARED_DYNAMIC}
    />
  );
}
