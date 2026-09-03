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

      <input
        type="text"
        required
        value={draft.title}
        onChange={(e) =>
          updateDraft("title", e.target.value)
        }
        placeholder="タイトル"
        aria-label="年表項目タイトル"
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

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginTop: 8,
        }}
      >
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
        aria-label="年表項目概要"
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
