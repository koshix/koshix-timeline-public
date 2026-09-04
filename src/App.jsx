import { useState, useMemo, useEffect } from "react";
import { loadEvents } from "./events-source";
import { loadConfig } from "./config-source";
import { applyEventCustomizations } from "./event-customizations";
import { THREADS } from "./threads";
import {
  GRADUATE_TYPES,
  HIGHER_ED_TYPES,
} from "./life-stages";
import {
  createInitialEducationSettings,
} from "./life-settings";
import AdultPeriodsEditor from "./AdultPeriodsEditor";
import BirthSettingsEditor from "./BirthSettingsEditor";
import EducationHistoryEditor from "./EducationHistoryEditor";
import EventCustomizationAddForm from "./EventCustomizationAddForm";
import EventCustomizationControls from "./EventCustomizationControls";
import EventCustomizationEditForm from "./EventCustomizationEditForm";
import EventCustomizationActions from "./EventCustomizationActions";
import EventReferenceLinks from "./EventReferenceLinks";
import EventCustomizationHiddenList from "./EventCustomizationHiddenList";
import LifeSettingsFileControls from "./LifeSettingsFileControls";
import PersonalHistoryControls from "./PersonalHistoryControls";
import PersonalHistoryEventForm from "./PersonalHistoryEventForm";
import PersonalHistoryEditorList from "./PersonalHistoryEditorList";
import useTimelineModel from "./useTimelineModel";
import usePersonalEvents from "./usePersonalEvents";
import useEventCustomizations from "./useEventCustomizations";
import useLifeSettings from "./useLifeSettings";
import useDisplaySettings from "./useDisplaySettings";
import useOpenEvents from "./useOpenEvents";
import {
  settingsStore,
} from "./settings-store";
import {
  backgroundEraOf,
  halfCenturyMarkerOf,
  japaneseEraOf,
  preBirthPeriodsOf,
} from "./timeline-eras";
import {
  eventId,
  findEventByShareParam,
} from "./event-links";
import ShareBar from "./ShareBar";
import Icon from "./Icon";
import {
  CAT,
  catsOf,
  primaryCatOf,
  catKey,
} from "./categories";
import Theater from "./Theater";
import TimelineCategoryFilters from "./TimelineCategoryFilters";
import TimelineDisplayControls from "./TimelineDisplayControls";
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

