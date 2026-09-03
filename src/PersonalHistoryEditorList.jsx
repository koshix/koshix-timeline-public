export default function PersonalHistoryEditorList({
  events,
  openNewPersonalEventForm,
  closePersonalEditor,
  startEditingPersonalEvent,
  deletePersonalEvent,
  miniBtn,
}) {
  return (
    <div
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
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginBottom: 8,
        }}
      >
        <strong
          style={{
            fontSize: 12,
            color: "#5f4a72",
          }}
        >
          自分史を編集
        </strong>

        <span
          style={{
            fontSize: 11,
            color: "#7b818b",
          }}
        >
          {events.length}件
        </span>

        <span style={{ flex: 1 }} />

        <button
          type="button"
          onClick={openNewPersonalEventForm}
          style={{
            ...miniBtn,
            background: "#e7f1fb",
            border: "1px solid #91b3d2",
            color: "#315f87",
            fontWeight: 800,
          }}
        >
          ＋追加
        </button>

        <button
          type="button"
          onClick={closePersonalEditor}
          style={{
            ...miniBtn,
            marginLeft: 6,
          }}
        >
          ×閉じる
        </button>
      </div>

      {events.length === 0 ? (
        <div
          style={{
            fontSize: 11.5,
            color: "#7b818b",
            padding: "8px 0",
          }}
        >
          自分史はまだありません。
        </div>
      ) : (
        <div
          style={{
            maxHeight: 320,
            overflowY: "auto",
            borderTop: "1px solid #ece7f0",
          }}
        >
          {events.map((event) => (
            <div
              key={event.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "7px 2px",
                borderBottom: "1px solid #ece7f0",
              }}
            >
              <span
                style={{
                  width: 88,
                  flexShrink: 0,
                  fontSize: 11,
                  color: "#747b86",
                }}
              >
                {event.date}
              </span>

              <span
                style={{
                  flex: 1,
                  minWidth: 0,
                  fontSize: 12,
                  color: "#333a44",
                }}
              >
                {event.t}
              </span>

              <button
                type="button"
                onClick={() =>
                  startEditingPersonalEvent(event)
                }
                style={miniBtn}
              >
                編集
              </button>

              <button
                type="button"
                onClick={() =>
                  deletePersonalEvent(event)
                }
                style={{
                  ...miniBtn,
                  color: "#9b2c2c",
                  border: "1px solid #d8a4a4",
                  background: "#fff7f7",
                }}
              >
                削除
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
