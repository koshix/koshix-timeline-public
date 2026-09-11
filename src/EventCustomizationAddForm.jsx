import EventCustomizationFields from "./EventCustomizationFields";

export default function EventCustomizationAddForm({
  draft,
  categoryOptions,
  updateDraft,
  saveAddedEvent,
  cancelAddingEvent,
  font,
  miniBtn,
}) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        saveAddedEvent();
      }}
      style={{
        marginTop: 10,
        padding: 10,
        border: "1px solid #cfdce8",
        borderRadius: 8,
        background: "#ffffffaa",
      }}
    >
      <div
        style={{
          fontSize: 11.5,
          fontWeight: 800,
          color: "#365f7d",
          marginBottom: 7,
        }}
      >
        年表項目を追加
      </div>

      <input
        type="text"
        required
        value={draft.date}
        onChange={(e) =>
          updateDraft("date", e.target.value)
        }
        placeholder="日付（YYYY / YYYY-MM / YYYY-MM-DD）"
        aria-label="追加項目の日付"
        style={{
          boxSizing: "border-box",
          width: "100%",
          fontFamily: font,
          fontSize: 12,
          padding: "7px 9px",
          border: "1px solid #cfd3d8",
          borderRadius: 7,
        }}
      />

      <EventCustomizationFields
        draft={draft}
        updateDraft={updateDraft}
        font={font}
        categoryOptions={categoryOptions}
        titleAriaLabel="追加項目のタイトル"
        summaryAriaLabel="追加項目の概要"
        titleMarginTop={8}
        controlsGap={10}
      />

      <div
        style={{
          display: "flex",
          gap: 8,
          marginTop: 9,
        }}
      >
        <button
          type="submit"
          style={miniBtn}
        >
          追加して保存
        </button>

        <button
          type="button"
          onClick={cancelAddingEvent}
          style={miniBtn}
        >
          キャンセル
        </button>
      </div>
    </form>
  );
}