// ---- 社会人の年齢ラベル色 ----
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
  if (stage?.key !== "adult" && stage?.key !== "retired") {
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

// ---- 最近の追加(aフィールドの日付が新しいものを拾う) ----
const RECENT = (() => {
  const dated = EVENTS.filter((e) => e.a);
  if (!dated.length) return null;
  const latest = dated.reduce((m, e) => (e.a > m ? e.a : m), "");
  const items = dated.filter((e) => e.a === latest).sort((x, y) => x.y - y.y);
  // 年代が偏らないよう、範囲全体から等間隔に抜き出して見出しに出す
  const N = Math.min(6, items.length);
  const picks = Array.from({ length: N }, (_, i) =>
    items[Math.round((i * (items.length - 1)) / Math.max(1, N - 1))]
  );
  return { date: latest, items, picks };
})();

// ---- 最近の新機能(手で追記する) ----
const FEATURES = [];

// ---- 共有 ----
const APP_TITLE = CONFIG.title || "自分史プロジェクション";
const HASHTAG = CONFIG.hashtag ?? "#自分史プロジェクション";
const DOWNLOAD_URL = String(CONFIG.downloadUrl || "").trim();

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

// ---- テーマの糸(年表に散らばった項目を、一本の流れとして自動再生する) ----
// 新しい定義は永久ID { id } で参照する。
// 旧 threads.js の { y, m } 形式も移行中は読み込めるようにしておく。
const resolveThreadItem = ({ id, y, m }) => {
  if (id) {
    return EVENTS.find((e) => e.id === id);
  }
  return EVENTS.find((e) => e.y === y && e.t.includes(m));
};

const THREAD_LIST = THREADS.map((th) => ({
  ...th,
  events: th.items.map(resolveThreadItem).filter(Boolean),
})).filter((th) => th.events.length > 1);

const findThread = (key) => THREAD_LIST.find((t) => t.key === key) || null;

// 背景に流す同時代の項目の色(暗い画面で読めるよう、カテゴリー色を明るくしたもの)
// ---- 保存(ブラウザのみ。使えない環境では黙ってメモリ動作) ----
const SAVED =
  (typeof window !== "undefined" &&
    settingsStore.load()) ||
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
    earlyChildhoodHistory,
    updateEarlyChildhoodHistory,
    higherEducationHistory,
    updateHigherEducationHistory,
    graduateEducationHistory,
    updateGraduateEducationHistory,
    firstHigherYear,
    firstHigherType,
    firstGraduateYear,
    firstGraduateType,
    adultPeriodsEnabled,
    adultPeriods,
    lifeSettingsStatus,
    lifeSettingsFileInputRef,
    importLifeSettingsFile,
    exportLifeSettingsFile,
    setAdultPeriodSplittingEnabled,
    resetAdultPeriods,
    updateAdultPeriod,
    addAdultPeriod,
    removeAdultPeriod,
  } = useLifeSettings({
    initialBirth: INITIAL_BIRTH,
    initialMonth: INITIAL_MONTH,
    initialEducation: INITIAL_EDUCATION,
    savedAdultPeriodsEnabled:
      SAVED.adultPeriodsEnabled ?? false,
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
    loadServerPersonalEvents,
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
    catOn,
    toggleCat,
    toggleSfOnly,
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
    speed,
    cyclePlaybackSpeed,
  } = useDisplaySettings({
    saved: SAVED,
    mainCategories: MAIN_CATS,
    initialClosedStages:
      preBirthPeriodsOf(INITIAL_BIRTH).map(
        (period) => period.key
      ),
  });

  const [showMe, setShowMe] = useState(false);
  // 再生中のテーマ(nullなら年表を表示)
  const [thread, setThread] = useState(null);
  // 年表内検索は一時的な表示条件として扱い、ブラウザ保存はしない。
  const [searchText, setSearchText] = useState("");
  useEffect(() => {
    settingsStore.save({
      birth,
      month,
      earlyChildhoodHistory,
      higherEducationHistory,
      graduateEducationHistory,
      adultPeriodsEnabled,
      adultPeriods,
      catOff,
      sfOnly,
      importanceMin,
      closed: [...closedStages],
      setupOpen,
      speed,
    });
  }, [birth, month, earlyChildhoodHistory, higherEducationHistory, graduateEducationHistory, adultPeriodsEnabled, adultPeriods, catOff, sfOnly, importanceMin, closedStages, setupOpen, speed]);

  const toggleMyEvents = () => {
    setShowMe((value) => !value);
  };

  // ?e=<項目ID> で共有されたリンクは、その項目を開いた状態で表示する
  // ?t=<テーマのキー> ならそのテーマの再生を開いた状態で始める
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
          chars: a.chars + [...(e.n || "")].length,
        }),
        { count: 0, chars: 0 }
      ),
    [effectiveEvents]
  );

  const grouped = useTimelineModel({
    birth,
    month,
    earlyChildhoodHistory,
    higherEducationHistory,
    graduateEducationHistory,
    adultPeriodsEnabled,
    adultPeriods,
    personalEvents: myEvents,
    publicEvents: effectiveEvents,
    catOff,
    sfOnly,
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

  const threadWindowMode =
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).get("threads") === "1";

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

  if (threadWindowMode) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#fafaf8",
          fontFamily: font,
          color: "#22272e",
        }}
      >
        <div
          style={{
            maxWidth: 680,
            margin: "0 auto",
            padding: "28px 18px 48px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              marginBottom: 18,
            }}
          >
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontSize: 11,
                  letterSpacing: "0.2em",
                  color: "#8a8f98",
                }}
              >
                {APP_TITLE}
              </div>

              <h1
                style={{
                  fontSize: 24,
                  margin: "5px 0 0",
                  color: "#374151",
                }}
              >
                テーマの糸
              </h1>
            </div>

            <button
              type="button"
              onClick={() => window.close()}
              style={miniBtn}
            >
              ×閉じる
            </button>
          </div>

          <div
            style={{
              fontSize: 12.5,
              lineHeight: 1.8,
              color: "#6b7280",
              marginBottom: 16,
            }}
          >
            関連する出来事を一本の流れとしてたどります。
            テーマを選ぶと、自動送りの再生画面が始まります。
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
              gap: 10,
            }}
          >
            {THREAD_LIST.map((th, index) => {
              const threadColors = [
                ["#f7f3ee", "#ddd1c3"],
                ["#f1f5f2", "#cddbd2"],
                ["#f3f4f8", "#d2d5e2"],
                ["#f7f2f5", "#dfd1da"],
                ["#f5f5ef", "#d9d9c8"],
                ["#f1f5f7", "#cbd8de"],
                ["#f7f4ef", "#ddd3c5"],
                ["#f3f2f7", "#d5d0df"],
                ["#f2f6f3", "#cedbd2"],
                ["#f6f2f2", "#ddcfcf"],
              ];
              const [background, border] =
                threadColors[index % threadColors.length];

              return (
              <button
                key={th.key}
                type="button"
                onClick={() => setThread(th)}
                style={{
                  fontFamily: font,
                  textAlign: "left",
                  cursor: "pointer",
                  padding: "12px 14px",
                  borderRadius: 10,
                  border: `1px solid ${border}`,
                  background,
                  color: "#4b5563",
                }}
              >
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 800,
                    color: "#4B56A6",
                  }}
                >
                  ▶ {th.title}
                </div>

                <div
                  style={{
                    marginTop: 5,
                    fontSize: 11,
                    lineHeight: 1.6,
                    color: "#6b7280",
                  }}
                >
                  {th.events.length}項目
                </div>
              </button>
              );
            })}
          </div>
        </div>

        {thread && (
          <Theater
            thread={thread}
            gradeLabel={grouped.gradeLabel}
            birth={birth}
            allEvents={EVENTS}
            hashtag={HASHTAG}
            shareUrl={SHARE_URL}
            speed={speed}
            onCycleSpeed={cyclePlaybackSpeed}
            onClose={() => setThread(null)}
          />
        )}
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#fafaf8", fontFamily: font, color: "#22272e" }}>
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "28px 16px 64px" }}>
        {/* ヘッダー */}
        <header style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, letterSpacing: "0.25em", color: "#8a8f98", marginBottom: 6 }}>
            6つのテーマでたどる、自分の時代
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
                text={`${APP_TITLE}——6つのテーマで時代を自分の年齢から読む(${EVENTS.length}項目) ${HASHTAG}`}
              />
            </div>
          </div>
          <div style={{ fontSize: 11.5, color: "#8a8f98", marginTop: 8, fontFamily: mono }}>
            全{effectiveStats.count}項目・解説{effectiveStats.chars.toLocaleString()}字
          </div>
          {RECENT && (
            <div
              style={{
                marginTop: 8, fontSize: 11.5, lineHeight: 1.7, color: "#6b7280",
                background: "#fdf3e0", border: "1px solid #efe0c0",
                borderRadius: 8, padding: "7px 12px",
              }}
            >
              <span style={{ fontWeight: 700, color: "#8a5a12" }}>
                最近の追加({RECENT.date}・{RECENT.items.length}項目)
              </span>{" "}
              {RECENT.picks.map((e, i) => (
                <span key={eventId(e)}>
                  {i > 0 && " / "}
                  <a
                    href={`?e=${eventId(e)}`}
                    style={{ color: "#6b7280", textDecoration: "none", borderBottom: "1px dotted #b0771e" }}
                  >
                    {e.y} {e.t.replace(/[((].*$/, "")}
                  </a>
                </span>
              ))}
              {RECENT.items.length > RECENT.picks.length &&
                ` ほか${RECENT.items.length - RECENT.picks.length}件`}
            </div>
          )}
          {FEATURES.length > 0 && (
            <div
              style={{
                marginTop: 6, fontSize: 11.5, lineHeight: 1.7, color: "#6b7280",
                background: "#eef1f5", border: "1px solid #dde2e8",
                borderRadius: 8, padding: "7px 12px",
              }}
            >
              <span style={{ fontWeight: 700, color: "#37414f" }}>最近の新機能</span>{" "}
              {FEATURES.slice(0, 2).map((f, i) => (
                <span key={i}>
                  {i > 0 && " / "}
                  <span style={{ fontFamily: mono, fontSize: 10.5 }}>{f.d}</span> {f.t}
                </span>
              ))}
            </div>
          )}
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

          <TimelineCategoryFilters
            mainCategories={MAIN_CATS}
            catOn={catOn}
            toggleCat={toggleCat}
            sfOnly={sfOnly}
            toggleSfOnly={toggleSfOnly}
            showMe={showMe}
            toggleMyEvents={toggleMyEvents}
            openThreadWindow={openThreadWindow}
            font={font}
          />
          </div>
          <TimelineDisplayControls
            groups={grouped.groups}
            birth={birth}
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
                  : `${g.items[0].y}–${g.items[g.items.length - 1].y}`}
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
                const backgroundEra = backgroundEraOf(ev.y);
                const previousBackgroundEra =
                  i > 0
                    ? backgroundEraOf(g.items[i - 1].y)
                    : null;

                const showBackgroundHeading =
                  backgroundEra &&
                  (
                    i === 0 ||
                    previousBackgroundEra?.key !== backgroundEra.key
                  );

                const backgroundHeading =
                  showBackgroundHeading ? (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        flexWrap: "wrap",
                        padding: "7px 10px 7px 58px",
                        borderTop: "2px solid #758395",
                        borderBottom: "1px solid #d3dae2",
                        background:
                          "linear-gradient(90deg, #e9eef3 0%, #f7f8fa 80%)",
                        color: "#3f4b59",
                      }}
                    >
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          padding: "2px 7px",
                          borderRadius: 999,
                          background: "#748294",
                          color: "#fff",
                          fontSize: 10.5,
                          fontWeight: 800,
                          letterSpacing: "0.05em",
                          lineHeight: 1.4,
                        }}
                      >
                        背景史
                      </span>

                      <strong
                        style={{
                          fontSize: 13,
                          fontWeight: 800,
                          color: "#384553",
                        }}
                      >
                        {backgroundEra.label}
                      </strong>

                      <span
                        style={{
                          fontFamily: mono,
                          fontSize: 11,
                          fontWeight: 600,
                          color: "#78838f",
                        }}
                      >
                        {backgroundEra.from}–
                        {Number.isFinite(backgroundEra.to)
                          ? backgroundEra.to
                          : ""}
                      </span>
                    </div>
                  ) : null;

                const japaneseEra = japaneseEraOf(ev.y);
                const previousJapaneseEra =
                  i > 0
                    ? japaneseEraOf(g.items[i - 1].y)
                    : null;

                const showJapaneseEraHeading =
                  japaneseEra &&
                  (
                    i === 0 ||
                    previousJapaneseEra?.key !== japaneseEra.key
                  );

                const japaneseEraHeading =
                  showJapaneseEraHeading ? (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        flexWrap: "wrap",
                        padding: "6px 10px 6px 58px",
                        borderTop: "2px solid #957782",
                        borderBottom: "1px solid #e0d4d9",
                        background:
                          "linear-gradient(90deg, #f2e9ed 0%, #faf8f9 80%)",
                        color: "#56434a",
                      }}
                    >
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          padding: "2px 7px",
                          borderRadius: 999,
                          background: "#91717c",
                          color: "#fff",
                          fontSize: 10.5,
                          fontWeight: 800,
                          letterSpacing: "0.05em",
                          lineHeight: 1.4,
                        }}
                      >
                        元号
                      </span>

                      <strong
                        style={{
                          fontSize: 13,
                          fontWeight: 800,
                          color: "#503d44",
                        }}
                      >
                        {japaneseEra.label}
                      </strong>

                      <span
                        style={{
                          fontFamily: mono,
                          fontSize: 11,
                          fontWeight: 600,
                          color: "#89737b",
                        }}
                      >
                        {japaneseEra.from}–
                        {Number.isFinite(japaneseEra.to)
                          ? japaneseEra.to
                          : ""}
                      </span>
                    </div>
                  ) : null;

                const halfCenturyMarker =
                  halfCenturyMarkerOf(ev.y);

                const previousHalfCenturyMarker =
                  i > 0
                    ? halfCenturyMarkerOf(g.items[i - 1].y)
                    : null;

                const showHalfCenturyHeading =
                  halfCenturyMarker &&
                  (
                    i === 0 ||
                    previousHalfCenturyMarker?.key !== halfCenturyMarker.key
                  );

                const halfCenturyHeading =
                  showHalfCenturyHeading ? (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        flexWrap: "wrap",
                        padding: "6px 10px 6px 58px",
                        borderTop: "2px solid #8d949e",
                        borderBottom: "1px solid #dadde2",
                        background:
                          "linear-gradient(90deg, #eff1f4 0%, #fafafa 80%)",
                        color: "#555e69",
                      }}
                    >
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          padding: "2px 7px",
                          borderRadius: 999,
                          background: "#8d949e",
                          color: "#fff",
                          fontSize: 10.5,
                          fontWeight: 800,
                          letterSpacing: "0.05em",
                          lineHeight: 1.4,
                        }}
                      >
                        世紀
                      </span>

                      <strong
                        style={{
                          fontSize: 13,
                          fontWeight: 800,
                          color: "#4f5863",
                        }}
                      >
                        {halfCenturyMarker.label}
                      </strong>

                      <span
                        style={{
                          fontFamily: mono,
                          fontSize: 11,
                          fontWeight: 600,
                          color: "#808892",
                        }}
                      >
                        {halfCenturyMarker.from}–
                        {halfCenturyMarker.to}
                      </span>
                    </div>
                  ) : null;

                if (ev.cat === "me") {
                  const id = eventId(ev);
                  const isOpen = isEventOpen(id);
                  return (
                    <li
                      key={ev.id}
                      id={`ev-${id}`}
                      style={{ borderBottom: "1px solid #ececea", background: "#f2faf6" }}
                    >
                      {backgroundHeading}
                      {halfCenturyHeading}
                      {japaneseEraHeading}
                      <button
                        onClick={() => toggleEvent(id)}
                        aria-expanded={isOpen}
                        style={{
                          display: "flex", alignItems: "flex-start", gap: 10,
                          padding: "8px 4px", width: "100%", textAlign: "left",
                          background: "none", border: "none", cursor: "pointer",
                          fontFamily: font,
                        }}
                      >
                        <span style={{ fontFamily: mono, fontSize: 13, color: "#8a8f98", width: 44, flexShrink: 0, paddingTop: 3 }}>
                          {ev.y}
                        </span>
                        <span
                          style={{
                            flexShrink: 0, minWidth: 44, textAlign: "center",
                            fontSize: 13, fontWeight: 800,
                            ...gradeBadgeStyle(g.stage, ev.age),
                            borderRadius: 6, padding: "3px 8px",
                          }}
                        >
                          {grouped.gradeLabel(ev.y)}
                        </span>
                        <Icon name={ev.ic ?? "flag"} color={CAT.me.bg} />
                        <span style={{ fontSize: 14, lineHeight: 1.55, flex: 1, fontWeight: 700, color: CAT.me.bg }}>
                          {ev.t}
                        </span>
                        <span
                          style={{
                            fontSize: 11, color: "#b0b4bb", paddingTop: 4, flexShrink: 0,
                            transform: isOpen ? "rotate(90deg)" : "none",
                            transition: "transform 0.15s",
                          }}
                          aria-hidden="true"
                        >
                          ▶
                        </span>
                      </button>

                      {isOpen && personalEventsSource === "browser" && (
                        <div
                          style={{
                            display: "flex",
                            gap: 8,
                            margin: "0 4px 8px 108px",
                          }}
                        >
                          <button
                            type="button"
                            onClick={() => startEditingPersonalEvent(ev)}
                            style={miniBtn}
                          >
                            修正
                          </button>

                          <button
                            type="button"
                            onClick={() => deletePersonalEvent(ev)}
                            style={{
                              ...miniBtn,
                              color: "#9b2c2c",
                              border: "1px solid #d8a4a4",
                              background: "#fff7f7",
                            }}
                          >
                            削除
                          </button>
                        </div>
                      )}

                      {isOpen && ev.n && (
                        <div
                          style={{
                            margin: "0 4px 10px 108px",
                            padding: "10px 14px",
                            fontSize: 13, lineHeight: 1.75, color: "#3d4450",
                            background: g.stage.bg,
                            borderLeft: `3px solid ${CAT.me.bg}`,
                            borderRadius: "0 8px 8px 0",
                          }}
                        >
                          <div
                            style={{
                              marginBottom: 6, fontSize: 11.5, fontWeight: 700,
                              color: "#6b7280",
                            }}
                          >
                            日付：{formatEventDate(ev.date)}
                          </div>
                          {ev.n}

                          {ev.note && (
                            <div
                              style={{
                                marginTop: 9, padding: "7px 10px",
                                border: "1px solid #d8dce2", borderRadius: 7,
                                background: "#ffffff88", color: "#626974",
                                fontSize: 11.5, lineHeight: 1.65,
                              }}
                            >
                              <span style={{ fontWeight: 800 }}>補足：</span>
                              {ev.note}
                            </div>
                          )}
                        </div>
                      )}
                    </li>
                  );
                }
                const id = eventId(ev);
                const isOpen = isEventOpen(id);
                const grade = grouped.gradeLabel(ev.y);
                const shareText =
                  (ev.age < 0
                    ? `${ev.y}年(生まれる前)`
                    : `${ev.y}年・${grade}のとき`) + `:${ev.t} ${HASHTAG}`;
                const secondaryCats = (ev.cats ?? []).filter(
                  (category) => category !== ev.cat
                );
                const isAdded = (
                  eventCustomizations.additions ?? []
                ).some((item) => item.id === id);
                const isEditing = editingEventId === id;
                return (
                  <li key={i} id={`ev-${id}`} style={{ borderBottom: "1px solid #ececea" }}>
                    {backgroundHeading}
                    {halfCenturyHeading}
                    {japaneseEraHeading}
                    <button
                      onClick={() => toggleEvent(id)}
                      aria-expanded={isOpen}
                      style={{
                        display: "flex", alignItems: "flex-start", gap: 10,
                        padding: "8px 4px", width: "100%", textAlign: "left",
                        background: "none", border: "none", cursor: "pointer",
                        fontFamily: font, color: "#22272e",
                      }}
                    >
                      <span
                        style={{
                          fontFamily: mono, fontSize: 13, color: "#8a8f98",
                          width: 44, flexShrink: 0, paddingTop: 3,
                        }}
                      >
                        {ev.y}
                      </span>
                      <span
                        style={{
                          flexShrink: 0, minWidth: 44, textAlign: "center",
                          fontSize: 13, fontWeight: 800,
                          ...gradeBadgeStyle(g.stage, ev.age),
                          borderRadius: 6, padding: "3px 8px",
                        }}
                      >
                        {grade}
                      </span>
                      <ImportanceBadge level={ev.importance} />
                      <Icon name={ev.ic} color={CAT[ev.cat].bg} />

                      <span style={{ fontSize: 14, lineHeight: 1.55, flex: 1 }}>
                        {ev.cats?.includes("sf") && (
                          <span
                            title="SF作品"
                            aria-label="SF作品"
                            style={{
                              display: "inline-block",
                              marginRight: 6,
                              padding: "1px 5px",
                              borderRadius: 5,
                              fontSize: 10.5,
                              lineHeight: 1.4,
                              fontWeight: 800,
                              letterSpacing: 0.2,
                              color: CAT.sf.fg,
                              background: CAT.sf.bg,
                              verticalAlign: 1,
                            }}
                          >
                            ＊SF
                          </span>
                        )}
                        {ev.t}
                      </span>

                      {secondaryCats.length > 0 && (
                        <span
                          style={{
                            display: "inline-flex",
                            gap: 3,
                            alignItems: "center",
                            flexShrink: 0,
                            paddingTop: 7,
                          }}
                          aria-label={`副分類: ${secondaryCats
                            .map((k) => CAT[k]?.label)
                            .filter(Boolean)
                            .join("・")}`}
                        >
                          {secondaryCats.map((k) => (
                            <span
                              key={k}
                              title={CAT[k]?.label || k}
                              style={{
                                display: "inline-block",
                                width: 7,
                                height: 7,
                                borderRadius: "50%",
                                background: CAT[k]?.bg || "#999",
                              }}
                            />
                          ))}
                        </span>
                      )}

                      <span
                        style={{
                          fontSize: 11, color: "#b0b4bb", paddingTop: 4, flexShrink: 0,
                          transform: isOpen ? "rotate(90deg)" : "none",
                          transition: "transform 0.15s",
                        }}
                        aria-hidden="true"
                      >
                        ▶
                      </span>
                    </button>
                    {isOpen && ev.n && (
                      <div
                        style={{
                          margin: "0 4px 10px 108px",
                          padding: "10px 14px",
                          fontSize: 13, lineHeight: 1.75, color: "#3d4450",
                          background: g.stage.bg,
                          borderLeft: `3px solid ${CAT[ev.cat].bg}`,
                          borderRadius: "0 8px 8px 0",
                        }}
                      >
                        <div
                          style={{
                            marginBottom: 6, fontSize: 11.5, fontWeight: 700,
                            color: "#6b7280",
                          }}
                        >
                          日付：{formatEventDate(ev.date)}
                        </div>
                        {ev.n}
                        <EventReferenceLinks
                          query={ev.q}
                          links={ev.l}
                          color={CAT[ev.cat].bg}
                        />
                        {ev.note && (
                          <div
                            style={{
                              marginTop: 9, padding: "7px 10px",
                              border: "1px solid #d8dce2", borderRadius: 7,
                              background: "#ffffff88", color: "#626974",
                              fontSize: 11.5, lineHeight: 1.65,
                            }}
                          >
                            <span style={{ fontWeight: 800 }}>補足：</span>
                            {ev.note}
                          </div>
                        )}
                        <EventCustomizationActions
                          isAdded={isAdded}
                          isEditing={isEditing}
                          onDeleteAdded={() => deleteAddedEvent(ev)}
                          onStartEditing={() => startEditingEvent(ev)}
                          onHide={() => hideEvent(ev)}
                          hashtag={HASHTAG}
                          color={CAT[ev.cat].bg}
                          shareText={shareText}
                          note={ev.n}
                          shareUrl={`${SHARE_URL}?e=${encodeURIComponent(id)}`}
                          miniBtn={miniBtn}
                        />
                        {isEditing && (
                          <EventCustomizationEditForm
                            draft={eventEditDraft}
                            updateDraft={updateEventEditDraft}
                            onSave={() => saveEditedEvent(ev)}
                            onCancel={cancelEditingEvent}
                            font={font}
                            miniBtn={miniBtn}
                          />
                        )}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
            )}
          </section>
        );
        })}

        <div
          id="timeline-customization"
          style={{
            scrollMarginTop: 16,
            background: "#f3f7fb",
            border: "1px solid #cfdce8",
            borderRadius: 12,
            padding: "12px 16px",
            marginTop: 16,
            marginBottom: 14,
          }}
        >
          <EventCustomizationControls
            overrideCount={Object.keys(eventCustomizations.overrides ?? {}).length}
            hiddenCount={eventCustomizations.hidden?.length ?? 0}
            additionCount={eventCustomizations.additions?.length ?? 0}
            eventCustomizationStatus={eventCustomizationStatus}
            eventCustomizationEditorOpen={eventCustomizationEditorOpen}
            eventCustomizationFileInputRef={eventCustomizationFileInputRef}
            importEventCustomizationsFile={importEventCustomizationsFile}
            exportEventCustomizationsFile={exportEventCustomizationsFile}
            toggleEventCustomizationEditor={toggleEventCustomizationEditor}
            clearEventCustomizations={clearEventCustomizations}
            miniBtn={miniBtn}
          />

          {eventCustomizationEditorOpen && (
            <div
              style={{
                marginTop: 12,
                padding: 12,
                border: "1px solid #cfdce8",
                borderRadius: 10,
                background: "#fff",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <strong style={{ fontSize: 12, color: "#365f7d" }}>
                  年表の変更内容を編集
                </strong>

                <span style={{ flex: 1 }} />

                <button
                  type="button"
                  onClick={openNewEventForm}
                  style={{
                    ...miniBtn,
                    background: "#e7f1fb",
                    border: "1px solid #91b3d2",
                    color: "#315f87",
                    fontWeight: 800,
                  }}
                >
                  ＋追加
                </button>

                <button
                  type="button"
                  onClick={closeEventCustomizationEditor}
                  style={{
                    ...miniBtn,
                    marginLeft: 6,
                  }}
                >
                  ×閉じる
                </button>
              </div>
            </div>
          )}

          {eventCustomizationEditorOpen && eventAddOpen && (
            <EventCustomizationAddForm
              draft={eventAddDraft}
              categoryOptions={MAIN_CATS.map((key) => ({
                key,
                label: CAT[key].label,
              }))}
              updateDraft={updateEventAddDraft}
              saveAddedEvent={saveAddedEvent}
              cancelAddingEvent={cancelAddingEvent}
              font={font}
              miniBtn={miniBtn}
            />
          )}

          {eventCustomizationEditorOpen &&
            (eventCustomizations.hidden?.length ?? 0) > 0 && (
            <EventCustomizationHiddenList
              items={eventCustomizations.hidden.map((id) => {
                const base = EVENTS.find(
                  (event) => event.id === id
                );
                return {
                  id,
                  label: base
                    ? `${base.y} ${base.t}`
                    : id,
                };
              })}
              restoreHiddenEvent={restoreHiddenEvent}
              miniBtn={miniBtn}
            />
          )}

        </div>

        <div
          id="personal-history"
          style={{
            scrollMarginTop: 16,
            background: "#f7f2fb",
            border: "1px solid #dfd2ea",
            borderRadius: 12,
            padding: "12px 16px",
            marginTop: 16,
            marginBottom: 14,
          }}
        >
          <PersonalHistoryControls
            eventCount={myEvents.length}
            personalEventsSource={personalEventsSource}
            personalEditorOpen={personalEditorOpen}
            personalFileInputRef={personalFileInputRef}
            importPersonalEventsFile={importPersonalEventsFile}
            exportPersonalEventsFile={exportPersonalEventsFile}
            togglePersonalEditor={togglePersonalEditor}
            clearPersonalEventsFile={clearPersonalEventsFile}
            loadServerPersonalEvents={loadServerPersonalEvents}
            titleColor={CAT.me.bg}
            miniBtn={miniBtn}
          />

          {personalEditorOpen && personalEventsSource !== "server" && (
            <PersonalHistoryEditorList
              events={myEvents}
              openNewPersonalEventForm={openNewPersonalEventForm}
              closePersonalEditor={closePersonalEditor}
              startEditingPersonalEvent={startEditingPersonalEvent}
              deletePersonalEvent={deletePersonalEvent}
              miniBtn={miniBtn}
            />
          )}

          {personalAddOpen && personalEventsSource !== "server" && (
            <PersonalHistoryEventForm
              draft={personalDraft}
              isEditing={Boolean(editingPersonalId)}
              updateDraft={updatePersonalDraft}
              savePersonalEvent={savePersonalEvent}
              closePersonalEventForm={closePersonalEventForm}
              font={font}
              miniBtn={miniBtn}
            />
          )}

          {personalEventsSource === "server" && (
            <div
              style={{
                fontSize: 10.5,
                lineHeight: 1.6,
                color: "#8a6a3d",
                marginTop: 8,
              }}
            >
              管理者データを表示中はブラウザ側の追加・編集を行いません。
            </div>
          )}

          {personalFileStatus && (
            <div
              role="status"
              style={{
                fontSize: 11,
                lineHeight: 1.6,
                color: "#6b7280",
                marginTop: 8,
              }}
            >
              {personalFileStatus}
            </div>
          )}
        </div>

        <div
          id="timeline-settings"
          style={{
            scrollMarginTop: 16,
            background: "#fff",
            border: "1px solid #e2e4e8",
            borderRadius: 12,
            marginBottom: 14,
            overflow: "hidden",
          }}
        >
        {/* 入力欄(畳めるようにしている) */}
        <button
          onClick={toggleSetup}
          aria-expanded={setupOpen}
          style={{
            display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", width: "100%",
            background: "#fff",
            border: "none",
            borderBottom: setupOpen ? "1px solid #e2e4e8" : "none",
            borderRadius: 0,
            padding: "10px 16px",
            cursor: "pointer", textAlign: "left", fontFamily: font, color: "#22272e",
          }}
        >
          <span
            style={{
              flexBasis: "100%",
              fontSize: 14,
              fontWeight: 800,
            }}
          >
            ①あなたの設定
          </span>
          <span
            style={{
              fontSize: 11.5,
              lineHeight: 1.7,
              color: "#6b7280",
            }}
          >
            {birth}年{month ? `${month}月` : ""}生まれ
            {firstHigherYear
              ? `・${firstHigherYear}年 ${HIGHER_ED_TYPES[firstHigherType]?.label}`
              : ""}
            {firstGraduateYear
              ? `・${firstGraduateYear}年 大学院（${GRADUATE_TYPES[firstGraduateType]?.label}）`
              : ""}
            ・成人期{grouped.adultYear}年〜（自動）
            {adultPeriodsEnabled
              ? `・社会人区分${adultPeriods.length}件`
              : ""}
          </span>
          <span style={{ flex: 1 }} />
          <span style={{ fontSize: 11, color: "#8a8f98" }}>{setupOpen ? "畳む ▼" : "変更する ▶"}</span>
        </button>

        {setupOpen && (<>
        {/* 生年入力 */}
        <BirthSettingsEditor
          birth={birth}
          month={month}
          adjustBirthYear={adjustBirthYear}
          setBirthYear={setBirthYear}
          setBirthMonth={setBirthMonth}
          font={font}
          mono={mono}
          btnStyle={btnStyle}
        />
        {/* 幼保・大学等・大学院の複数行教育歴 */}
        <div
          style={{
            display: "flex", alignItems: "center", gap: 0, flexWrap: "wrap",
            padding: "12px 16px 14px",
          }}
        >
          <EducationHistoryEditor
            earlyChildhoodHistory={earlyChildhoodHistory}
            higherEducationHistory={higherEducationHistory}
            graduateEducationHistory={graduateEducationHistory}
            onEarlyChildhoodHistoryChange={updateEarlyChildhoodHistory}
            onHigherEducationHistoryChange={updateHigherEducationHistory}
            onGraduateEducationHistoryChange={updateGraduateEducationHistory}
          />

          <AdultPeriodsEditor
            adultPeriodsEnabled={adultPeriodsEnabled}
            adultPeriods={adultPeriods}
            adultYear={grouped.adultYear}
            adultPeriodErrors={grouped.adultPeriodErrors}
            setAdultPeriodSplittingEnabled={setAdultPeriodSplittingEnabled}
            resetAdultPeriods={resetAdultPeriods}
            updateAdultPeriod={updateAdultPeriod}
            addAdultPeriod={addAdultPeriod}
            removeAdultPeriod={removeAdultPeriod}
            font={font}
            mono={mono}
            miniBtn={miniBtn}
          />

          <LifeSettingsFileControls
            lifeSettingsStatus={lifeSettingsStatus}
            lifeSettingsFileInputRef={lifeSettingsFileInputRef}
            importLifeSettingsFile={importLifeSettingsFile}
            exportLifeSettingsFile={exportLifeSettingsFile}
            miniBtn={miniBtn}
          />

          {grouped.warnings.length > 0 && (
            <div
              role="alert"
              style={{
                width: "100%", padding: "8px 10px", borderRadius: 8,
                background: "#fff3f1", color: "#a13d31", fontSize: 11.5,
                lineHeight: 1.7,
              }}
            >
              {grouped.warnings.map((warning) => (
                <div key={warning}>{warning}</div>
              ))}
            </div>
          )}
        </div>

        </>)}

        </div>

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

          {DOWNLOAD_URL && (
            <div
              style={{
                marginTop: 10,
                paddingTop: 10,
                borderTop: "1px solid #eceef1",
              }}
            >
              <a
                href={DOWNLOAD_URL}
                download="koshix-timeline-starter.zip"
                style={{ color: "#59616c" }}
              >
                ダウンロード版
              </a>
              <span style={{ marginLeft: 8 }}>
                自分の年表としてWebサーバーへ設置できる静的Web版です。
              </span>
            </div>
          )}

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
          allEvents={EVENTS}
          hashtag={HASHTAG}
          shareUrl={SHARE_URL}
          speed={speed}
          onCycleSpeed={cyclePlaybackSpeed}
          onClose={() => setThread(null)}
        />
      )}
    </div>
  );
}

const segmentBtnStyle = (selected, color, soft) => ({
  fontFamily: "inherit",
  fontSize: 12,
  fontWeight: 700,
  cursor: "pointer",
  padding: "6px 11px",
  borderRadius: 999,
  border: `1.5px solid ${selected ? color : "#d5d8dd"}`,
  background: selected ? soft : "#fff",
  color: selected ? color : "#6b7280",
});

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
