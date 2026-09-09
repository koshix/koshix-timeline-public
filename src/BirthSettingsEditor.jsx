import { useEffect, useState } from "react";

const YEAR_MIN = 1501;
const YEAR_MAX = 2100;

const resetButtonStyle = {
  fontFamily: "inherit",
  fontSize: 11,
  fontWeight: 700,
  cursor: "pointer",
  padding: "5px 9px",
  borderRadius: 999,
  border: "1px solid #d5d8dd",
  background: "#fff",
  color: "#6b7280",
};

export default function BirthSettingsEditor({
  birth,
  month,
  setBirthYear,
  setBirthMonth,
  resetBirthSettings,
  font,
  mono,
}) {
  const [birthDraft, setBirthDraft] =
    useState(String(birth ?? ""));
  const [monthDraft, setMonthDraft] =
    useState(month ? String(month) : "");

  useEffect(() => {
    setBirthDraft(String(birth ?? ""));
  }, [birth]);

  useEffect(() => {
    setMonthDraft(month ? String(month) : "");
  }, [month]);

  const commitBirthYear = () => {
    const year = Number(birthDraft);

    if (
      Number.isInteger(year) &&
      year >= YEAR_MIN &&
      year <= YEAR_MAX
    ) {
      setBirthYear(year);
      return;
    }

    setBirthDraft(String(birth));
  };

  const commitBirthMonth = () => {
    if (monthDraft.trim() === "") {
      setBirthMonth(0);
      return;
    }

    const nextMonth = Number(monthDraft);

    if (
      Number.isInteger(nextMonth) &&
      nextMonth >= 1 &&
      nextMonth <= 12
    ) {
      setBirthMonth(nextMonth);
      return;
    }

    setMonthDraft(month ? String(month) : "");
  };

  return (
    <div
      style={{
        padding: "10px 16px",
        borderBottom: "1px solid #eceef1",
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
          0. 生まれた年
        </strong>

        <button
          type="button"
          onClick={resetBirthSettings}
          style={{
            ...resetButtonStyle,
            marginLeft: "auto",
          }}
        >
          未設定に戻す
        </button>
      </div>

      <div
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
          誕生年
        </span>

        <input
          type="number"
          inputMode="numeric"
          min={YEAR_MIN}
          max={YEAR_MAX}
          placeholder="西暦"
          value={birthDraft}
          onChange={(event) =>
            setBirthDraft(event.target.value)
          }
          onBlur={commitBirthYear}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.currentTarget.blur();
            }
          }}
          aria-label="誕生年"
          style={{
            fontFamily: mono,
            fontSize: 15,
            fontWeight: 800,
            color: "#22272e",
            width: 92,
            padding: "6px 7px",
            borderRadius: 7,
            border: "1px solid #cfd3d8",
            boxSizing: "border-box",
          }}
        />

        <span
          style={{
            fontFamily: font,
            fontSize: 11.5,
            color: "#68707a",
            marginLeft: 4,
          }}
        >
          誕生月
        </span>

        <input
          type="number"
          inputMode="numeric"
          min="1"
          max="12"
          placeholder="月"
          value={monthDraft}
          onChange={(event) =>
            setMonthDraft(event.target.value)
          }
          onBlur={commitBirthMonth}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.currentTarget.blur();
            }
          }}
          aria-label="誕生月"
          style={{
            fontFamily: mono,
            fontSize: 15,
            fontWeight: 800,
            color: "#22272e",
            width: 62,
            padding: "6px 7px",
            borderRadius: 7,
            border: "1px solid #cfd3d8",
            boxSizing: "border-box",
          }}
        />

        <span
          style={{
            fontFamily: font,
            fontSize: 12,
            fontWeight: 700,
            color: "#4b5563",
          }}
        >
          月
        </span>
      </div>
    </div>
  );
}
