import {
  GRADUATE_TYPES,
  HIGHER_ED_TYPES,
} from "./life-stages";
import AdultPeriodsEditor from "./AdultPeriodsEditor";
import BirthSettingsEditor from "./BirthSettingsEditor";
import EducationHistoryEditor from "./EducationHistoryEditor";
import LifeSettingsFileControls from "./LifeSettingsFileControls";

export default function TimelineSettingsSection({
  setupOpen,
  toggleSetup,
  birth,
  month,
  firstHigherYear,
  firstHigherType,
  firstGraduateYear,
  firstGraduateType,
  adultPeriods,
  adultYear,
  adultPeriodErrors,
  warnings,
  adjustBirthYear,
  setBirthYear,
  setBirthMonth,
  education,
  updateEducation,
  resetAdultPeriods,
  updateAdultPeriod,
  addAdultPeriod,
  removeAdultPeriod,
  lifeSettingsStatus,
  lifeSettingsFileInputRef,
  importLifeSettingsFile,
  exportLifeSettingsFile,
  font,
  mono,
  btnStyle,
  miniBtn,
}) {
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
          flexWrap: "wrap",
          width: "100%",
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
            flexBasis: "100%",
            fontSize: 14,
            fontWeight: 800,
          }}
        >
          ①あなたの設定
        </span>

        <span
          style={{
            fontSize: 11.5,
            lineHeight: 1.7,
            color: "#6b7280",
          }}
        >
          {birth}年
          {month ? `${month}月` : ""}
          生まれ
          {firstHigherYear
            ? `・${firstHigherYear}年 ${
                HIGHER_ED_TYPES[
                  firstHigherType
                ]?.label
              }`
            : ""}
          {firstGraduateYear
            ? `・${firstGraduateYear}年 大学院（${
                GRADUATE_TYPES[
                  firstGraduateType
                ]?.label
              }）`
            : ""}
          ・成人期{adultYear}年〜（自動）
          {adultPeriods.length > 0
            ? `・社会人区分${adultPeriods.length}件`
            : ""}
        </span>

        <span style={{ flex: 1 }} />

        <span
          style={{
            fontSize: 11,
            color: "#8a8f98",
          }}
        >
          {setupOpen
            ? "畳む ▼"
            : "変更する ▶"}
        </span>
      </button>

      {setupOpen && (
        <>
          <BirthSettingsEditor
            birth={birth}
            month={month}
            adjustBirthYear={
              adjustBirthYear
            }
            setBirthYear={setBirthYear}
            setBirthMonth={setBirthMonth}
            font={font}
            mono={mono}
            btnStyle={btnStyle}
          />

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
        </>
      )}
    </div>
  );
}
