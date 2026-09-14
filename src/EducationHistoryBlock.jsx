export const educationEditorFont =
  '"Hiragino Kaku Gothic ProN", "Hiragino Sans", "Yu Gothic Medium", "Noto Sans JP", sans-serif';

const font = educationEditorFont;
const mono = 'ui-monospace, "SF Mono", Menlo, Consolas, monospace';

const inputStyle = {
  fontFamily: mono,
  fontSize: 13,
  width: 78,
  padding: "6px 7px",
  borderRadius: 7,
  border: "1px solid #cfd3d8",
  boxSizing: "border-box",
};

const yearInputStyle = {
  ...inputStyle,
  fontSize: 15,
  fontWeight: 800,
  color: "#22272e",
};

const smallButtonStyle = {
  fontFamily: font,
  fontSize: 11,
  fontWeight: 700,
  cursor: "pointer",
  padding: "5px 9px",
  borderRadius: 999,
  border: "1px solid #d5d8dd",
  background: "#fff",
  color: "#6b7280",
};

export default function EducationHistoryBlock({
  number,
  title,
  kind,
  rows,
  onRowsChange,
  types,
  blankFactory,
  color,
  soft,
}) {
  const updateRow = (index, key, value) => {
    const next = rows.map((row) => ({ ...row }));
    next[index][key] = value;
    onRowsChange(next);
  };

  const addRow = () => {
    onRowsChange([...rows, blankFactory()]);
  };

  const removeRow = (index) => {
    const next = rows.filter((_, rowIndex) => rowIndex !== index);
    onRowsChange(next.length > 0 ? next : [blankFactory()]);
  };

  const resetRows = () => {
    onRowsChange([blankFactory()], true);
  };

  return (
    <div
      style={{
        width: "100%",
        padding: "10px 0",
        borderBottom:
          kind === "graduate" ? "none" : "1px solid #eceef1",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          flexWrap: "wrap",
          marginBottom: 7,
        }}
      >
        <strong
          style={{
            fontFamily: font,
            fontSize: 13,
            color: "#4b5563",
          }}
        >
          {number}. {title}
        </strong>

        <button
          type="button"
          onClick={resetRows}
          style={{
            ...smallButtonStyle,
            marginLeft: "auto",
          }}
        >
          未設定に戻す
        </button>
      </div>

      {rows.map((row, index) => (
        <div
          key={index}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            flexWrap: "wrap",
            padding: "5px 0",
          }}
        >
          <span
            style={{
              fontFamily: font,
              fontSize: 11.5,
              color: "#68707a",
            }}
          >
            {kind === "early" ? "入った年" : "入学年"}
          </span>

          <input
            type="number"
            inputMode="numeric"
            min="1501"
            max="2100"
            placeholder="西暦"
            value={row.start}
            onChange={(event) =>
              updateRow(index, "start", event.target.value)
            }
            aria-label={`${title}${index + 1}行目の${
              kind === "early" ? "入った年" : "入学年"
            }`}
            style={yearInputStyle}
          />

          <span
            style={{
              fontFamily: font,
              fontSize: 11.5,
              color: "#68707a",
            }}
          >
            {kind === "early" ? "在年数" : "修学年数"}
          </span>

          <input
            type="number"
            inputMode="numeric"
            min="1"
            placeholder="年"
            value={row.years}
            onChange={(event) =>
              updateRow(index, "years", event.target.value)
            }
            aria-label={`${title}${index + 1}行目の${
              kind === "early" ? "在年数" : "修学年数"
            }`}
            style={{
              ...yearInputStyle,
              width: 58,
            }}
          />

          <div
            role="group"
            aria-label={
              kind === "early"
                ? "幼保の種類"
                : kind === "secondary"
                  ? "高校などの種類"
                  : kind === "higher"
                    ? "大学などの種類"
                    : "大学院課程"
            }
            style={{
              display: "inline-flex",
              alignItems: "stretch",
              flexWrap: "wrap",
              gap: 0,
              border: `1.5px solid ${color}88`,
              borderRadius: 8,
              overflow: "hidden",
              background: "#fff",
            }}
          >
            {Object.entries(types).map(([key, value], buttonIndex, entries) => {
              const selected = row.type === key;

              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => updateRow(index, "type", key)}
                  aria-pressed={selected}
                  style={{
                    ...smallButtonStyle,
                    padding: "5px 10px",
                    border: "none",
                    borderRight:
                      buttonIndex < entries.length - 1
                        ? `1px solid ${color}55`
                        : "none",
                    borderRadius: 0,
                    background: selected ? soft : "#fff",
                    color: selected ? color : "#6b7280",
                    fontWeight: selected ? 800 : 700,
                  }}
                >
                  {value.label}
                </button>
              );
            })}
          </div>

          {rows.length > 1 && (
            <button
              type="button"
              onClick={() => removeRow(index)}
              style={{
                ...smallButtonStyle,
                color: "#8b4a35",
                border: "1px solid #d6b3a5",
                background: "#fff8f5",
              }}
            >
              削除
            </button>
          )}

          {index === rows.length - 1 && (
            <button
              type="button"
              onClick={addRow}
              style={{
                ...smallButtonStyle,
                fontWeight: 800,
                border: `1px solid ${color}66`,
                color,
                background: soft,
              }}
            >
              ＋追加
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

