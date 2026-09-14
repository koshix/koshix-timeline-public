import { eventYear } from "./event-schema.js";
import { useState, useMemo, useEffect, useRef } from "react";
import { loadEvents } from "./events-source";
import { loadConfig } from "./config-source";
import { applyEventCustomizations } from "./event-customizations";
import { THREADS } from "./threads";
import {
  createInitialEducationSettings,
} from "./life-settings";
import useTimelineModel from "./useTimelineModel";
import usePersonalEvents from "./usePersonalEvents";
import useEventCustomizations from "./useEventCustomizations";
import useLifeSettings from "./useLifeSettings";
import useDisplaySettings from "./useDisplaySettings";
import useOpenEvents from "./useOpenEvents";
import {
  workspaceStore,
} from "./workspace-store.js";
import {
  eventId,
  findEventByShareParam,
} from "./event-links";
import Theater from "./Theater";
import TimelineCustomizationSection from "./TimelineCustomizationSection";
import PersonalHistorySection from "./PersonalHistorySection";
import TimelineSettingsSection from "./TimelineSettingsSection";
import useVisibleEventsExport from "./useVisibleEventsExport";
import useAdministratorData from "./useAdministratorData";
import AppHeader from "./AppHeader";
import AppFooter from "./AppFooter";
import TimelineGroupList from "./TimelineGroupList";
import TimelineViewControls from "./TimelineViewControls";

const CONFIG = loadConfig();
const PROFILE_DEFAULTS = CONFIG.defaults || {};
const EVENTS = loadEvents();
const APP_VERSION = __APP_VERSION__;
const APP_UPDATED_DATE = __APP_UPDATED_DATE__;

const MAIN_CATS = [
  "work",
  "science",
  "education",
  "computer",
  "culture",
  "society",
];

function ImportanceBadge({ level }) {
  const value = Math.max(1, Math.min(3, Number(level) || 2));

  return (
    <span
      role="img"
      aria-label={`重要度 L${value}`}
      title={`重要度 L${value}`}
      style={{
        display: "inline-flex",
        alignItems: "flex-end",
        gap: 2,
        width: 14,
        height: 13,
        flexShrink: 0,
        marginTop: 3,
      }}
    >
      {[1, 2, 3].map((bar) => (
        <span
          key={bar}
          aria-hidden="true"
          style={{
            display: "block",
            width: 3,
            height: 10,
            borderRadius: 1,
            background: bar <= value ? "#59616c" : "#d8dce2",
          }}
        />
      ))}
    </span>
  );
}


const ADULT_STAGE = { key: "adult", label: "成人期", color: "#37414f", bg: "#eef1f5" };

// ---- 成人期の年齢ラベル色 ----
// 30代は従来色を保ち、10歳ごとに少しずつ無彩色・明色側へ移す。
// 70代以降は背景が明るくなるため、文字色を濃いグレーに切り替えて可読性を保つ。
const ADULT_AGE_BADGE = [
  { from: 90, bg: "#e2e4e6", fg: "#4d535a" }, // 90代以降: 淡いシルバー
  { from: 80, bg: "#d0d3d6", fg: "#454b52" }, // 80代: 明るいシルバー
  { from: 70, bg: "#bcc0c4", fg: "#343a40" }, // 70代: シルバー
  { from: 60, bg: "#9ca2a9", fg: "#ffffff" }, // 60代: グレー
  { from: 50, bg: "#7a828c", fg: "#ffffff" }, // 50代: さらに薄い灰青
  { from: 40, bg: "#56606c", fg: "#ffffff" }, // 40代: 少し薄い灰青
  { from: 0,  bg: "#37414f", fg: "#ffffff" }, // 30代まで: 従来色
];

const gradeBadgeStyle = (stage, age) => {
  if (stage?.key !== "adult") {
    return { background: stage?.color || ADULT_STAGE.color, color: "#ffffff" };
  }
  const tone = ADULT_AGE_BADGE.find((x) => age >= x.from) || ADULT_AGE_BADGE.at(-1);
  return { background: tone.bg, color: tone.fg };
};

