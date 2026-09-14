import {
  validYear,
} from "./life-stages";
import AdultPeriodsEditor from "./AdultPeriodsEditor";
import BirthSettingsEditor from "./BirthSettingsEditor";
import EducationHistoryEditor from "./EducationHistoryEditor";
import LifeSettingsFileControls from "./LifeSettingsFileControls";

export default function TimelineSettingsSection({
  settings,
  display,
  timeline,
  navigation,
  ui,
}) {
  const {
    birth,
    month,
    adultPeriods,
    setBirthYear,
    setBirthMonth,
    resetBirthSettings,
    education,
    educationEditorRevision,
    updateEducation,
    resetAdultPeriods,
    updateAdultPeriod,
    addAdultPeriod,
    removeAdultPeriod,
    lifeSettingsStatus,
    lifeSettingsFileInputRef,
    importLifeSettingsFile,
    exportLifeSettingsFile,
  } = settings;
  const {
    setupOpen,
    toggleSetup,
  } = display;
  const {
    adultYear,
    adultPeriodErrors,
    warnings,
  } = timeline;
  const {
    onViewPersonalHistory,
  } = navigation;
  const {
    font,
    mono,
    miniBtn,
  } = ui;

  const birthConfigured =
    validYear(birth) != null;

  return (
    <div
      id="timeline-settings"
      style={{
        scrollMarginTop: 16,
        background: "#fff",
        border: "1px solid #e2e4e8",
        borderRadius: 12,
        marginBottom: 14,
        overflow: "hidden",
      }}
    >
      <button
        onClick={toggleSetup}
        aria-expanded={setupOpen}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          flexWrap: "nowrap",
          width: "100%",
          boxSizing: "border-box",
          background: "#fff",
          border: "none",
          borderBottom: setupOpen
            ? "1px solid #e2e4e8"
            : "none",
          borderRadius: 0,
          padding: "10px 16px",
          cursor: "pointer",
          textAlign: "left",
          fontFamily: font,
          color: "#22272e",
        }}
      >
        <span
          style={{
            flexShrink: 0,
            whiteSpace: "nowrap",
            fontSize: 14,
            fontWeight: 800,
          }}
        >
          ①あなたの設定
        </span>

        <span
          style={{
            minWidth: 0,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            fontSize: 11.5,
            lineHeight: 1.7,
            color: "#6b7280",
          }}
        >
          {birthConfigured
            ? `${birth}年${month ? `${month}月` : ""}生まれ`
            : "生まれた年を入力してください"}
        </span>

        <span style={{ flex: 1 }} />

        <span
          style={{
            fontSize: 11,
            color: "#8a8f98",
          }}
        >
          {setupOpen
            ? "▼ 閉じる"
            : "▶ 開く"}
        </span>
      </button>

      {setupOpen && (
        <>
          <div
            style={{
              margin: "12px 16px 10px",
              padding: "9px 11px",
              border: "1px solid #cfd8e3",
              borderRadius: 9,
              background: "#f7f9fc",
              fontSize: 11.5,
              lineHeight: 1.7,
              color: "#59616c",
            }}
          >
            <strong>個人情報の扱い：</strong>
            ここで入力した内容は、この端末のこのブラウザ内だけに保存されます。
            公開年表の元データには書き込まれません。
          </div>
          <BirthSettingsEditor
            birth={birth}
            month={month}
            setBirthYear={setBirthYear}
            setBirthMonth={setBirthMonth}
            resetBirthSettings={
              resetBirthSettings
            }
            font={font}
            mono={mono}
          />

          <details
            style={{
              margin: "0 16px 14px",
              border: "1px solid #e2e4e8",
              borderRadius: 9,
              background: "#fafbfc",
            }}
          >
            <summary
              style={{
                cursor: "pointer",
                padding: "9px 11px",
                fontFamily: font,
                fontSize: 12,
                fontWeight: 800,
                color: "#59616c",
              }}
            >
              詳しく設定する
            </summary>

            <div
              style={{
              display: "flex",
              alignItems: "center",
              gap: 0,
              flexWrap: "wrap",
              padding:
                "12px 16px 14px",
            }}
          >
            <EducationHistoryEditor
              key={educationEditorRevision}
              education={education}
              onEducationChange={
                updateEducation
              }
            />

            <AdultPeriodsEditor
              adultPeriods={adultPeriods}
              adultYear={adultYear}
              adultPeriodErrors={
                adultPeriodErrors
              }
              resetAdultPeriods={
                resetAdultPeriods
              }
              updateAdultPeriod={
                updateAdultPeriod
              }
              addAdultPeriod={
                addAdultPeriod
              }
              removeAdultPeriod={
                removeAdultPeriod
              }
              font={font}
              mono={mono}
              miniBtn={miniBtn}
            />

            <LifeSettingsFileControls
              lifeSettingsStatus={
                lifeSettingsStatus
              }
              lifeSettingsFileInputRef={
                lifeSettingsFileInputRef
              }
              importLifeSettingsFile={
                importLifeSettingsFile
              }
              exportLifeSettingsFile={
                exportLifeSettingsFile
              }
              miniBtn={miniBtn}
            />

            {warnings.length > 0 && (
              <div
                role="alert"
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  padding: "8px 10px",
                  borderRadius: 8,
                  background: "#fff3f1",
                  color: "#a13d31",
                  fontSize: 11.5,
                  lineHeight: 1.7,
                }}
              >
                {warnings.map(
                  (warning) => (
                    <div key={warning}>
                      {warning}
                    </div>
                  )
                )}
              </div>
            )}
            </div>
          </details>

          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              padding: "0 16px 14px",
            }}
          >
            <button
              type="button"
              onClick={onViewPersonalHistory}
              style={{
                ...miniBtn,
                fontWeight: 800,
                border: "1px solid #9aa4b2",
                background: "#ffffff",
                color: "#4b5563",
              }}
            >
              ②自分史へ ↓
            </button>
          </div>
        </>
      )}
    </div>
  );
}
