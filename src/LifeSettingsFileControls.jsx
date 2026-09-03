export default function LifeSettingsFileControls({
  lifeSettingsStatus,
  lifeSettingsFileInputRef,
  importLifeSettingsFile,
  exportLifeSettingsFile,
  miniBtn,
}) {
  return (
    <div
      style={{
        width: "100%",
        padding: "10px 0",
      }}
    >
      <div
        style={{
          fontSize: 13,
          fontWeight: 700,
          color: "#4b5563",
          marginBottom: 7,
        }}
      >
        5. 人生設定
      </div>

      <div
        style={{
          marginTop: 4,
          fontSize: 11,
          lineHeight: 1.7,
          color: "#8a8f98",
        }}
      >
        生年・出生月と、上の1〜4の設定を1つのTSVに保存します。
        別のブラウザや端末でも、このTSVを読み込むと同じ設定を再現できます。
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          flexWrap: "wrap",
          marginTop: 8,
        }}
      >
        <button
          type="button"
          onClick={exportLifeSettingsFile}
          style={{
            ...miniBtn,
            fontWeight: 800,
            background: "#f0f8f2",
            border: "1px solid #bed8c5",
            color: "#4b7356",
          }}
        >
          ファイルに保存
        </button>

        <button
          type="button"
          onClick={() =>
            lifeSettingsFileInputRef.current?.click()
          }
          style={{
            ...miniBtn,
            fontWeight: 800,
            background: "#f0f6fd",
            border: "1px solid #bdd0e5",
            color: "#41698f",
          }}
        >
          ファイルから読込
        </button>

        <input
          ref={lifeSettingsFileInputRef}
          type="file"
          accept=".tsv,text/tab-separated-values,text/plain"
          onChange={importLifeSettingsFile}
          style={{ display: "none" }}
        />

        <span
          style={{
            fontSize: 10.5,
            color: "#8a8f98",
          }}
        >
          koshix-timeline-life-settings.tsv
        </span>
      </div>

      {lifeSettingsStatus && (
        <div
          role="status"
          style={{
            marginTop: 7,
            fontSize: 11,
            lineHeight: 1.6,
            color: "#59616c",
          }}
        >
          {lifeSettingsStatus}
        </div>
      )}
    </div>
  );
}