function formatEventDate(value) {
  const [year, month, day] = String(value ?? "").split("-");
  if (!year) return "";
  return `${Number(year)}年${month ? `${Number(month)}月` : ""}${day ? `${Number(day)}日` : ""}`;
}

// ---- 共有 ----
const APP_TITLE = CONFIG.title || "自分史プロジェクション";
const HASHTAG = CONFIG.hashtag ?? "#自分史プロジェクション";
const DOWNLOAD_URL = String(CONFIG.downloadUrl || "").trim();
const PUBLIC_SOURCE_URL = String(
  CONFIG.publicSourceUrl || ""
).trim();
const PUBLIC_DISTRIBUTION_ENABLED =
  CONFIG.publicDistributionEnabled === true;
const ACCESS_STATS_URL = String(
  CONFIG.accessStats?.pageUrl || ""
).trim();

const SHARE_URL = (() => {
  const configured = String(CONFIG.shareUrl || "").trim();

  if (configured) {
    return configured;
  }

  if (typeof window === "undefined") {
    return "";
  }

  const { origin, pathname } = window.location;
  return origin + pathname;
})();

// ---- テーマでたどる(年表に散らばった項目を、一本の流れとしてたどる) ----
// 永久ID { id } で参照する。
const resolveThreadItem = ({ id }) =>
  EVENTS.find((event) => event.id === id);

const THREAD_LIST = THREADS.map((th) => ({
  ...th,
  events: th.items.map(resolveThreadItem).filter(Boolean),
})).filter((th) => th.events.length > 1);

const findThread = (key) => THREAD_LIST.find((t) => t.key === key) || null;

// ---- 保存(ブラウザのみ。使えない環境では黙ってメモリ動作) ----
const SAVED =
  (typeof window !== "undefined" &&
    workspaceStore.settings.load()) ||
  {};
const SHOW_BEGINNER_GUIDE = SAVED.beginnerGuideSeen !== true;
const INITIAL_BIRTH =
  SAVED.birth ?? PROFILE_DEFAULTS.birthYear ?? null;
const INITIAL_MONTH = SAVED.month ?? PROFILE_DEFAULTS.birthMonth ?? 0;
const INITIAL_EDUCATION = createInitialEducationSettings(
  SAVED,
  PROFILE_DEFAULTS,
  INITIAL_BIRTH,
  INITIAL_MONTH
);

