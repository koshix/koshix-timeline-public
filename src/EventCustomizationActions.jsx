import ShareBar from "./ShareBar";

export default function EventCustomizationActions({
  isAdded,
  isEditing,
  onDeleteAdded,
  onStartEditing,
  onHide,
  hashtag,
  color,
  shareText,
  note,
  shareUrl,
  miniBtn,
}) {
  return (
    <div
      style={{
        marginTop: 10,
        paddingTop: 8,
        borderTop: "1px dashed #d5d8dd",
        display: "flex",
        alignItems: "center",
        gap: 8,
        flexWrap: "wrap",
      }}
    >
      {isAdded ? (
        <button
          type="button"
          onClick={onDeleteAdded}
          style={{
            ...miniBtn,
            color: "#8b4a35",
            border: "1px solid #d6b3a5",
            background: "#fff8f5",
          }}
        >
          削除
        </button>
      ) : (
        <>
          <button
            type="button"
            onClick={onStartEditing}
            style={{
              ...miniBtn,
              ...(isEditing
                ? {
                    background: "#e8f1ff",
                    border: "1px solid #6f98d5",
                    color: "#28568f",
                  }
                : {}),
            }}
          >
            修正
          </button>

          <button
            type="button"
            onClick={onHide}
            style={{
              ...miniBtn,
              color: "#8b4a35",
              border: "1px solid #d6b3a5",
              background: "#fff8f5",
            }}
          >
            年表で非表示
          </button>
        </>
      )}

      <ShareBar
        compact
        hashtag={hashtag}
        color={color}
        text={shareText}
        note={note}
        url={shareUrl}
      />
    </div>
  );
}
