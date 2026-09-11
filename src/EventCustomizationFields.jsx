export default function EventCustomizationFields({
  draft,
  updateDraft,
  font,
  categoryOptions = null,
  titleAriaLabel,
  summaryAriaLabel,
  titleMarginTop = 0,
  controlsGap = 8,
}) {
  return (
    <>
      <input
        type="text"
        required
        value={draft.title}
        onChange={(e) =>
          updateDraft("title", e.target.value)
        }
        placeholder="タイトル"
        aria-label={titleAriaLabel}
        style={{
          boxSizing: "border-box",
          width: "100%",
          marginTop: titleMarginTop,
          fontFamily: font,
          fontSize: 12,
          padding: "7px 9px",
          border: "1px solid #cfd3d8",
          borderRadius: 7,
        }}
      />

      <div
        style={{
          display: "flex",
          flexWrap: categoryOptions ? "wrap" : undefined,
          alignItems: "center",
          gap: controlsGap,
          marginTop: 8,
        }}
      >
        {categoryOptions && (
          <>
            <label
              style={{
                fontSize: 11.5,
                fontWeight: 700,
                color: "#365f7d",
              }}
            >
              分野
            </label>

            <select
              value={draft.category}
              onChange={(e) =>
                updateDraft(
                  "category",
                  e.target.value
                )
              }
              style={{
                fontFamily: font,
                fontSize: 12,
                padding: "6px 8px",
                border: "1px solid #cfd3d8",
                borderRadius: 7,
              }}
            >
              {categoryOptions.map(({ key, label }) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </>
        )}

        <label
          style={{
            fontSize: 11.5,
            fontWeight: 700,
            color: "#365f7d",
          }}
        >
          重要度
        </label>

        <select
          value={draft.importance}
          onChange={(e) =>
            updateDraft(
              "importance",
              Number(e.target.value)
            )
          }
          style={{
            fontFamily: font,
            fontSize: 12,
            padding: "6px 8px",
            border: "1px solid #cfd3d8",
            borderRadius: 7,
          }}
        >
          <option value={3}>L3 重要</option>
          <option value={2}>L2 標準</option>
          <option value={1}>L1 補足</option>
        </select>
      </div>

      <textarea
        required
        value={draft.summary}
        onChange={(e) =>
          updateDraft("summary", e.target.value)
        }
        placeholder="概要"
        aria-label={summaryAriaLabel}
        rows={4}
        style={{
          display: "block",
          boxSizing: "border-box",
          width: "100%",
          marginTop: 8,
          fontFamily: font,
          fontSize: 12,
          lineHeight: 1.6,
          padding: "7px 9px",
          border: "1px solid #cfd3d8",
          borderRadius: 7,
          resize: "vertical",
        }}
      />
    </>
  );
}
