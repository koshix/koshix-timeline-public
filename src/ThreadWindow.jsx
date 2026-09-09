import { useMemo, useState } from "react";
import { eventYear } from "./event-schema.js";
import Theater from "./Theater";
import { buildDynamicThread } from "./thread-model.js";

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
  const initialDynamicResult = useMemo(
    () =>
      initialQuery.trim()
        ? buildDynamicThread({
            query: initialQuery,
            events,
          })
        : null,
    [initialQuery, events]
  );

  const [thread, setThread] = useState(
    openSharedDynamic
      ? initialDynamicResult?.thread ?? null
      : null
  );
  const [query, setQuery] = useState(initialQuery);
  const [dynamicResult, setDynamicResult] = useState(
    initialDynamicResult
  );

  const createDynamicThread = () => {
    setDynamicResult(
      buildDynamicThread({
        query,
        events,
      })
    );
  };

  const onSubmit = (event) => {
    event.preventDefault();
    createDynamicThread();
  };

  const sparseMatch =
    dynamicResult?.selectedCount === 1
      ? dynamicResult.matches?.[0]
      : null;

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
              テーマでたどる
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
            marginBottom: 18,
          }}
        >
          関連する出来事を一本の流れとしてたどります。
          編集済みのテーマを選ぶか、キーワードからその場で新しい糸を作れます。
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
            キーワードから糸を作る
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
              gap: 8,
              marginTop: 10,
            }}
          >
            <input
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
              placeholder="例：半導体 ／ AI || 人工知能 ／ (教育 || 学校) && AI"
              aria-label="動的テーマのキーワード"
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
              }}
            >
              糸を作る
            </button>
          </form>

          {dynamicResult?.error && (
            <div
              role="alert"
              style={{
                marginTop: 9,
                fontSize: 11.5,
                color: "#9b4a3c",
              }}
            >
              {dynamicResult.error}
            </div>
          )}

          {dynamicResult &&
            !dynamicResult.error &&
            dynamicResult.selectedCount === 0 && (
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

          {sparseMatch && (
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
                {eventYear(sparseMatch)}　{sparseMatch.title}
              </div>
              {sparseMatch.summary && (
                <div
                  style={{
                    marginTop: 4,
                    fontSize: 11.5,
                    lineHeight: 1.7,
                    color: "#6b7280",
                  }}
                >
                  {sparseMatch.summary}
                </div>
              )}
            </div>
          )}

          {dynamicResult?.thread && (
            <button
              type="button"
              onClick={() =>
                setThread(dynamicResult.thread)
              }
              style={{
                width: "100%",
                marginTop: 10,
                fontFamily: font,
                textAlign: "left",
                cursor: "pointer",
                padding: "11px 13px",
                borderRadius: 9,
                border: "1px solid #c6d4c9",
                background: "#f3f7f3",
                color: "#4b5563",
              }}
            >
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 800,
                  color: "#466253",
                }}
              >
                ▶ {dynamicResult.thread.title}
              </div>
              <div
                style={{
                  marginTop: 4,
                  fontSize: 11,
                  lineHeight: 1.6,
                  color: "#6b7280",
                }}
              >
                {dynamicResult.selectedCount}項目
                {dynamicResult.totalMatches >
                  dynamicResult.selectedCount
                  ? `（候補${dynamicResult.totalMatches}件から選択）`
                  : ""}
              </div>
            </button>
          )}
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
            {configuredThreads.map((item, index) => {
              const [background, border] =
                THREAD_COLORS[index % THREAD_COLORS.length];

              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setThread(item)}
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
                    ▶ {item.title}
                  </div>

                  <div
                    style={{
                      marginTop: 5,
                      fontSize: 11,
                      lineHeight: 1.6,
                      color: "#6b7280",
                    }}
                  >
                    {item.events.length}項目
                  </div>
                </button>
              );
            })}
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
