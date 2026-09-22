import { useMemo } from "react";
import {
  loadAppRuntimeState,
} from "./app-runtime.js";
import { buildTimelineLifeContext } from "./timeline-model.js";
import { THREADS } from "./threads.js";
import {
  buildConfiguredThreads,
} from "./thread-model.js";
import useLifeSettings from "./useLifeSettings.js";
import ThreadWindow from "./ThreadWindow.jsx";

const {
  events: EVENTS,
  initialBirth: INITIAL_BIRTH,
  initialMonth: INITIAL_MONTH,
  initialEducation: INITIAL_EDUCATION,
  initialAdultPeriods: INITIAL_ADULT_PERIODS,
  appTitle: APP_TITLE,
  hashtag: HASHTAG,
  shareUrl: SHARE_URL,
} = loadAppRuntimeState();

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
  const {
    birth,
    month,
    education,
    adultPeriods,
  } = useLifeSettings({
    initialBirth: INITIAL_BIRTH,
    initialMonth: INITIAL_MONTH,
    initialEducation: INITIAL_EDUCATION,
    savedAdultPeriods: INITIAL_ADULT_PERIODS,
  });

  const life = useMemo(
    () =>
      buildTimelineLifeContext({
        birth,
        month,
        education,
        adultPeriods,
      }).life,
    [
      birth,
      month,
      education,
      adultPeriods,
    ]
  );

  return (
    <ThreadWindow
      appTitle={APP_TITLE}
      configuredThreads={CONFIGURED_THREADS}
      events={EVENTS}
      gradeLabel={life.gradeLabel}
      birth={birth}
      hashtag={HASHTAG}
      shareUrl={SHARE_URL}
      initialQuery={INITIAL_DYNAMIC_QUERY}
      openSharedDynamic={OPEN_SHARED_DYNAMIC}
    />
  );
}
