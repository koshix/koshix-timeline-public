import { useState } from "react";

import { CAT } from "./categories";
import Icon from "./Icon";
import {
  PUBLIC_EVENT_SUB_FILTER_ICONS,
  PUBLIC_EVENT_SUB_FILTER_ROWS,
} from "./event-schema.js";

const MAIN_CATEGORY_ICONS = {
  work: "fallback-work",
  science: "fallback-science",
  education: "fallback-education",
  computer: "fallback-computer",
  culture: "fallback-culture",
  society: "fallback-society",
};

export default function TimelineCategoryFilters({
  mainCategories,
  catOn,
  toggleCat,
  sfOnly,
  toggleSfOnly,
  subFilters,
  toggleSubFilter,
  categoryMatchMode,
  setCategoryMatchMode,
  font,
}) {
  const [subFiltersOpen, setSubFiltersOpen] = useState(
    () => subFilters.length > 0
  );

  const categoryStyle = (key, on) => ({
    "--timeline-font": font,
    "--category-border": CAT[key].border,
    "--category-bg": on ? CAT[key].bg : CAT[key].soft,
    "--category-color": on ? CAT[key].fg : CAT[key].border,
  });

  return (
    <>
      <div className="timeline-category-filter-row">
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
                <span className="timeline-category-label-content">
                  <span>{CAT[k].label}</span>
                  <Icon
                    name={MAIN_CATEGORY_ICONS[k]}
                    color="currentColor"
                    size={12}
                  />
                </span>
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
            className="timeline-category-pill timeline-category-pill--main"
            style={categoryStyle(k, on)}
          >
            <span className="timeline-category-label-content">
              <span>{CAT[k].label}</span>
              <Icon
                name={MAIN_CATEGORY_ICONS[k]}
                color="currentColor"
                size={12}
              />
            </span>
          </button>
        );
      })}

      <span
        role="group"
        aria-label="分野の一致範囲"
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
          title="主分野だけで絞り込む"
        >
          主分野
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
          title="関連分野も含めて項目を表示する"
        >
          ＋副分野
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
        {subFiltersOpen ? "▼" : "▶"} 絞込み
        {subFilters.length > 0 ? `（${subFilters.length}）` : ""}
      </button>
      </div>

      {subFiltersOpen && (
        <div
          role="group"
          aria-label="横断タグ"
          className="timeline-subfilter-scroll"
        >
          <div
            className="timeline-subfilter-grid"
            style={{ "--timeline-font": font }}
          >
            {PUBLIC_EVENT_SUB_FILTER_ROWS
              .flat()
              .map(([key, label]) => {
                const on = subFilters.includes(key);
                const icons =
                  PUBLIC_EVENT_SUB_FILTER_ICONS[key] ?? [];

                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => toggleSubFilter(key)}
                    aria-pressed={on}
                    title={`${label}タグで絞り込む`}
                    className="timeline-subfilter-button"
                    style={{
                      background: on
                        ? "#e6e9ee"
                        : "#ffffff",
                      color: on
                        ? "#374151"
                        : "#6b7280",
                      fontFamily: font,
                      fontWeight: on ? 800 : 700,
                    }}
                  >
                    <span className="timeline-subfilter-label">
                      {on ? "✓" : "□"}{label}
                    </span>

                    <span
                      className="timeline-subfilter-icons"
                      aria-hidden="true"
                    >
                      {icons.map((iconName) => (
                        <Icon
                          key={iconName}
                          name={iconName}
                          color="currentColor"
                          size={11}
                        />
                      ))}
                    </span>
                  </button>
                );
              })}
          </div>
        </div>
      )}

    </>
  );
}
