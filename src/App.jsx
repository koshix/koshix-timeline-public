import { eventYear } from "./event-schema.js";
import { useState, useMemo, useEffect } from "react";
import { loadEvents } from "./events-source";
import { loadConfig } from "./config-source";
import { applyEventCustomizations } from "./event-customizations";
import { THREADS } from "./threads";
import {
  createInitialEducationSettings,
} from "./life-settings";
import useTimelineModel from "./useTimelineModel";
import {
  buildInitialTimelineClosedStageKeys,
} from "./timeline-model.js";
import usePersonalEvents from "./usePersonalEvents";
import {
  loadPersonalEvents,
} from "./personal-events-source.js";
import {
  loadLifeSettings,
} from "./life-settings-source.js";
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
import ShareBar from "./ShareBar";
import {
  CAT,
  catsOf,
  primaryCatOf,
  catKey,
} from "./categories";
import Theater from "./Theater";
import TimelineCategoryFilters from "./TimelineCategoryFilters";
import TimelineDisplayControls from "./TimelineDisplayControls";
import TimelineEraHeadings from "./TimelineEraHeadings";
import TimelinePersonalEventRow from "./TimelinePersonalEventRow";
import TimelinePublicEventRow from "./TimelinePublicEventRow";
import TimelineCustomizationSection from "./TimelineCustomizationSection";
import PersonalHistorySection from "./PersonalHistorySection";
import TimelineSettingsSection from "./TimelineSettingsSection";
import TimelineSearchControls from "./TimelineSearchControls";
import useVisibleEventsExport from "./useVisibleEventsExport";

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

// ---- テーマの糸(年表に散らばった項目を、一本の流れとしてたどる) ----
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
const INITIAL_BIRTH = SAVED.birth ?? PROFILE_DEFAULTS.birthYear ?? 1965;
const INITIAL_MONTH = SAVED.month ?? PROFILE_DEFAULTS.birthMonth ?? 0;
const INITIAL_EDUCATION = createInitialEducationSettings(
  SAVED,
  PROFILE_DEFAULTS,
  INITIAL_BIRTH,
  INITIAL_MONTH
);

