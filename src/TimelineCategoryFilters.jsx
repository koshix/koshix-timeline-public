import { useState } from "react";

import { CAT } from "./categories";
import {
  PUBLIC_EVENT_SUB_TAG_ROWS,
} from "./event-schema.js";

export default function TimelineCategoryFilters({
  mainCategories,
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
  font,
}) {
  const [subFiltersOpen, setSubFiltersOpen] = useState(false);

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

      <span
        role="group"
        aria-label="分類の一致範囲"
        className="timeline-category-mode"
        style={{ "--timeline-font": font }}
      >
        <button
          type="button"
          onClick={() =>
            setCategoryMatchMode("primary")
          }
          aria-pressed={
            categoryMatchMode === "primary"
          }
          className="timeline-category-mode-button"
          title="主分類だけで絞り込む"
        >
          主分類
        </button>
        <button
          type="button"
          onClick={() =>
            setCategoryMatchMode("related")
          }
          aria-pressed={
            categoryMatchMode === "related"
          }
          className="timeline-category-mode-button"
          title="副分類も含めて関連項目を表示する"
        >
          関連含
        </button>
      </span>

      <button
        type="button"
        onClick={() =>
          setSubFiltersOpen((open) => !open)
        }
        aria-expanded={subFiltersOpen}
        className="timeline-subfilter-toggle"
        style={{ "--timeline-font": font }}
        title={
          subFiltersOpen
            ? "横断タグを閉じる"
            : "横断タグを開く"
        }
      >
        {subFiltersOpen ? "▼ 詳細" : "▶ 詳細"}
      </button>

      {subFiltersOpen &&
        PUBLIC_EVENT_SUB_TAG_ROWS.map((row, rowIndex) => (
        <span
          key={rowIndex}
          role="group"
          aria-label={`横断タグ ${rowIndex + 1}段目`}
          style={{
            flexBasis: "100%",
            display: "grid",
            gridTemplateColumns:
              "repeat(8, minmax(0, 1fr))",
            gap: 5,
            width: "100%",
            marginTop: rowIndex === 0 ? 4 : 0,
          }}
        >
          {row.map(([key, label]) => {
            const on = subFilters.includes(key);

            return (
              <button
                key={key}
                type="button"
                onClick={() => toggleSubFilter(key)}
                aria-pressed={on}
                title={`${label}タグで絞り込む`}
                style={{
                  minWidth: 0,
                  padding: "5px 4px",
                  border: "1px solid #cbd1d8",
                  borderRadius: 7,
                  background: on
                    ? "#e6e9ee"
                    : "#ffffff",
                  color: on
                    ? "#374151"
                    : "#6b7280",
                  fontFamily: font,
                  fontSize: 11.5,
                  fontWeight: on ? 800 : 700,
                  cursor: "pointer",
                }}
              >
                {on ? "✓" : "□"}{label}
              </button>
            );
          })}
        </span>
      ))}
    </>
  );
}
