import { useState } from "react";
import { eventYear } from "./event-schema.js";
import { CAT } from "./categories";
import Icon from "./Icon";
import { resolvePublicEventIcon } from "./event-icon.js";
import Theater from "./Theater";
import useDynamicThreads from "./useDynamicThreads.js";

const THREAD_COLORS = [
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


const THREAD_ACCENTS = [
  "#D05A00",
  "#16835A",
  "#3F63D8",
  "#B0448B",
  "#7A8A00",
  "#0088A8",
  "#C06A00",
  "#7B52B9",
  "#169B72",
  "#C84444",
];

const THEME_KEYWORDS = Object.freeze({
  "space-and-universe": "宇宙",
  "energy-and-earth": "地球",
  "computing-to-ai": "プログラム",
  "connected-world": "通信網",
  "war-and-order": "ルール",
  "global-economy": "モノ",
  "learning-systems": "学ぶ",
  "empire-decolonization": "帝国",
  "mechanics-as-math": "運動",
  "heat-to-probability": "確率",
  "inside-the-atom": "原子",
  "mathematical-abstraction": "構造",
  "instruments-open-worlds": "装置",
  "life-earth-system": "系",
  "epidemics-public-health": "感染症",
  "read-write-genome": "遺伝子",
  "ai-boom-winter-revival": "AI",
  "vacuum-tube-to-pocket-computer": "真空管",
  "electricity-into-society": "電気",
  "record-copy-store": "複製",
  "speed-mobility-navigation": "速く",
  "standardize-the-world": "共通規格",
  "women-gender-rights": "女",
  "labor-to-welfare-state": "働く",
  "democracy-expands-and-retreats": "人民",
  "nuclear-age": "原子核",
  "cold-war-world-system": "二つ",
  "money-finance-crises": "お金",
  "media-public-sphere": "世論",
  "music-becomes-media": "メディア",
  "moving-images": "映像",
  "art-breaks-representation": "絵らしさ",
  "architecture-design-modern-life": "生活",
  "publishing-to-web": "出版",
  "world-literature": "小説",
  "japanese-literature": "日本語",
  "sf-as-thought-experiment": "もしも",
  "food-becomes-system": "食べる",
  "population-family-policy": "家族",
  "postwar-japan-daily-life": "ふつう",
  "statistics-makes-world-legible": "数字",
  "modern-thought-rethinks-society": "言葉",
  "mind-becomes-science": "心",
  "chemistry-builds-matter": "物質",
  "faith-conflict-toleration": "寛容",
  "modern-japan-state": "近代国家",
  "life-as-chemistry": "化学反応",
  "music-breaks-its-form": "音楽",
});

const renderThemeTitle = (item, accent) => {
  const keyword = THEME_KEYWORDS[item.key];

  if (!keyword) return item.title;

  const start = item.title.indexOf(keyword);

  if (start < 0) return item.title;

  return (
    <>
      {item.title.slice(0, start)}
      <span
        style={{
          color: accent,
          fontSize: "1.35em",
          fontWeight: 900,
        }}
      >
        {keyword}
      </span>
      {item.title.slice(start + keyword.length)}
    </>
  );
};

const font =
  '"Hiragino Kaku Gothic ProN", "Hiragino Sans", "Yu Gothic Medium", "Noto Sans JP", sans-serif';

const miniBtn = {
  fontFamily: font,
  fontSize: 11,
  fontWeight: 700,
  cursor: "pointer",
  padding: "4px 10px",
  borderRadius: 999,
  border: "1px solid #d5d8dd",
  background: "#fff",
  color: "#6b7280",
};

const eventSubs = (event) => {
  if (Array.isArray(event?.subs)) {
    return [...new Set(event.subs.filter(Boolean))];
  }

  if (typeof event?.subs === "string") {
    return [
      ...new Set(
        event.subs
          .split("|")
          .map((item) => item.trim())
          .filter(Boolean)
      ),
    ];
  }

  return [];
};

const themeVisualSummary = (events) => {
  const primaryStats = new Map();
  const subStats = new Map();

  events.forEach((event, index) => {
    const primary =
      event.primary && CAT[event.primary]
        ? event.primary
        : "society";

    const primaryStat =
      primaryStats.get(primary) || {
        count: 0,
        first: index,
      };

    primaryStat.count += 1;
    primaryStats.set(primary, primaryStat);

    eventSubs(event).forEach((sub) => {
      const subStat =
        subStats.get(sub) || {
          count: 0,
          first: index,
          icons: new Map(),
        };

      subStat.count += 1;

      // このsub単独だった場合の表示アイコンを求める。
      // politics / literature / rights / technology /
      // matter / visual / life の派生アイコンも既存規則に従う。
      const iconName = resolvePublicEventIcon({
        ...event,
        subs: [sub],
      });

      const iconStat =
        subStat.icons.get(iconName) || {
          count: 0,
          first: index,
        };

      iconStat.count += 1;
      subStat.icons.set(iconName, iconStat);

      subStats.set(sub, subStat);
    });
  });

  const dominantPrimary =
    [...primaryStats.entries()]
      .sort(
        (a, b) =>
          b[1].count - a[1].count ||
          a[1].first - b[1].first
      )[0]?.[0] || "society";

  const icons = [
    ...new Set(
      [...subStats.entries()]
        .sort(
          (a, b) =>
            b[1].count - a[1].count ||
            a[1].first - b[1].first
        )
        .map(([, stat]) =>
          [...stat.icons.entries()]
            .sort(
              (a, b) =>
                b[1].count - a[1].count ||
                a[1].first - b[1].first
            )[0]?.[0]
        )
        .filter(Boolean)
    ),
  ].slice(0, 6);

  return {
    primary: dominantPrimary,
    icons,
  };
};

export default function ThreadWindow({
  appTitle,
  configuredThreads,
  events,
  gradeLabel,
  birth,
  hashtag,
  shareUrl,
  initialQuery = "",
  openSharedDynamic = false,
}) {
  const {
    initialDynamicResult,
    query,
    setQuery,
    dynamicThreads,
    dynamicFeedback,
    createDynamicThread,
    removeDynamicThread,
  } = useDynamicThreads({
    events,
    initialQuery,
  });

  const [thread, setThread] = useState(
    openSharedDynamic
      ? initialDynamicResult?.thread ?? null
      : null
  );

  const onSubmit = (event) => {
    event.preventDefault();
    createDynamicThread();
  };

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
          maxWidth: 760,
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
              {appTitle}
            </div>

            <h1
              style={{
                fontSize: 24,
                margin: "5px 0 0",
                color: "#374151",
              }}
            >
              48のテーマをたどる
            </h1>
          </div>

          <button
            type="button"
            onClick={() => window.close()}
            style={miniBtn}
          >
            × 閉じる
          </button>
        </div>

        <div
          style={{
            fontSize: 12.5,
            lineHeight: 1.8,
            color: "#6b7280",
            marginBottom: 18,
          }}
        >
          関連する出来事を一本の流れとしてたどります。
          編集済みのテーマを選ぶか、キーワードからその場でたどれます。
        </div>

        <section
          aria-labelledby="dynamic-thread-heading"
          style={{
            padding: "14px",
            border: "1px solid #d7dce2",
            borderRadius: 12,
            background: "#ffffff",
            marginBottom: 24,
          }}
        >
          <h2
            id="dynamic-thread-heading"
            style={{
              fontSize: 14,
              margin: 0,
              color: "#4b5563",
            }}
          >
            キーワードからたどる
          </h2>

          <div
            style={{
              fontSize: 11,
              lineHeight: 1.7,
              color: "#8a8f98",
              marginTop: 5,
            }}
          >
            共通年表だけを検索し、関連度の高い項目を最大12件選んで年代順に並べます。
            個人史は検索対象にしません。空白または && はAND、|| はOR、( ) は入れ子にできます。NOT（^）は未対応です。
          </div>

          <form
            onSubmit={onSubmit}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginTop: 12,
            }}
          >
            <label
              htmlFor="dynamic-thread-query"
              style={{
                flexShrink: 0,
                fontSize: 12,
                fontWeight: 700,
                color: "#6b7280",
              }}
            >
              キーワード入力：
            </label>

            <input
              id="dynamic-thread-query"
              type="search"
              value={query}
              onChange={(event) =>
                setQuery(event.target.value)
              }
              onKeyDown={(event) => {
                if (
                  event.key === "Enter" &&
                  (event.nativeEvent.isComposing ||
                    event.keyCode === 229)
                ) {
                  event.preventDefault();
                }
              }}
              placeholder="例：半導体"
              aria-label="たどるキーワード"
              style={{
                minWidth: 0,
                flex: 1,
                fontFamily: font,
                fontSize: 13,
                padding: "8px 10px",
                borderRadius: 8,
                border: "1px solid #cfd4da",
                color: "#374151",
                background: "#fff",
              }}
            />

            <button
              type="submit"
              disabled={!query.trim()}
              style={{
                ...miniBtn,
                padding: "7px 13px",
                opacity: query.trim() ? 1 : 0.5,
                whiteSpace: "nowrap",
              }}
            >
              たどる
            </button>
          </form>

          {dynamicFeedback?.error && (
            <div
              role="alert"
              style={{
                marginTop: 9,
                fontSize: 11.5,
                color: "#9b4a3c",
              }}
            >
              {dynamicFeedback.error}
            </div>
          )}

          {dynamicFeedback &&
            !dynamicFeedback.error &&
            dynamicFeedback.selectedCount === 0 && (
              <div
                role="status"
                style={{
                  marginTop: 9,
                  fontSize: 11.5,
                  color: "#6b7280",
                }}
              >
                該当する出来事がありません。別のキーワードを試してください。
              </div>
            )}

          {dynamicFeedback?.selectedCount === 1 &&
            dynamicFeedback.matches?.[0] && (
              <div
                role="status"
                style={{
                  marginTop: 10,
                  padding: "10px 12px",
                  borderRadius: 9,
                  border: "1px solid #e1d7c7",
                  background: "#fffaf2",
                  color: "#4b5563",
                }}
              >
                <div
                  style={{
                    fontSize: 11.5,
                    lineHeight: 1.6,
                    color: "#7a6a55",
                  }}
                >
                  1件だけ見つかりました。関連語を || で追加すると、検索範囲を広げられます。
                </div>

                <div
                  style={{
                    marginTop: 6,
                    fontSize: 12.5,
                    fontWeight: 800,
                  }}
                >
                  {eventYear(
                    dynamicFeedback.matches[0]
                  )}　
                  {dynamicFeedback.matches[0].title}
                </div>

                {dynamicFeedback.matches[0].summary && (
                  <div
                    style={{
                      marginTop: 4,
                      fontSize: 11.5,
                      lineHeight: 1.7,
                      color: "#6b7280",
                    }}
                  >
                    {
                      dynamicFeedback.matches[0]
                        .summary
                    }
                  </div>
                )}
              </div>
            )}

          {dynamicThreads.map((entry, index) => {
            const result = entry.result;
            const [background, border] =
              THREAD_COLORS[
                index % THREAD_COLORS.length
              ];

            return (
              <div
                key={entry.id}
                style={{
                  display: "flex",
                  alignItems: "stretch",
                  marginTop: 10,
                  borderRadius: 10,
                  border: `1px solid ${border}`,
                  background,
                  overflow: "hidden",
                }}
              >
                <button
                  type="button"
                  onClick={() =>
                    setThread(result.thread)
                  }
                  style={{
                    flex: 1,
                    minWidth: 0,
                    fontFamily: font,
                    textAlign: "left",
                    cursor: "pointer",
                    padding: "12px 14px",
                    border: 0,
                    background: "transparent",
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
                    ▶ {result.thread.title}
                  </div>

                  <div
                    style={{
                      marginTop: 5,
                      fontSize: 11,
                      lineHeight: 1.6,
                      color: "#6b7280",
                    }}
                  >
                    {result.selectedCount}項目
                    {result.totalMatches >
                    result.selectedCount
                      ? `（候補${result.totalMatches}件から選択）`
                      : ""}
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    removeDynamicThread(entry.id)
                  }
                  aria-label={`${result.thread.title}を削除`}
                  title="削除"
                  style={{
                    width: 38,
                    flexShrink: 0,
                    border: 0,
                    borderLeft:
                      "1px solid rgba(0, 0, 0, 0.08)",
                    background: "transparent",
                    color: "#7b8189",
                    fontFamily: font,
                    fontSize: 18,
                    cursor: "pointer",
                  }}
                >
                  ×
                </button>
              </div>
            );
          })}

        </section>

        <section aria-labelledby="configured-thread-heading">
          <h2
            id="configured-thread-heading"
            style={{
              fontSize: 14,
              margin: "0 0 10px",
              color: "#4b5563",
            }}
          >
            おすすめテーマ
          </h2>

          <div className="thread-grid">
            {configuredThreads.map(
              (item, index) => {
                const [background, border] =
                  THREAD_COLORS[
                    index % THREAD_COLORS.length
                  ];
                const accent =
                  THREAD_ACCENTS[
                    index % THREAD_ACCENTS.length
                  ];
                const visual =
                  themeVisualSummary(item.events);
                const category =
                  CAT[visual.primary] || CAT.society;

                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() =>
                      setThread(item)
                    }
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
                      ▶ {renderThemeTitle(item, accent)}
                    </div>

                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        minHeight: 20,
                        marginTop: 7,
                        overflow: "hidden",
                      }}
                    >
                      <span
                        title={`主分野：${category.label}`}
                        style={{
                          flexShrink: 0,
                          padding: "2px 6px",
                          borderRadius: 999,
                          border: "1px solid #707981",
                          background: "#7D8790",
                          color: "#FFFFFF",
                          fontSize: 9.5,
                          fontWeight: 800,
                          lineHeight: 1.35,
                        }}
                      >
                        {category.label}
                      </span>

                      <span
                        title="テーマ内で多いsubsアイコン"
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 2,
                          minWidth: 0,
                          overflow: "hidden",
                        }}
                      >
                        {visual.icons.map((name) => (
                          <Icon
                            key={name}
                            name={name}
                            color="#747c87"
                            size={15}
                          />
                        ))}
                      </span>
                    </div>

                    <div
                      style={{
                        marginTop: 4,
                        fontSize: 11,
                        lineHeight: 1.6,
                        color: "#6b7280",
                      }}
                    >
                      {item.events.length}項目
                    </div>
                  </button>
                );
              }
            )}
          </div>
        </section>
      </div>

      {thread && (
        <Theater
          thread={thread}
          gradeLabel={gradeLabel}
          birth={birth}
          hashtag={hashtag}
          shareUrl={shareUrl}
          onClose={() => setThread(null)}
        />
      )}
    </div>
  );
}
