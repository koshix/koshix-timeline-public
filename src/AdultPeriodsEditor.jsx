const resetBtnStyle = {
  fontFamily: "inherit",
  fontSize: 12,
  fontWeight: 700,
  cursor: "pointer",
  padding: "6px 12px",
  borderRadius: 999,
  border: "1px solid #d5d8dd",
  background: "#fff",
  color: "#6b7280",
};

export default function AdultPeriodsEditor({
  adultPeriods,
  adultYear,
  adultPeriodErrors,
  resetAdultPeriods,
  updateAdultPeriod,
  addAdultPeriod,
  removeAdultPeriod,
  font,
  mono,
  miniBtn,
}) {
  return (
    <div
      style={{
        width: "100%",
        padding: "10px 0",
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
        <div
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: "#4b5563",
          }}
        >
          4. 成人期
        </div>

        <button
          type="button"
          onClick={resetAdultPeriods}
          style={{
            ...resetBtnStyle,
            marginLeft: "auto",
          }}
        >
          未設定に戻す
        </button>
      </div>


      <div
        style={{
          marginTop: 4,
          fontSize: 11,
          lineHeight: 1.7,
          color: "#8a8f98",
        }}
      >
        必要な場合だけ使います。勤務地、勤務先、職階、役割など、
        自分に合う名称を自由に付けられます。
        最後の期間は終了年を空欄にすると現在まで続きます。
      </div>

      <div
          style={{
            marginTop: 10,
            padding: 10,
            border: "1px solid #dce0e5",
            borderRadius: 9,
            background: "#fafbfc",
          }}
        >
          {adultPeriods.length === 0 && (
            <div
              style={{
                fontSize: 11.5,
                color: "#7b828c",
                marginBottom: 8,
              }}
            >
              まだ分割されていません。「＋期間を追加」から始めてください。
            </div>
          )}

          {adultPeriods.map((period, index) => (
            <div
              key={index}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                flexWrap: "wrap",
                padding: "6px 0",
                borderBottom:
                  index < adultPeriods.length - 1
                    ? "1px solid #eceef1"
                    : "none",
              }}
            >
              <input
                type="number"
                inputMode="numeric"
                min="1501"
                max="2100"
                value={period.start}
                onChange={(e) =>
                  updateAdultPeriod(
                    index,
                    "start",
                    e.target.value
                  )
                }
                placeholder="開始年"
                aria-label={`${index + 1}番目の成人期区分の開始年`}
                style={{
                  fontFamily: mono,
                  fontSize: 12,
                  width: 74,
                  padding: "6px 7px",
                  borderRadius: 7,
                  border: "1px solid #cfd3d8",
                }}
              />

              <span
                style={{
                  fontSize: 11.5,
                  color: "#8a8f98",
                }}
              >
                ～
              </span>

              <input
                type="number"
                inputMode="numeric"
                min="1501"
                max="2100"
                value={period.end}
                onChange={(e) =>
                  updateAdultPeriod(
                    index,
                    "end",
                    e.target.value
                  )
                }
                placeholder="終了年"
                aria-label={`${index + 1}番目の成人期区分の終了年`}
                style={{
                  fontFamily: mono,
                  fontSize: 12,
                  width: 74,
                  padding: "6px 7px",
                  borderRadius: 7,
                  border: "1px solid #cfd3d8",
                }}
              />

              <input
                type="text"
                value={period.label}
                onChange={(e) =>
                  updateAdultPeriod(
                    index,
                    "label",
                    e.target.value
                  )
                }
                placeholder="例：奈良勤務、管理職、大学勤務"
                aria-label={`${index + 1}番目の成人期区分の名称`}
                style={{
                  flex: "1 1 190px",
                  minWidth: 160,
                  fontFamily: font,
                  fontSize: 12,
                  padding: "6px 8px",
                  borderRadius: 7,
                  border: "1px solid #cfd3d8",
                }}
              />

              <button
                type="button"
                onClick={() => removeAdultPeriod(index)}
                style={{
                  ...miniBtn,
                  color: "#8b4a35",
                  border: "1px solid #d6b3a5",
                  background: "#fff8f5",
                }}
              >
                削除
              </button>
            </div>
          ))}

          <div
            style={{
              display: "flex",
              gap: 8,
              flexWrap: "wrap",
              marginTop: 10,
            }}
          >
            <button
              type="button"
              onClick={() => addAdultPeriod(adultYear)}
              style={{
                ...miniBtn,
                fontWeight: 800,
                background: "#eef1f5",
                border: "1px solid #aab2bd",
                color: "#4b5563",
              }}
            >
              ＋期間を追加
            </button>
          </div>

          {adultPeriodErrors.length > 0 && (
            <div
              role="alert"
              style={{
                marginTop: 9,
                padding: "7px 9px",
                borderRadius: 7,
                background: "#fff3f1",
                color: "#a13d31",
                fontSize: 11,
                lineHeight: 1.7,
              }}
            >
              {adultPeriodErrors.map(
                (error, index) => (
                  <div key={index}>{error}</div>
                )
              )}
            </div>
          )}
      </div>

      <div
        style={{
          marginTop: 4,
          fontSize: 11,
          lineHeight: 1.7,
          color: "#8a8f98",
        }}
      >
        大学等・大学院の設定から成人期の開始年を自動計算します。
        成人期は必要に応じて自由に期間を分割できます。
      </div>
    </div>
  );
}
