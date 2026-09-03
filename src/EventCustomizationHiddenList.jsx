export default function EventCustomizationHiddenList({
  items,
  restoreHiddenEvent,
  miniBtn,
}) {
  return (
    <div
      style={{
        marginTop: 10,
        paddingTop: 8,
        borderTop: "1px solid #dbe4ec",
      }}
    >
      <div
        style={{
          fontSize: 11.5,
          fontWeight: 800,
          color: "#365f7d",
          marginBottom: 5,
        }}
      >
        非表示中の項目
      </div>

      {items.map(({ id, label }) => (
        <div
          key={id}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "5px 0",
          }}
        >
          <span
            style={{
              flex: 1,
              minWidth: 0,
              fontSize: 11.5,
              color: "#4f5965",
            }}
          >
            {label}
          </span>

          <button
            type="button"
            onClick={() => restoreHiddenEvent(id)}
            style={miniBtn}
          >
            表示に戻す
          </button>
        </div>
      ))}
    </div>
  );
}
