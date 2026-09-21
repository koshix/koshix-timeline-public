import TimelineCategoryFilters from "./TimelineCategoryFilters";
import TimelineDisplayControls from "./TimelineDisplayControls";
import TimelineSearchControls from "./TimelineSearchControls";

export default function TimelineViewControls({
  timeline,
  filters,
  earlyHistory,
  eventOpen,
  search,
  download,
  openThreadWindow,
  resetTimelineFilters,
  hasActiveDisplayFilters,
  ui,
}) {
  const grouped = timeline;
  const {
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
  } = filters;
  const {
    open: earlyHistoryOpen,
    setOpen: setEarlyHistoryOpen,
    count: earlyHistoryCount,
  } = earlyHistory;
  const {
    isEventOpen,
    openOnlyEvents,
    closeAllEvents,
  } = eventOpen;
  const {
    text: searchText,
    setText: setSearchText,
  } = search;
  const {
    menuOpen: downloadMenuOpen,
    exportVisibleEventsTsv,
  } = download;
  const {
    font,
    mono,
    miniBtn,
    ImportanceBadge,
  } = ui;

  return (
    <>
      {/* ③年表の表示設定 */}
      <div
        id="timeline-view"
        role="group"
        aria-label="③年表の表示設定"
        style={{
          display: "flex",
          gap: 8,
          marginBottom: 24,
          flexWrap: "wrap",
          alignItems: "center",
          background: "#f5f8fb",
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
              color: "#4f7089",
            }}
          >
            ③年表の表示設定
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
            48のテーマをたどる
          </button>

          <button
            type="button"
            onClick={resetTimelineFilters}
            disabled={!hasActiveDisplayFilters}
            style={{
              ...miniBtn,
              marginLeft: "auto",
              fontSize: 11.5,
              fontWeight: 800,
              border: "1px solid #9aa4b2",
              background: "#ffffff",
              color: "#4b5563",
              opacity: hasActiveDisplayFilters ? 1 : 0.45,
              cursor: hasActiveDisplayFilters
                ? "pointer"
                : "default",
            }}
          >
            条件をリセット
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
          allCatsOn={MAIN_CATS.every(catOn)}
          allCatsOff={MAIN_CATS.every((key) => !catOn(key))}
          importanceMin={importanceMin}
          setImportanceLevel={setImportanceLevel}
          closedStages={closedStages}
          expandAllStages={expandAllStages}
          collapseStages={collapseStages}
          earlyHistoryOpen={earlyHistoryOpen}
          setEarlyHistoryOpen={setEarlyHistoryOpen}
          hasEarlyHistory={earlyHistoryCount > 0}
          isEventOpen={isEventOpen}
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
          <span>アイコン色＝主分野、＋数字＝関連分野数</span>
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
    </>
  );
}
