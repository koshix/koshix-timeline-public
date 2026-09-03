export default function TimelineSearchControls({
  searchText,
  searchError,
  onSearchTextChange,
  onClearSearch,
  font,
  miniBtn,
}) {
  return (
    <div
      role="group"
      aria-label="検索"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 7,
        flexWrap: "nowrap",
        width: "calc(100% - 50px)",
        minHeight: 38,
        boxSizing: "border-box",
        marginTop: 3,
        padding: "3px 9px",
        borderRadius: 10,
        overflowX: "auto",
        border: "1px solid #dfe3e8",
        background: "#f6f7f9",
      }}
    >
      <label
        htmlFor="timeline-search"
        style={{
          fontSize: 11.5,
          fontWeight: 800,
          color: "#626c78",
          padding: "0 2px",
        }}
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
        style={{
          flex: "0 0 225px",
          minWidth: 220,
          maxWidth: 225,
          fontFamily: font,
          fontSize: 12,
          padding: "5px 9px",
          borderRadius: 7,
          border: `1px solid ${
            searchError ? "#c2452d" : "#cfd5dc"
          }`,
          background: "#fff",
          color: "#22272e",
        }}
      />

      {searchText && (
        <button
          onClick={onClearSearch}
          style={{
            ...miniBtn,
            fontSize: 11.5,
            fontWeight: 700,
            padding: "4px 8px",
          }}
        >
          クリア
        </button>
      )}

      <span
        style={{
          flex: "1 1 auto",
          minWidth: 0,
          fontSize: 10.5,
          lineHeight: 1.4,
          whiteSpace: "nowrap",
          color: searchError ? "#b33b2e" : "#7f8791",
        }}
        role={searchError ? "alert" : undefined}
      >
        {searchError || (
          <>
            {"&& = AND、|| = OR、( ) = 優先指定。"}
            {" 空白・読点・カンマもANDです。"}
          </>
        )}
      </span>
    </div>
  );
}