export default function App() {
  const lifeSettings = useLifeSettings({
    initialBirth: INITIAL_BIRTH,
    initialMonth: INITIAL_MONTH,
    initialEducation: INITIAL_EDUCATION,
    savedAdultPeriods: SAVED.adultPeriods,
  });
  const {
    birth,
    month,
    education,
    adultPeriods,
    lifeSettingsSource,
    applyServerLifeSettings,
  } = lifeSettings;

  const {
    isEventOpen,
    toggleEvent,
    openEvent,
    closeEvent,
    openOnlyEvents,
    closeAllEvents,
  } = useOpenEvents();

  const eventCustomization = useEventCustomizations({
    events: EVENTS,
    mainCategories: MAIN_CATS,
    onReplaced: () => {
      closeAllEvents();
    },
    onEventRemoved: (event) => {
      closeEvent(event.id);
    },
  });
  const {
    eventCustomizations,
    editingEventId,
    eventEditDraft,
    startEditingEvent,
    cancelEditingEvent,
    updateEventEditDraft,
    saveEditedEvent,
    deleteAddedEvent,
    hideEvent,
  } = eventCustomization;
  const [showMe, setShowMe] = useState(false);

  const scrollToTimeline = () => {
    document
      .getElementById("timeline-view")
      ?.scrollIntoView({
        behavior: "auto",
        block: "start",
      });
  };

  const scrollToPersonalHistory = () => {
    document.getElementById("personal-history")?.scrollIntoView({
      behavior: "auto",
      block: "start",
    });
  };

  const personalHistory = usePersonalEvents({
    onFirstAdded: () => {
      setShowMe(true);
    },
    onCleared: () => {
      setShowMe(false);
    },
    onDeleted: (event) => {
      closeEvent(eventId(event));
    },
  });
  const {
    myEvents,
    personalEventsSource,
    startEditingPersonalEvent,
    deletePersonalEvent,
    applyServerPersonalEvents,
  } = personalHistory;

  const displaySettings = useDisplaySettings({
    saved: SAVED,
    mainCategories: MAIN_CATS,
  });
  const {
    catOff,
    sfOnly,
    subFilters,
    categoryMatchMode,
    setCategoryMatchMode,
    catOn,
    toggleCat,
    toggleSfOnly,
    toggleSubFilter,
    setAllCats,
    importanceMin,
    setImportanceLevel,
    closedStages,
    toggleStage,
    expandAllStages,
    collapseStages,
    setupOpen,
    closeSetup,
    personalHistoryOpen,
    openPersonalHistory,
    closePersonalHistory,
  } = displaySettings;

  const viewPersonalHistoryFromSetup = () => {
    closeSetup();
    openPersonalHistory();
    setTimeout(scrollToPersonalHistory, 0);
  };

  const viewTimelineFromPersonalHistory = () => {
    closePersonalHistory();
    setTimeout(scrollToTimeline, 0);
  };

  // 閲覧中のテーマ(nullなら年表を表示)
  const [thread, setThread] = useState(null);
  // 年表内検索は一時的な表示条件として扱い、ブラウザ保存はしない。
  const [searchText, setSearchText] = useState("");
  const [earlyHistoryOpen, setEarlyHistoryOpen] =
    useState(false);
  const {
    administratorDataStatus,
    authenticateAndLoadAdministratorData,
    clearAdministratorBrowserData,
  } = useAdministratorData({
    applyServerPersonalEvents,
    applyServerLifeSettings,
  });

  useEffect(() => {
    const currentSettings =
      lifeSettingsSource === "server"
        ? workspaceStore.settings.load() || {}
        : {};

    workspaceStore.settings.save({
      ...currentSettings,
      ...(lifeSettingsSource === "server"
        ? {}
        : {
            birth,
            month,
            education,
            adultPeriods,
          }),
      catOff,
      sfOnly,
      subFilters,
      categoryMatchMode,
      importanceMin,
      closed: [...closedStages],
      periodFramesInitialized: true,
      setupOpen,
      personalHistoryOpen,
      beginnerGuideSeen: true,
    });
  }, [
    birth,
    month,
    education,
    adultPeriods,
    catOff,
    sfOnly,
    subFilters,
    categoryMatchMode,
    importanceMin,
    closedStages,
    setupOpen,
    personalHistoryOpen,
    lifeSettingsSource,
  ]);

  const toggleMyEvents = () => {
    setShowMe((value) => !value);
  };

  const hasActiveDisplayFilters =
    MAIN_CATS.some((key) => catOff[key] === true) ||
    sfOnly ||
    subFilters.length > 0 ||
    categoryMatchMode !== "primary" ||
    importanceMin !== 2 ||
    searchText.trim().length > 0;

  const resetTimelineFilters = () => {
    setAllCats(true);
    setCategoryMatchMode("primary");
    setImportanceLevel(2);
    setSearchText("");
  };

  // ?e=<項目ID> で共有されたリンクは、その項目を開いた状態で表示する
  // ?t=<テーマのキー> ならそのテーマを開いた状態で始める
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const th = findThread(q.get("t"));
    if (th) setThread(th);
    const ev = findEventByShareParam(
      EVENTS,
      q.get("e")
    );
    if (!ev) return;
    const id = eventId(ev);
    openEvent(id);

    const sharedEventYear = eventYear(ev);
    if (
      sharedEventYear >= 1501 &&
      sharedEventYear <= 1900
    ) {
      setEarlyHistoryOpen(true);
    }

    expandAllStages(); // 共有リンクで来たときは帯を畳んだままにしない
    const timer = setTimeout(() => {
      document.getElementById(`ev-${id}`)?.scrollIntoView({ block: "center" });
    }, 150);
    return () => clearTimeout(timer);
  }, []);

  const effectiveEvents = useMemo(
    () =>
      applyEventCustomizations(
        EVENTS,
        eventCustomizations
      ).events,
    [eventCustomizations]
  );

  const effectiveStats = useMemo(
    () =>
      effectiveEvents.reduce(
        (a, e) => ({
          count: a.count + 1,
          chars: a.chars + [...(e.summary || "")].length,
        }),
        { count: 0, chars: 0 }
      ),
    [effectiveEvents]
  );

  const grouped = useTimelineModel({
    birth,
    month,
    education,
    adultPeriods,
    personalEvents: myEvents,
    publicEvents: effectiveEvents,
    catOff,
    sfOnly,
    subFilters,
    categoryMatchMode,
    importanceMin,
    showPersonal: showMe,
    searchText,
    closedStages,
  });

  const earlyHistoryGroupKeys = new Set([
    "pre-16-first",
    "pre-16-second",
    "pre-17-first",
    "pre-17-second",
    "pre-18-first",
    "pre-18-second",
    "pre-19-first",
    "pre-19-second",
  ]);

  const earlyHistoryCount = grouped.groups
    .filter((group) =>
      earlyHistoryGroupKeys.has(group.key)
    )
    .reduce(
      (total, group) => total + group.items.length,
      0
    );

  const previousStageKeysRef = useRef(null);

  useEffect(() => {
    const currentKeys =
      grouped.controlTargets.allStageKeys;
    const previousKeys =
      previousStageKeysRef.current;

    // 新仕様の初回だけ、期間枠はすべて閉じた状態で始める。
    if (previousKeys === null) {
      previousStageKeysRef.current = currentKeys;

      if (
        SAVED.periodFramesInitialized !== true &&
        currentKeys.length > 0
      ) {
        collapseStages(currentKeys);
      }

      return;
    }

    // 全期間を閉じている最中に教育歴などで期間キーが変わった場合、
    // 新しく生まれた期間枠にも「閉」を引き継ぐ。
    const allPreviousStagesClosed =
      previousKeys.length > 0 &&
      previousKeys.every((key) =>
        closedStages.has(key)
      );

    const hasNewOpenStage =
      currentKeys.some(
        (key) =>
          !previousKeys.includes(key) &&
          !closedStages.has(key)
      );

    previousStageKeysRef.current = currentKeys;

    if (
      allPreviousStagesClosed &&
      hasNewOpenStage
    ) {
      collapseStages(currentKeys);
    }
  }, [
    grouped.controlTargets.allStageKeys,
    closedStages,
    collapseStages,
  ]);

  const {
    downloadMenuOpen,
    exportVisibleEventsTsv,
  } = useVisibleEventsExport({
    visibleItems: grouped.visibleItems,
    gradeLabel: grouped.gradeLabel,
  });

  const font =
    '"Hiragino Kaku Gothic ProN", "Hiragino Sans", "Yu Gothic Medium", "Noto Sans JP", sans-serif';
  const mono = 'ui-monospace, "SF Mono", Menlo, Consolas, monospace';

  const openThreadWindow = () => {
    const url = new URL(window.location.href);
    url.search = "";
    url.hash = "";
    url.searchParams.set("threads", "1");

    const popup = window.open(
      url.toString(),
      "koshix-timeline-threads",
      "popup=yes,width=760,height=820,resizable=yes,scrollbars=yes"
    );

    popup?.focus();
  };

  return (
    <div style={{ minHeight: "100vh", background: "#fafaf8", fontFamily: font, color: "#22272e" }}>
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "28px 16px 64px" }}>
        <AppHeader
          appTitle={APP_TITLE}
          threadCount={THREAD_LIST.length}
          eventCount={EVENTS.length}
          effectiveStats={effectiveStats}
          hashtag={HASHTAG}
          shareUrl={SHARE_URL}
          showBeginnerGuide={SHOW_BEGINNER_GUIDE}
          mono={mono}
        />
        <TimelineSettingsSection
          settings={lifeSettings}
          display={displaySettings}
          timeline={{
            adultYear: grouped.adultYear,
            adultPeriodErrors:
              grouped.adultPeriodErrors,
            warnings: grouped.warnings,
          }}
          navigation={{
            onViewPersonalHistory:
              viewPersonalHistoryFromSetup,
          }}
          ui={{
            font,
            mono,
            miniBtn,
          }}
        />


        <PersonalHistorySection
          personal={personalHistory}
          display={displaySettings}
          navigation={{
            onViewTimeline:
              viewTimelineFromPersonalHistory,
          }}
          ui={{
            font,
            miniBtn,
          }}
        />
        <TimelineViewControls
          timeline={grouped}
          filters={{
            mainCategories: MAIN_CATS,
            catOn,
            toggleCat,
            sfOnly,
            toggleSfOnly,
            subFilters,
            toggleSubFilter,
            showMe,
            toggleMyEvents,
            categoryMatchMode,
            setCategoryMatchMode,
            setAllCats,
            importanceMin,
            setImportanceLevel,
            closedStages,
            expandAllStages,
            collapseStages,
          }}
          earlyHistory={{
            open: earlyHistoryOpen,
            setOpen: setEarlyHistoryOpen,
            count: earlyHistoryCount,
          }}
          eventOpen={{
            isEventOpen,
            openOnlyEvents,
            closeAllEvents,
          }}
          search={{
            text: searchText,
            setText: setSearchText,
          }}
          download={{
            menuOpen: downloadMenuOpen,
            exportVisibleEventsTsv,
          }}
          openThreadWindow={openThreadWindow}
          resetTimelineFilters={resetTimelineFilters}
          hasActiveDisplayFilters={hasActiveDisplayFilters}
          ui={{
            font,
            mono,
            miniBtn,
            ImportanceBadge,
          }}
        />

        <TimelineGroupList
          timeline={grouped}
          earlyHistory={{
            count: earlyHistoryCount,
            open: earlyHistoryOpen,
            setOpen: setEarlyHistoryOpen,
            keys: earlyHistoryGroupKeys,
          }}
          toggleStage={toggleStage}
          eventOpen={{
            isEventOpen,
            toggleEvent,
          }}
          personal={{
            source: personalEventsSource,
            startEditing: startEditingPersonalEvent,
            deleteEvent: deletePersonalEvent,
          }}
          customization={{
            eventCustomizations,
            editingEventId,
            eventEditDraft,
            updateEventEditDraft,
            deleteAddedEvent,
            startEditingEvent,
            hideEvent,
            saveEditedEvent,
            cancelEditingEvent,
          }}
          sharing={{
            hashtag: HASHTAG,
            baseUrl: SHARE_URL,
          }}
          ui={{
            font,
            mono,
            miniBtn,
            gradeBadgeStyle,
            formatEventDate,
            ImportanceBadge,
          }}
        />

        <TimelineCustomizationSection
          customization={eventCustomization}
          timeline={{
            events: EVENTS,
            mainCategories: MAIN_CATS,
          }}
          ui={{
            font,
            miniBtn,
          }}
        />


        <AppFooter
          appVersion={APP_VERSION}
          appUpdatedDate={APP_UPDATED_DATE}
          publicDistributionEnabled={PUBLIC_DISTRIBUTION_ENABLED}
          downloadUrl={DOWNLOAD_URL}
          publicSourceUrl={PUBLIC_SOURCE_URL}
          accessStatsUrl={ACCESS_STATS_URL}
          personalEventsSource={personalEventsSource}
          lifeSettingsSource={lifeSettingsSource}
          administratorDataStatus={administratorDataStatus}
          authenticateAndLoadAdministratorData={
            authenticateAndLoadAdministratorData
          }
          clearAdministratorBrowserData={
            clearAdministratorBrowserData
          }
          miniBtn={miniBtn}
        />
      </div>

      {thread && (
        <Theater
          thread={thread}
          gradeLabel={grouped.gradeLabel}
          birth={birth}
          hashtag={HASHTAG}
          shareUrl={SHARE_URL}
          onClose={() => setThread(null)}
        />
      )}
    </div>
  );
}


const miniBtn = {
  fontSize: 11, fontWeight: 700, cursor: "pointer", padding: "4px 10px",
  borderRadius: 999, border: "1px solid #d5d8dd", background: "#fff", color: "#6b7280",
};