export default function App() {
  const {
    birth,
    month,
    adjustBirthYear,
    setBirthYear,
    setBirthMonth,
    education,
    updateEducation,
    firstHigherYear,
    firstHigherType,
    firstGraduateYear,
    firstGraduateType,
    adultPeriods,
    lifeSettingsStatus,
    lifeSettingsSource,
    educationEditorRevision,
    lifeSettingsFileInputRef,
    importLifeSettingsFile,
    exportLifeSettingsFile,
    applyServerLifeSettings,
    resetAdultPeriods,
    updateAdultPeriod,
    addAdultPeriod,
    removeAdultPeriod,
  } = useLifeSettings({
    initialBirth: INITIAL_BIRTH,
    initialMonth: INITIAL_MONTH,
    initialEducation: INITIAL_EDUCATION,
    savedAdultPeriods: SAVED.adultPeriods,
  });

  const {
    isEventOpen,
    toggleEvent,
    openEvent,
    closeEvent,
    openOnlyEvents,
    closeAllEvents,
  } = useOpenEvents();

  const {
    eventCustomizations,
    eventCustomizationStatus,
    eventCustomizationEditorOpen,
    editingEventId,
    eventEditDraft,
    eventAddOpen,
    eventAddDraft,
    eventCustomizationFileInputRef,
    startEditingEvent,
    cancelEditingEvent,
    openNewEventForm,
    cancelAddingEvent,
    openEventCustomizationEditor,
    toggleEventCustomizationEditor,
    closeEventCustomizationEditor,
    updateEventEditDraft,
    updateEventAddDraft,
    saveEditedEvent,
    importEventCustomizationsFile,
    exportEventCustomizationsFile,
    saveAddedEvent,
    deleteAddedEvent,
    hideEvent,
    restoreHiddenEvent,
    clearEventCustomizations,
  } = useEventCustomizations({
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
    myEvents,
    personalEventsSource,
    personalFileStatus,
    personalAddOpen,
    personalEditorOpen,
    editingPersonalId,
    personalDraft,
    personalFileInputRef,
    importPersonalEventsFile,
    exportPersonalEventsFile,
    openPersonalEventEntry,
    togglePersonalEditor,
    closePersonalEditor,
    updatePersonalDraft,
    openNewPersonalEventForm,
    closePersonalEventForm,
    startEditingPersonalEvent,
    clearPersonalEventsFile,
    savePersonalEvent,
    deletePersonalEvent,
    applyServerPersonalEvents,
  } = usePersonalEvents({
    onCleared: () => {
      setShowMe(false);
    },
    onDeleted: (event) => {
      closeEvent(eventId(event));
    },
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
    openSetup,
    toggleSetup,
  } = useDisplaySettings({
    saved: SAVED,
    mainCategories: MAIN_CATS,
    initialClosedStages:
      buildInitialTimelineClosedStageKeys({
        birth: INITIAL_BIRTH,
      }),
  });

  const [showMe, setShowMe] = useState(false);
  // 閲覧中のテーマ(nullなら年表を表示)
  const [thread, setThread] = useState(null);
  // 年表内検索は一時的な表示条件として扱い、ブラウザ保存はしない。
  const [searchText, setSearchText] = useState("");
  const [
    administratorDataStatus,
    setAdministratorDataStatus,
  ] = useState("");

  const loadAdministratorData = async () => {
    setAdministratorDataStatus("");

    try {
      const [
        personalEvents,
        lifeSettings,
      ] = await Promise.all([
        loadPersonalEvents(),
        loadLifeSettings(),
      ]);

      if (personalEvents === null) {
        throw new Error(
          "個人史TSVを取得できませんでした"
        );
      }

      if (lifeSettings === null) {
        throw new Error(
          "人生設定TSVを取得できませんでした"
        );
      }

      applyServerPersonalEvents(
        personalEvents
      );
      applyServerLifeSettings(
        lifeSettings
      );
    } catch (err) {
      console.error(
        "Administrator data could not be loaded:",
        err
      );
      setAdministratorDataStatus(
        `管理者データの読み込み失敗: ${
          err?.message || String(err)
        }`
      );
    }
  };

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
      setupOpen,
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
    lifeSettingsSource,
  ]);

  const toggleMyEvents = () => {
    setShowMe((value) => !value);
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
        {/* ヘッダー */}
        <header style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, letterSpacing: "0.25em", color: "#8a8f98", marginBottom: 6 }}>
            {THREAD_LIST.length}のテーマでたどる、自分の時代
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              flexWrap: "wrap",
            }}
          >
            <h1
              style={{
                fontSize: 29,
                fontWeight: 800,
                margin: 0,
                lineHeight: 1.35,
                flex: "1 1 300px",
              }}
            >
              {APP_TITLE}
            </h1>

            <div
              role="group"
              aria-label="共有"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 7,
                flexWrap: "wrap",
                padding: "4px 7px",
                border: "1px solid #e2e4e8",
                borderRadius: 10,
                background: "#f7f8f9",
              }}
            >
              <span style={{ fontSize: 11.5, fontWeight: 700, color: "#6b7280" }}>
                共有：
              </span>
              <ShareBar
                small
                labelOnly
                hashtag={HASHTAG}
                url={SHARE_URL}
                text={`${APP_TITLE}——${THREAD_LIST.length}のテーマで時代を自分の年齢から読む(${EVENTS.length}項目) ${HASHTAG}`}
              />
            </div>
          </div>
          <div style={{ fontSize: 11.5, color: "#8a8f98", marginTop: 8, fontFamily: mono }}>
            全{effectiveStats.count}項目・解説{effectiveStats.chars.toLocaleString()}字
          </div>
        </header>

        <section
          aria-label="はじめて使う方へ"
          style={{
            background: "#fffdf8",
            border: "1px solid #eadfce",
            borderRadius: 12,
            padding: "12px 14px",
            marginBottom: 14,
          }}
        >
          <div
            style={{
              fontSize: 14,
              fontWeight: 800,
              color: "#5f5142",
            }}
          >
            はじめて使う方へ
          </div>

          <div
            style={{
              fontSize: 11.5,
              lineHeight: 1.7,
              color: "#6b7280",
              marginTop: 3,
            }}
          >
            生年を合わせるだけで、出来事を「そのとき何歳だったか」で読めます。
            自分史や年表の変更は、ブラウザ内に保存できます。
          </div>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 8,
              marginTop: 10,
            }}
          >
            <button
              type="button"
              onClick={() => {
                openSetup();
                setTimeout(() => {
                  document
                    .getElementById("timeline-settings")
                    ?.scrollIntoView({
                      behavior: "smooth",
                      block: "start",
                    });
                }, 0);
              }}
              style={{
                flex: "1 1 190px",
                fontFamily: font,
                fontSize: 12,
                fontWeight: 800,
                lineHeight: 1.5,
                textAlign: "left",
                cursor: "pointer",
                padding: "9px 12px",
                borderRadius: 9,
                border: "1px solid #c9b999",
                background: "#ffffff",
                color: "#5f5142",
              }}
            >
              ①あなたの設定
            </button>

            <button
              type="button"
              onClick={() => {
                openPersonalEventEntry();
                setTimeout(() => {
                  document
                    .getElementById("personal-history")
                    ?.scrollIntoView({
                      behavior: "smooth",
                      block: "start",
                    });
                }, 0);
              }}
              style={{
                flex: "1 1 190px",
                fontFamily: font,
                fontSize: 12,
                fontWeight: 800,
                lineHeight: 1.5,
                textAlign: "left",
                cursor: "pointer",
                padding: "9px 12px",
                borderRadius: 9,
                border: "1px solid #cfbfdf",
                background: "#ffffff",
                color: "#5f4a72",
              }}
            >
              ②自分史の編集
            </button>

            <button
              type="button"
              onClick={() => {
                openEventCustomizationEditor();
                setTimeout(() => {
                  document
                    .getElementById("timeline-customization")
                    ?.scrollIntoView({
                      behavior: "smooth",
                      block: "start",
                    });
                }, 0);
              }}
              style={{
                flex: "1 1 190px",
                fontFamily: font,
                fontSize: 12,
                fontWeight: 800,
                lineHeight: 1.5,
                textAlign: "left",
                cursor: "pointer",
                padding: "9px 12px",
                borderRadius: 9,
                border: "1px solid #bdd0e5",
                background: "#ffffff",
                color: "#365f7d",
              }}
            >
              ③共通年表の編集
            </button>
          </div>
        </section>

        {/* 共通年表の表示設定 */}
        <div
          role="group"
          aria-label="共通年表の表示設定"
          style={{
            display: "flex",
            gap: 8,
            marginBottom: 24,
            flexWrap: "wrap",
            alignItems: "center",
            background: "#fff",
            border: "1px solid #e2e4e8",
            borderRadius: 12,
            padding: "12px 14px",
          }}
        >
          <div
            style={{
              flexBasis: "100%",
              display: "flex",
              alignItems: "baseline",
              gap: 16,
              flexWrap: "wrap",
              marginBottom: 3,
            }}
          >
            <span
              style={{
                fontSize: 14,
                fontWeight: 800,
                color: "#4b5563",
              }}
            >
              共通年表の表示設定
            </span>

            <span
              style={{
                fontSize: 11,
                fontWeight: 500,
                color: "#9aa0a8",
              }}
            >
              公開{grouped.shown}件
              {grouped.myShown > 0
                ? `＋個人史${grouped.myShown}件`
                : ""}
            </span>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              flexWrap: "wrap",
              width: "100%",
              marginBottom: 2,
            }}
          >
            <span
              style={{
                display: "inline-flex",
                alignItems: "baseline",
                gap: 5,
                padding: "5px 10px",
                borderRadius: 8,
                background: "#eef1f5",
                border: "1px solid #d7dce2",
                color: "#37414f",
                fontSize: 12,
                fontWeight: 700,
              }}
            >
              表示中
              <strong
                style={{
                  fontFamily: mono,
                  fontSize: 20,
                  lineHeight: 1,
                }}
              >
                {grouped.shown + grouped.myShown}
              </strong>
              件
            </span>

            <button
              type="button"
              onClick={openThreadWindow}
              className="timeline-thread-button"
              style={{ "--timeline-font": font }}
            >
              テーマでたどる
            </button>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              flexWrap: "wrap",
              width: "100%",
              marginBottom: 2,
            }}
          >
            <TimelineCategoryFilters
              mainCategories={MAIN_CATS}
              catOn={catOn}
              toggleCat={toggleCat}
              sfOnly={sfOnly}
              toggleSfOnly={toggleSfOnly}
              subFilters={subFilters}
              toggleSubFilter={toggleSubFilter}
              showMe={showMe}
              toggleMyEvents={toggleMyEvents}
              categoryMatchMode={categoryMatchMode}
              setCategoryMatchMode={setCategoryMatchMode}
              font={font}
            />
          </div>

          <TimelineDisplayControls
            controlTargets={grouped.controlTargets}
            setAllCats={setAllCats}
            importanceMin={importanceMin}
            setImportanceLevel={setImportanceLevel}
            expandAllStages={expandAllStages}
            collapseStages={collapseStages}
            openOnlyEvents={openOnlyEvents}
            closeAllEvents={closeAllEvents}
            font={font}
          />

          <TimelineSearchControls
            searchText={searchText}
            searchError={grouped.searchError}
            onSearchTextChange={setSearchText}
            onClearSearch={() => setSearchText("")}
            font={font}
            miniBtn={miniBtn}
          />

          <div
            style={{
              flexBasis: "100%",
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              gap: 10,
              fontSize: 10.5,
              color: "#8a8f98",
              marginTop: 2,
            }}
          >
            <span>アイコン色＝主分類、色ドット＝副分類</span>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
              }}
            >
              重要度:
              <ImportanceBadge level={3} /> L3 重要
              <ImportanceBadge level={2} /> L2 標準
              <ImportanceBadge level={1} /> L1 補足
            </span>

            <button
              type="button"
              onClick={() => exportVisibleEventsTsv()}
              title={`現在表示中の項目 ${grouped.shown + grouped.myShown}件をダウンロード`}
              style={{
                ...miniBtn,
                marginLeft: "auto",
                fontSize: 11.5,
                fontWeight: 800,
                border: "1px solid #9aa4b2",
                background: "#ffffff",
                color: "#4b5563",
              }}
            >
              表示項目のＤＬ
            </button>

            {downloadMenuOpen && (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <button
                  type="button"
                  onClick={() => exportVisibleEventsTsv("public")}
                  style={{
                    ...miniBtn,
                    fontSize: 11.5,
                    fontWeight: 800,
                  }}
                >
                  共通年表
                </button>

                <button
                  type="button"
                  onClick={() => exportVisibleEventsTsv("personal")}
                  style={{
                    ...miniBtn,
                    fontSize: 11.5,
                    fontWeight: 800,
                  }}
                >
                  自分史
                </button>
              </span>
            )}
          </div>

        </div>

        {/* 個人史グループ */}
        {grouped.groups.map((g, gi) => {
        const stageClosed = g.closed;
        return (
          <section key={gi} style={{ marginBottom: 22 }}>
            <button
              onClick={() => toggleStage(g.key)}
              aria-expanded={!stageClosed}
              style={{
                display: "flex", alignItems: "baseline", gap: 10, width: "100%",
                borderTop: "none", borderRight: "none", borderBottom: "none",
                borderLeftWidth: 6, borderLeftStyle: "solid", borderLeftColor: g.stage.color,
                background: g.stage.bg, borderRadius: 8,
                padding: "8px 14px", marginBottom: 8,
                cursor: "pointer", textAlign: "left", fontFamily: font,
              }}
            >
              <h2 style={{ fontSize: 16, fontWeight: 800, margin: 0, color: g.stage.color }}>
                {g.stage.label}
              </h2>
              <span style={{ fontFamily: mono, fontSize: 12, color: "#6b7280" }}>
                {g.rangeFrom != null
                  ? `${g.rangeFrom}–${g.rangeTo}`
                  : `${eventYear(g.items[0])}–${eventYear(g.items[g.items.length - 1])}`}
              </span>
              <span style={{ flex: 1 }} />
              <span style={{ fontFamily: mono, fontSize: 11.5, color: "#8a8f98" }}>
                {g.items.length}件
              </span>
              <span style={{ fontSize: 11, color: g.stage.color }} aria-hidden="true">
                {stageClosed ? "▶" : "▼"}
              </span>
            </button>
            {!stageClosed && (
            <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
              {g.items.map((ev, i) => {
                const eraHeadings = (
                  <TimelineEraHeadings
                    event={ev}
                    previousEvent={
                      i > 0
                        ? g.items[i - 1]
                        : null
                    }
                    mono={mono}
                  />
                );

                if (ev.primary === "me") {
                  return (
                    <TimelinePersonalEventRow
                      key={ev.id}
                      event={ev}
                      eraHeadings={eraHeadings}
                      stage={g.stage}
                      font={font}
                      mono={mono}
                      gradeLabel={grouped.gradeLabel}
                      isEventOpen={isEventOpen}
                      toggleEvent={toggleEvent}
                      personalEventsSource={
                        personalEventsSource
                      }
                      startEditingPersonalEvent={
                        startEditingPersonalEvent
                      }
                      deletePersonalEvent={
                        deletePersonalEvent
                      }
                      miniBtn={miniBtn}
                      gradeBadgeStyle={
                        gradeBadgeStyle
                      }
                      formatEventDate={
                        formatEventDate
                      }
                    />
                  );
                }

                return (
                  <TimelinePublicEventRow
                    key={i}
                    event={ev}
                    eraHeadings={eraHeadings}
                    stage={g.stage}
                    font={font}
                    mono={mono}
                    gradeLabel={grouped.gradeLabel}
                    isEventOpen={isEventOpen}
                    toggleEvent={toggleEvent}
                    eventCustomizations={
                      eventCustomizations
                    }
                    editingEventId={
                      editingEventId
                    }
                    eventEditDraft={
                      eventEditDraft
                    }
                    updateEventEditDraft={
                      updateEventEditDraft
                    }
                    deleteAddedEvent={
                      deleteAddedEvent
                    }
                    startEditingEvent={
                      startEditingEvent
                    }
                    hideEvent={hideEvent}
                    saveEditedEvent={
                      saveEditedEvent
                    }
                    cancelEditingEvent={
                      cancelEditingEvent
                    }
                    hashtag={HASHTAG}
                    shareBaseUrl={SHARE_URL}
                    miniBtn={miniBtn}
                    gradeBadgeStyle={
                      gradeBadgeStyle
                    }
                    formatEventDate={
                      formatEventDate
                    }
                    ImportanceBadge={
                      ImportanceBadge
                    }
                  />
                );
              })}
            </ul>
            )}
          </section>
        );
        })}

        <TimelineCustomizationSection
          eventCustomizations={
            eventCustomizations
          }
          eventCustomizationStatus={
            eventCustomizationStatus
          }
          eventCustomizationEditorOpen={
            eventCustomizationEditorOpen
          }
          eventCustomizationFileInputRef={
            eventCustomizationFileInputRef
          }
          importEventCustomizationsFile={
            importEventCustomizationsFile
          }
          exportEventCustomizationsFile={
            exportEventCustomizationsFile
          }
          toggleEventCustomizationEditor={
            toggleEventCustomizationEditor
          }
          closeEventCustomizationEditor={
            closeEventCustomizationEditor
          }
          clearEventCustomizations={
            clearEventCustomizations
          }
          openNewEventForm={openNewEventForm}
          eventAddOpen={eventAddOpen}
          eventAddDraft={eventAddDraft}
          updateEventAddDraft={
            updateEventAddDraft
          }
          saveAddedEvent={saveAddedEvent}
          cancelAddingEvent={
            cancelAddingEvent
          }
          restoreHiddenEvent={
            restoreHiddenEvent
          }
          events={EVENTS}
          mainCategories={MAIN_CATS}
          font={font}
          miniBtn={miniBtn}
        />

        <PersonalHistorySection
          myEvents={myEvents}
          personalEventsSource={
            personalEventsSource
          }
          personalFileStatus={
            personalFileStatus
          }
          personalAddOpen={personalAddOpen}
          personalEditorOpen={
            personalEditorOpen
          }
          editingPersonalId={
            editingPersonalId
          }
          personalDraft={personalDraft}
          personalFileInputRef={
            personalFileInputRef
          }
          importPersonalEventsFile={
            importPersonalEventsFile
          }
          exportPersonalEventsFile={
            exportPersonalEventsFile
          }
          togglePersonalEditor={
            togglePersonalEditor
          }
          closePersonalEditor={
            closePersonalEditor
          }
          updatePersonalDraft={
            updatePersonalDraft
          }
          openNewPersonalEventForm={
            openNewPersonalEventForm
          }
          closePersonalEventForm={
            closePersonalEventForm
          }
          startEditingPersonalEvent={
            startEditingPersonalEvent
          }
          clearPersonalEventsFile={
            clearPersonalEventsFile
          }
          savePersonalEvent={
            savePersonalEvent
          }
          deletePersonalEvent={
            deletePersonalEvent
          }
          font={font}
          miniBtn={miniBtn}
        />

        <TimelineSettingsSection
          setupOpen={setupOpen}
          toggleSetup={toggleSetup}
          birth={birth}
          month={month}
          firstHigherYear={firstHigherYear}
          firstHigherType={firstHigherType}
          firstGraduateYear={
            firstGraduateYear
          }
          firstGraduateType={
            firstGraduateType
          }
          adultPeriods={adultPeriods}
          adultYear={grouped.adultYear}
          adultPeriodErrors={
            grouped.adultPeriodErrors
          }
          warnings={grouped.warnings}
          adjustBirthYear={adjustBirthYear}
          setBirthYear={setBirthYear}
          setBirthMonth={setBirthMonth}
          education={education}
          educationEditorRevision={
            educationEditorRevision
          }
          updateEducation={updateEducation}
          resetAdultPeriods={
            resetAdultPeriods
          }
          updateAdultPeriod={
            updateAdultPeriod
          }
          addAdultPeriod={addAdultPeriod}
          removeAdultPeriod={
            removeAdultPeriod
          }
          lifeSettingsStatus={
            lifeSettingsStatus
          }
          lifeSettingsFileInputRef={
            lifeSettingsFileInputRef
          }
          importLifeSettingsFile={
            importLifeSettingsFile
          }
          exportLifeSettingsFile={
            exportLifeSettingsFile
          }
          font={font}
          mono={mono}
          btnStyle={btnStyle}
          miniBtn={miniBtn}
        />

        <footer
          style={{
            fontSize: 12,
            color: "#59616c",
            marginTop: 28,
            lineHeight: 1.8,
            background: "#fff",
            border: "1px solid #e2e4e8",
            borderRadius: 12,
            padding: "12px 14px",
          }}
        >
          <div
            style={{
              color: "#59616c",
              fontWeight: 800,
              fontSize: 13,
            }}
          >
            このサイトについて
          </div>

          <div
            style={{
              marginTop: 3,
              fontSize: 12,
              color: "#59616c",
            }}
          >
            Webアプリ v{APP_VERSION}　最終更新 {APP_UPDATED_DATE}
          </div>

          <div style={{ marginTop: 8 }}>
            公開された歴史的出来事を、生年・学齢期・人生段階に重ねて表示するインタラクティブ年表です。
            学齢は誕生年と誕生月から概算し、大学等・大学院の設定から人生段階と成人期の開始年を自動計算します。成人期は必要に応じて任意に分割できます。
          </div>

          <details
            style={{
              marginTop: 10,
              paddingTop: 10,
              borderTop: "1px solid #eceef1",
              fontSize: 11,
              color: "#8a8f98",
            }}
          >
            <summary
              style={{
                cursor: "pointer",
                userSelect: "none",
                padding: "4px 0",
              }}
            >
              管理者向け
            </summary>

            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                gap: 10,
                marginTop: 6,
              }}
            >
              <button
                type="button"
                onClick={loadAdministratorData}
                style={{
                  ...miniBtn,
                  ...(personalEventsSource === "server" &&
                  lifeSettingsSource === "server"
                    ? {
                        background: "#fff1dc",
                        border: "1px solid #d79a43",
                        color: "#8a5208",
                        fontWeight: 800,
                      }
                    : {}),
                }}
              >
                管理者データ読込
              </button>

              {administratorDataStatus && (
                <span
                  style={{
                    fontSize: 11,
                    color: "#9b4a3c",
                  }}
                >
                  {administratorDataStatus}
                </span>
              )}

              {personalEventsSource === "server" && DOWNLOAD_URL && (
                <a
                  href={DOWNLOAD_URL}
                  download="koshix-timeline-starter.zip"
                  style={{ color: "#59616c" }}
                >
                  ダウンロード版
                </a>
              )}

              {personalEventsSource === "server" && PUBLIC_SOURCE_URL && (
                <a
                  href={PUBLIC_SOURCE_URL}
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: "#59616c" }}
                >
                  公開用ソース
                </a>
              )}

              {personalEventsSource === "server" && ACCESS_STATS_URL && (
                <a
                  href={ACCESS_STATS_URL}
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: "#59616c" }}
                >
                  アクセス統計
                </a>
              )}
            </div>
          </details>

          <div
            style={{
              marginTop: 10,
              paddingTop: 10,
              borderTop: "1px solid #eceef1",
            }}
          >
            <div style={{ fontSize: 12, color: "#59616c" }}>
              <div
                style={{
                  marginBottom: 2,
                }}
              >
                著作権表示：
              </div>
              <div>
                このアプリは松尾公也氏の{" "}
              <a
                href="https://matsuo-koya.github.io/sf-tech-lifeline/"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "#59616c" }}
              >
                SF × テクノロジー 自分史年表
              </a>
              {"（"}
              <a
                href="https://github.com/matsuo-koya/sf-tech-lifeline"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "#59616c" }}
              >
                sf-tech-lifeline
              </a>
              {"）を基にKunio Koshigiriが改変しています。"}
              </div>
            </div>

            <div style={{ fontSize: 12, color: "#59616c" }}>
              原作品 © 2026 Koya Matsuo ／ 改変部分 © 2026 Kunio Koshigiri ／{" "}
              <a
                href={`${import.meta.env.BASE_URL}LICENSE.txt`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "#59616c" }}
              >
                MIT License
              </a>
              {" ／ "}
              <a
                href={`${import.meta.env.BASE_URL}THIRD-PARTY-NOTICES.md`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "#59616c" }}
              >
                第三者ソフトウェア表示
              </a>
            </div>
          </div>
        </footer>
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

const btnStyle = {
  width: 34, height: 34, borderRadius: 8, border: "1px solid #d5d8dd",
  background: "#fff", fontSize: 18, fontWeight: 700, cursor: "pointer",
  color: "#22272e", lineHeight: 1,
};

// 日本語入力の変換確定のEnterで実行してしまわないようにする
// (変換中はisComposingがtrue。古いSafari等のためkeyCode 229も見る)

const miniBtn = {
  fontSize: 11, fontWeight: 700, cursor: "pointer", padding: "4px 10px",
  borderRadius: 999, border: "1px solid #d5d8dd", background: "#fff", color: "#6b7280",
};
