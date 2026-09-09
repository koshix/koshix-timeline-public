export default function PersonalHistoryEventForm({
  draft,
  isEditing,
  updateDraft,
  savePersonalEvent,
  closePersonalEventForm,
  font,
  miniBtn,
}) {
  return (
    <form
      id="personal-history-editor"
      onSubmit={(e) => {
        e.preventDefault();
        savePersonalEvent();
      }}
      style={{
        marginTop: 12,
        padding: 12,
        border: "1px solid #dfd2ea",
        borderRadius: 10,
        background: "#fff",
      }}
    >
      <div
        style={{
          fontSize: 12,
          fontWeight: 800,
          color: "#5f4a72",
          marginBottom: 8,
        }}
      >
        {isEditing ? "自分史を編集" : "自分史を追加"}
      </div>

      <div
        className="personal-history-form-grid"
      >
        <input
          type="text"
          required
          value={draft.date}
          onChange={(e) =>
            updateDraft("date", e.target.value)
          }
          placeholder="日付 YYYY / YYYY-MM / YYYY-MM-DD"
          aria-label="日付"
          style={{
            fontFamily: font,
            fontSize: 12,
            padding: "7px 9px",
            border: "1px solid #cfd3d8",
            borderRadius: 7,
          }}
        />

        <input
          type="text"
          required
          value={draft.title}
          onChange={(e) =>
            updateDraft("title", e.target.value)
          }
          placeholder="タイトル"
          aria-label="タイトル"
          style={{
            fontFamily: font,
            fontSize: 12,
            padding: "7px 9px",
            border: "1px solid #cfd3d8",
            borderRadius: 7,
          }}
        />
      </div>

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
            color: "#5f4a72",
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
        aria-label="概要"
        rows={3}
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
        <button type="submit" style={miniBtn}>
          {isEditing ? "変更を保存" : "保存"}
        </button>

        <button
          type="button"
          onClick={closePersonalEventForm}
          style={miniBtn}
        >
          キャンセル
        </button>
      </div>
    </form>
  );
}
