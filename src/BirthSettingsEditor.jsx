export default function BirthSettingsEditor({
  birth,
  month,
  adjustBirthYear,
  setBirthYear,
  setBirthMonth,
  font,
  mono,
  btnStyle,
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        flexWrap: "wrap",
        padding: "14px 16px",
        borderBottom: "1px solid #eceef1",
      }}
    >
      <label
        style={{
          fontSize: 13,
          fontWeight: 700,
        }}
      >
        生まれた年
      </label>

      <button
        onClick={() => adjustBirthYear(-1)}
        style={btnStyle}
        aria-label="1年戻す"
      >
        −
      </button>

      <span
        style={{
          fontFamily: mono,
          fontSize: 24,
          fontWeight: 700,
          minWidth: 76,
          textAlign: "center",
        }}
      >
        {birth}
      </span>

      <button
        onClick={() => adjustBirthYear(1)}
        style={btnStyle}
        aria-label="1年進める"
      >
        ＋
      </button>

      <select
        value={month}
        onChange={(e) => setBirthMonth(e.target.value)}
        style={{
          fontFamily: font,
          fontSize: 14,
          fontWeight: 700,
          cursor: "pointer",
          padding: "7px 8px",
          borderRadius: 8,
          border: "1px solid #d5d8dd",
          background: "#fff",
          color: "#22272e",
        }}
        aria-label="生まれた月"
      >
        <option value={0}>月(任意)</option>
        {Array.from(
          { length: 12 },
          (_, i) => i + 1
        ).map((m) => (
          <option key={m} value={m}>
            {m}月
          </option>
        ))}
      </select>

      <input
        type="range"
        min={1930}
        max={2010}
        value={birth}
        onChange={(e) => setBirthYear(e.target.value)}
        style={{
          flex: 1,
          minWidth: 140,
          accentColor: "#c2452d",
        }}
        aria-label="生まれた年スライダー"
      />
    </div>
  );
}
