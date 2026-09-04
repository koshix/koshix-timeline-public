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
  const categoryStyle = (key, on) => ({
    "--timeline-font": font,
    "--category-border": CAT[key].border,
    "--category-bg": on ? CAT[key].bg : CAT[key].soft,
    "--category-color": on ? CAT[key].fg : CAT[key].border,
  });

  return (
    <>
      {mainCategories.map((k) => {
        const on = catOn(k);

        if (k === "work") {
          return (
            <span
              key={k}
              className="timeline-category-split"
              style={categoryStyle(k, on)}
            >
              <button
                type="button"
                onClick={() => toggleCat(k)}
                aria-pressed={on}
                className="timeline-category-split-button timeline-category-split-button--label"
              >
                {CAT[k].label}
              </button>

              <button
                type="button"
                onClick={toggleSfOnly}
                aria-pressed={sfOnly}
                aria-label={
                  sfOnly
                    ? "SF作品のみ表示を解除"
                    : "SF作品のみ表示"
                }
                title={
                  sfOnly
                    ? "SF作品のみ表示中"
                    : "SF作品だけに絞る"
                }
                className="timeline-category-split-button timeline-category-split-button--sf"
              >
                | {sfOnly ? "✓" : "□"}SF
              </button>
            </span>
          );
        }

        return (
          <button
            key={k}
            type="button"
            onClick={() => toggleCat(k)}
            aria-pressed={on}
            className="timeline-category-pill"
            style={categoryStyle(k, on)}
          >
            {CAT[k].label}
          </button>
        );
      })}

      <button
        type="button"
        onClick={toggleMyEvents}
        aria-pressed={showMe}
        className="timeline-category-pill"
        style={categoryStyle("me", showMe)}
      >
        {CAT.me.label}
      </button>

      <button
        type="button"
        onClick={openThreadWindow}
        className="timeline-thread-button"
        style={{ "--timeline-font": font }}
      >
        テーマの糸
      </button>
    </>
  );
}
