import { CAT } from "./categories";

export default function TimelineCategoryFilters({
  mainCategories,
  catOn,
  toggleCat,
  sfOnly,
  toggleSfOnly,
  showMe,
  toggleMyEvents,
  openThreadWindow,
  font,
}) {
  return (
    <>
          {mainCategories.map((k) => {
            const on = catOn(k);

            if (k === "work") {
              return (
                <span
                  key={k}
                  style={{
                    display: "inline-flex",
                    alignItems: "stretch",
                    border: `1.5px solid ${CAT[k].border}`,
                    borderRadius: 999,
                    overflow: "hidden",
                    background: on ? CAT[k].bg : CAT[k].soft,
                    color: on ? CAT[k].fg : CAT[k].border,
                  }}
                >
                  <button
                    type="button"
                    onClick={() => toggleCat(k)}
                    aria-pressed={on}
                    style={{
                      fontFamily: font,
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: "pointer",
                      padding: "6px 2px 6px 11px",
                      border: "none",
                      background: "transparent",
                      color: "inherit",
                    }}
                  >
                    {CAT[k].label}
                  </button>

                  <button
                    type="button"
                    onClick={toggleSfOnly}
                    aria-pressed={sfOnly}
                    aria-label={sfOnly ? "SF作品のみ表示を解除" : "SF作品のみ表示"}
                    title={sfOnly ? "SF作品のみ表示中" : "SF作品だけに絞る"}
                    style={{
                      fontFamily: font,
                      fontSize: 11.5,
                      fontWeight: 800,
                      cursor: "pointer",
                      padding: "6px 9px 6px 2px",
                      border: "none",
                      background: "transparent",
                      color: "inherit",
                    }}
                  >
                    | {sfOnly ? "✓" : "□"}SF
                  </button>
                </span>
              );
            }

            return (
              <button
                key={k}
                onClick={() => toggleCat(k)}
                style={{
                  fontFamily: font, fontSize: 12, fontWeight: 700, cursor: "pointer",
                  padding: "6px 14px", borderRadius: 999,
                  border: `1.5px solid ${CAT[k].border}`,
                  background: on ? CAT[k].bg : CAT[k].soft,
                  color: on ? CAT[k].fg : CAT[k].border,
                }}
              >
                {CAT[k].label}
              </button>
            );
          })}
          <button
            onClick={toggleMyEvents}
            style={{
              fontFamily: font, fontSize: 12, fontWeight: 700, cursor: "pointer",
              padding: "6px 14px", borderRadius: 999,
              border: `1.5px solid ${CAT.me.border}`,
              background: showMe ? CAT.me.bg : CAT.me.soft,
              color: showMe ? CAT.me.fg : CAT.me.border,
            }}
          >
            {CAT.me.label}
          </button>

          <button
            type="button"
            onClick={openThreadWindow}
            style={{
              fontFamily: font,
              fontSize: 12,
              fontWeight: 800,
              cursor: "pointer",
              padding: "6px 11px",
              borderRadius: 999,
              marginLeft: 0,
              marginRight: 4,
              border: "1.5px solid #d1d5db",
              background: "#f3f4f6",
              color: "#6b7280",
            }}
          >
            テーマの糸
          </button>

    </>
  );
}
