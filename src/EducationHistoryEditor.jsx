import { useState } from "react";
import {
  EARLY_CHILDHOOD_TYPES,
  GRADUATE_TYPES,
  HIGHER_ED_TYPES,
  SECONDARY_ED_TYPES,
  educationForKind,
  normalizeEducationHistory,
  replaceEducationForKind,
} from "./education-history";

const font =
  '"Hiragino Kaku Gothic ProN", "Hiragino Sans", "Yu Gothic Medium", "Noto Sans JP", sans-serif';
const mono = 'ui-monospace, "SF Mono", Menlo, Consolas, monospace';

const blankEarly = () => ({
  start: "",
  years: "",
  type: "kindergarten",
});

const blankSecondary = () => ({
  start: "",
  years: "",
  type: "highSchool",
});

const blankHigher = () => ({
  start: "",
  years: "",
  type: "university",
});

const blankGraduate = () => ({
  start: "",
  years: "",
  type: "masters",
});

const initialRows = (rows, blankFactory) =>
  Array.isArray(rows) && rows.length > 0
    ? rows.map((row) => ({ ...row }))
    : [blankFactory()];

const compactRows = (rows, types) =>
  normalizeEducationHistory(rows, types, "");

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

function HistoryBlock({
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

export default function EducationHistoryEditor({
  education,
  onEducationChange,
}) {
  const [earlyRows, setEarlyRows] = useState(() =>
    initialRows(
      educationForKind(education, "early"),
      blankEarly
    )
  );
  const [secondaryRows, setSecondaryRows] = useState(() =>
    initialRows(
      educationForKind(education, "secondary"),
      blankSecondary
    )
  );

  const [higherRows, setHigherRows] = useState(() =>
    initialRows(
      educationForKind(education, "higher"),
      blankHigher
    )
  );
  const [graduateRows, setGraduateRows] = useState(() =>
    initialRows(
      educationForKind(education, "graduate"),
      blankGraduate
    )
  );

  const changeEarlyRows = (next, reset = false) => {
    setEarlyRows(next);
    onEducationChange(
      replaceEducationForKind(
        education,
        "early",
        reset
          ? []
          : compactRows(
              next,
              EARLY_CHILDHOOD_TYPES
            )
      )
    );
  };

  const changeSecondaryRows = (next, reset = false) => {
    setSecondaryRows(next);
    onEducationChange(
      replaceEducationForKind(
        education,
        "secondary",
        reset
          ? []
          : compactRows(
              next,
              SECONDARY_ED_TYPES
            )
      )
    );
  };

  const changeHigherRows = (next, reset = false) => {
    setHigherRows(next);
    onEducationChange(
      replaceEducationForKind(
        education,
        "higher",
        reset
          ? []
          : compactRows(
              next,
              HIGHER_ED_TYPES
            )
      )
    );
  };

  const changeGraduateRows = (next, reset = false) => {
    setGraduateRows(next);
    onEducationChange(
      replaceEducationForKind(
        education,
        "graduate",
        reset
          ? []
          : compactRows(
              next,
              GRADUATE_TYPES
            )
      )
    );
  };

  return (
    <>
      <HistoryBlock
        number={1}
        title="幼稚園・保育所（任意）"
        kind="early"
        rows={earlyRows}
        onRowsChange={changeEarlyRows}
        types={EARLY_CHILDHOOD_TYPES}
        blankFactory={blankEarly}
        color="#b87835"
        soft="#fbefdf"
      />

      <HistoryBlock
        number={2}
        title="高校など（任意）"
        kind="secondary"
        rows={secondaryRows}
        onRowsChange={changeSecondaryRows}
        types={SECONDARY_ED_TYPES}
        blankFactory={blankSecondary}
        color="#1e5fa8"
        soft="#e7f0fb"
      />

      <HistoryBlock
        number={3}
        title="大学など（任意）"
        kind="higher"
        rows={higherRows}
        onRowsChange={changeHigherRows}
        types={HIGHER_ED_TYPES}
        blankFactory={blankHigher}
        color="#6b3fa0"
        soft="#f1e9fa"
      />

      <HistoryBlock
        number={4}
        title="大学院（任意）"
        kind="graduate"
        rows={graduateRows}
        onRowsChange={changeGraduateRows}
        types={GRADUATE_TYPES}
        blankFactory={blankGraduate}
        color="#4a5fb0"
        soft="#eaeefb"
      />

      <div
        style={{
          width: "100%",
          marginTop: 4,
          fontFamily: font,
          fontSize: 10.5,
          lineHeight: 1.7,
          color: "#8a8f98",
        }}
      >
        必要なだけ行を追加できます。中退や編入も実際の修学年数で設定できます。
        高専から大学への編入、修士から博士への進学なども複数行で表せます。
        これで表せない成人後の経歴は下の「5. 成人期」で分割できます。
      </div>
    </>
  );
}
