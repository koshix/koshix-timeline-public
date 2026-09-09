export default function EventCustomizationControls({
  overrideCount,
  hiddenCount,
  additionCount,
  eventCustomizationStatus,
  eventCustomizationEditorOpen,
  eventCustomizationFileInputRef,
  importEventCustomizationsFile,
  exportEventCustomizationsFile,
  toggleEventCustomizationEditor,
  clearEventCustomizations,
  miniBtn,
}) {
  const hasChanges =
    overrideCount > 0 ||
    hiddenCount > 0 ||
    additionCount > 0;

  return (
    <>
      <div
        style={{
          fontSize: 14,
          fontWeight: 800,
          color: "#365f7d",
        }}
      >
        年表を自分用に編集
      </div>

      <div
        style={{
          fontSize: 11.5,
          lineHeight: 1.7,
          color: "#6b7280",
          marginTop: 4,
        }}
      >
        元の年表は変わりません。あなたが追加・修正・非表示にした内容だけを、このブラウザに保存します。必要ならTSVファイルでバックアップできます。
      </div>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: 8,
          marginTop: 10,
        }}
      >
        <span
          style={{
            fontSize: 12,
            fontWeight: 800,
            color: "#365f7d",
          }}
        >
          ●自分用の変更：
          非表示 {hiddenCount}件
          {" / "}
          修正 {overrideCount}件
          {" / "}
          追加 {additionCount}件
        </span>



        <input
          ref={eventCustomizationFileInputRef}
          type="file"
          accept=".tsv,text/tab-separated-values,text/plain"
          onChange={importEventCustomizationsFile}
          style={{ display: "none" }}
        />

        <button
          type="button"
          onClick={() =>
            eventCustomizationFileInputRef.current?.click()
          }
          style={{
            ...miniBtn,
            background: "#f0f6fd",
            border: "1px solid #bdd0e5",
            color: "#41698f",
          }}
        >
          ファイルから読込
        </button>

        <button
          type="button"
          onClick={toggleEventCustomizationEditor}
          style={{
            ...miniBtn,
            fontWeight: 800,
            background: "#f5f0fa",
            border: "1px solid #cfbfdf",
            color: "#68517d",
            ...(eventCustomizationEditorOpen
              ? {
                  background: "#ece3f5",
                  border: "1px solid #9f82b6",
                  color: "#5f3f76",
                }
              : {}),
          }}
        >
          {eventCustomizationEditorOpen ? "編集を閉じる" : "編集する"}
        </button>

        <button
          type="button"
          onClick={exportEventCustomizationsFile}
          style={{
            ...miniBtn,
            background: "#f0f8f2",
            border: "1px solid #bed8c5",
            color: "#4b7356",
          }}
        >
          ファイルに保存
        </button>

        <button
          type="button"
          onClick={clearEventCustomizations}
          disabled={!hasChanges}
          style={{
            ...miniBtn,
            background: "#fff3f3",
            border: "1px solid #e4bcbc",
            color: "#8a4f4f",
            ...(!hasChanges
              ? { opacity: 0.45, cursor: "not-allowed" }
              : {}),
          }}
        >
          年表の変更を消去
        </button>
      </div>

      {eventCustomizationStatus && (
        <div
          style={{
            marginTop: 8,
            fontSize: 11.5,
            color: "#5f6770",
          }}
        >
          {eventCustomizationStatus}
        </div>
      )}
    </>
  );
}
