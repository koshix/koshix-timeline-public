import { eventId } from "./event-links";

export default function TimelineDisplayControls({
  groups,
  birth,
  setAllCats,
  importanceMin,
  setImportanceLevel,
  expandAllStages,
  collapseStages,
  openOnlyEvents,
  closeAllEvents,
  font,
}) {
  return (
          <div
            aria-label="年表表示操作"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 18,
              flexWrap: "nowrap",
              width: "fit-content",
              maxWidth: "100%",
              minHeight: 38,
              boxSizing: "border-box",
              paddingBottom: 0,
            }}
          >
            <div
              role="group"
              aria-label="分類の一括表示切替"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 3,
                padding: 3,
                borderRadius: 9,
                background: "#edf7f0",
                border: "1px solid #d9eadf",
                flexShrink: 0,
              }}
            >
              <span style={{
                fontSize: 11.5,
                fontWeight: 800,
                color: "#4f765d",
                padding: "0 3px",
              }}>
                分類
              </span>

              <span style={{
                display: "inline-flex",
                overflow: "hidden",
                borderRadius: 7,
                border: "1.5px solid #6f8a78",
              }}>
                <button
                  onClick={() => setAllCats(true)}
                  style={{
                    fontFamily: font,
                    fontSize: 11.5,
                    fontWeight: 800,
                    padding: "4px 9px",
                    border: "none",
                    background: "#fff",
                    color: "#42654f",
                    cursor: "pointer",
                  }}
                >
                  全ON
                </button>

                <span aria-hidden="true"
                  style={{ width: 1, background: "#b9c9be" }}
                />

                <button
                  onClick={() => setAllCats(false)}
                  style={{
                    fontFamily: font,
                    fontSize: 11.5,
                    fontWeight: 700,
                    padding: "4px 9px",
                    border: "none",
                    background: "#e9f2eb",
                    color: "#657a6c",
                    cursor: "pointer",
                  }}
                >
                  全OFF
                </button>
              </span>
            </div>

            <div
              role="group"
              aria-label="表示"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 3,
                padding: 3,
                borderRadius: 9,
                background: "#f5f1e8",
                border: "1px solid #e7dfcf",
                flexShrink: 0,
              }}
            >
              <span style={{
                fontSize: 11.5,
                fontWeight: 800,
                color: "#776d5c",
                padding: "0 3px",
              }}>
                表示
              </span>

              <span style={{
                display: "inline-flex",
                overflow: "hidden",
                borderRadius: 7,
                border: "1.5px solid #b4aa98",
              }}>
                {[3, 2, 1].map((level, index) => (
                  <span key={level} style={{ display: "inline-flex" }}>
                    {index > 0 && (
                      <span
                        aria-hidden="true"
                        style={{ width: 1, background: "#d1c9ba" }}
                      />
                    )}
                    <button
                      onClick={() => setImportanceLevel(level)}
                      aria-pressed={importanceMin === level}
                      style={{
                        fontFamily: font,
                        fontSize: 11.5,
                        fontWeight: importanceMin === level ? 800 : 700,
                        padding: "4px 9px",
                        border: "none",
                        background:
                          importanceMin === level ? "#e6e9ee" : "#fff",
                        color: "#667085",
                        cursor: "pointer",
                      }}
                    >
                      {level === 3 ? "重要" : level === 2 ? "標準" : "全部"}
                    </button>
                  </span>
                ))}
              </span>
            </div>

            <div
              role="group"
              aria-label="期間の一括開閉"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 3,
                padding: 3,
                borderRadius: 9,
                background: "#f7f2ea",
                border: "1px solid #eadfce",
                flexShrink: 0,
              }}
            >
              <span style={{
                fontSize: 11.5,
                fontWeight: 800,
                color: "#7a6a55",
                padding: "0 3px",
              }}>
                期間
              </span>

              <span style={{
                display: "inline-flex",
                overflow: "hidden",
                borderRadius: 7,
                border: "1.5px solid #9a8b76",
              }}>
                <button
                  onClick={() => expandAllStages()}
                  style={{
                    fontFamily: font,
                    fontSize: 11.5,
                    fontWeight: 800,
                    padding: "4px 9px",
                    border: "none",
                    background: "#fff",
                    color: "#6b5a45",
                    cursor: "pointer",
                  }}
                >
                  開
                </button>

                <span aria-hidden="true"
                  style={{ width: 1, background: "#d1c5b3" }}
                />

                <button
                  onClick={() =>
                    collapseStages(
                      groups
                        .filter(
                          (g) =>
                            g.rangeTo != null &&
                            g.rangeTo < birth
                        )
                        .map((g) => g.key)
                    )
                  }
                  title="出生前を閉じ、出生年以降を開きます"
                  style={{
                    fontFamily: font,
                    fontSize: 11.5,
                    fontWeight: 800,
                    padding: "4px 9px",
                    border: "none",
                    background: "#f7f3ec",
                    color: "#74644f",
                    cursor: "pointer",
                  }}
                >
                  半
                </button>

                <span aria-hidden="true"
                  style={{ width: 1, background: "#d1c5b3" }}
                />

                <button
                  onClick={() =>
                    collapseStages(
                      groups.map((g) => g.key)
                    )
                  }
                  style={{
                    fontFamily: font,
                    fontSize: 11.5,
                    fontWeight: 700,
                    padding: "4px 9px",
                    border: "none",
                    background: "#eee8dd",
                    color: "#7d7468",
                    cursor: "pointer",
                  }}
                >
                  閉
                </button>
              </span>
            </div>

            <div
              role="group"
              aria-label="解説の一括開閉"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 3,
                padding: 3,
                borderRadius: 9,
                background: "#eef4f8",
                border: "1px solid #dce6ee",
                flexShrink: 0,
              }}
            >
              <span style={{
                fontSize: 11.5,
                fontWeight: 800,
                color: "#4f7089",
                padding: "0 3px",
              }}>
                解説
              </span>

              <span style={{
                display: "inline-flex",
                overflow: "hidden",
                borderRadius: 7,
                border: "1.5px solid #6f8798",
              }}>
                <button
                  onClick={() =>
                    openOnlyEvents(
                      groups.flatMap(
                        (g) => g.items.map(eventId)
                      )
                    )
                  }
                  style={{
                    fontFamily: font,
                    fontSize: 11.5,
                    fontWeight: 800,
                    padding: "4px 9px",
                    border: "none",
                    background: "#fff",
                    color: "#405f76",
                    cursor: "pointer",
                  }}
                >
                  開
                </button>

                <span aria-hidden="true"
                  style={{ width: 1, background: "#bfd0dc" }}
                />

                <button
                  onClick={() =>
                    openOnlyEvents(
                      groups
                        .flatMap((g) => g.items)
                        .filter((ev) => ev.y >= birth)
                        .map(eventId)
                    )
                  }
                  title="出生前の解説を閉じ、出生年以降の解説を開きます"
                  style={{
                    fontFamily: font,
                    fontSize: 11.5,
                    fontWeight: 800,
                    padding: "4px 9px",
                    border: "none",
                    background: "#f3f7fa",
                    color: "#4f6a7e",
                    cursor: "pointer",
                  }}
                >
                  半
                </button>

                <span aria-hidden="true"
                  style={{ width: 1, background: "#bfd0dc" }}
                />

                <button
                  onClick={closeAllEvents}
                  style={{
                    fontFamily: font,
                    fontSize: 11.5,
                    fontWeight: 700,
                    padding: "4px 9px",
                    border: "none",
                    background: "#e3edf4",
                    color: "#647785",
                    cursor: "pointer",
                  }}
                >
                  閉
                </button>
              </span>
            </div>
          </div>

  );
}
