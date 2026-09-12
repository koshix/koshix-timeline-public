export default function TimelineSearchControls({
  searchText,
  searchError,
  onSearchTextChange,
  font,
}) {
  return (
    <div
      role="group"
      aria-label="検索"
      className="timeline-search-controls"
      style={{ "--timeline-font": font }}
    >
      <label
        htmlFor="timeline-search"
        className="timeline-search-label"
      >
        検索
      </label>

      <input
        id="timeline-search"
        type="search"
        value={searchText}
        onChange={(e) => onSearchTextChange(e.target.value)}
        placeholder="例: AI && 教育 / (DNA || RNA) && 研究"
        autoComplete="off"
        className={
          searchError
            ? "timeline-search-input timeline-search-input--error"
            : "timeline-search-input"
        }
      />

      <span
        className={
          searchError
            ? "timeline-search-help timeline-search-help--error"
            : "timeline-search-help"
        }
        role={searchError ? "alert" : undefined}
      >
        {searchError || (
          <>
            {"空白 または && → AND、|| → OR、( ) → 優先指定。"}
          </>
        )}
      </span>
    </div>
  );
}
