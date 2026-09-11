import EventCustomizationFields from "./EventCustomizationFields";

export default function EventCustomizationEditForm({
  draft,
  updateDraft,
  onSave,
  onCancel,
  font,
  miniBtn,
}) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSave();
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
        この年表項目を修正
      </div>

      <EventCustomizationFields
        draft={draft}
        updateDraft={updateDraft}
        font={font}
        titleAriaLabel="年表項目タイトル"
        summaryAriaLabel="年表項目概要"
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
          変更を保存
        </button>

        <button
          type="button"
          onClick={onCancel}
          style={miniBtn}
        >
          キャンセル
        </button>
      </div>
    </form>
  );
}
