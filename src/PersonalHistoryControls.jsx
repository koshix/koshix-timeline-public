export default function PersonalHistoryControls({
  eventCount,
  personalEventsSource,
  personalEditorOpen,
  personalFileInputRef,
  importPersonalEventsFile,
  exportPersonalEventsFile,
  togglePersonalEditor,
  clearPersonalEventsFile,
  loadServerPersonalEvents,
  titleColor,
  miniBtn,
}) {
  const browserSource =
    personalEventsSource === "browser";
  const serverSource =
    personalEventsSource === "server";

  return (
    <>
      <div
        style={{
          fontSize: 14,
          fontWeight: 800,
          color: titleColor,
        }}
      >
        ②自分史の編集
      </div>

      <div
        style={{
          fontSize: 11.5,
          lineHeight: 1.7,
          color: "#6b7280",
          marginTop: 4,
        }}
      >
        自分史はこのブラウザ内に保存されます。
        「編集」で追加・編集・削除し、年表表示は上の「自分」で切り替えます。
        必要ならTSVファイルでバックアップできます。
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
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            fontSize: 12,
            fontWeight: 800,
            color: "#5f4a72",
          }}
        >
          <span
            aria-hidden="true"
            style={{
              width: 9,
              height: 9,
              borderRadius: "50%",
              background: browserSource
                ? "#4f7fc7"
                : serverSource
                  ? "#d69232"
                  : "#a0a5ad",
            }}
          />
          現在の自分史：
          {browserSource
            ? `このブラウザ（${eventCount}件）`
            : serverSource
              ? `管理者データ（${eventCount}件）`
              : "未読み込み"}
        </span>

        <button
          onClick={clearPersonalEventsFile}
          disabled={!browserSource}
          style={{
            ...miniBtn,
            background: "#fff3f3",
            border: "1px solid #e4bcbc",
            color: "#8a4f4f",
            ...(!browserSource
              ? {
                  opacity: 0.45,
                  cursor: "not-allowed",
                }
              : {}),
          }}
        >
          自分史を消去
        </button>

        <button
          onClick={() =>
            personalFileInputRef.current?.click()
          }
          style={{
            ...miniBtn,
            background: "#f0f6fd",
            border: "1px solid #bdd0e5",
            color: "#41698f",
            ...(browserSource
              ? {
                  background: "#e5f0fc",
                  border: "1px solid #7fa5d0",
                  color: "#28568f",
                  fontWeight: 800,
                }
              : {}),
          }}
        >
          ファイルから読込
        </button>

        <button
          onClick={togglePersonalEditor}
          disabled={serverSource}
          style={{
            ...miniBtn,
            fontWeight: 800,
            background: "#f5f0fa",
            border: "1px solid #cfbfdf",
            color: "#68517d",
            ...(serverSource
              ? {
                  opacity: 0.45,
                  cursor: "not-allowed",
                }
              : {}),
            ...(personalEditorOpen
              ? {
                  background: "#ece3f5",
                  border: "1px solid #9f82b6",
                  color: "#5f3f76",
                }
              : {}),
          }}
        >
          編集
        </button>

        <button
          onClick={exportPersonalEventsFile}
          style={{
            ...miniBtn,
            background: "#f0f8f2",
            border: "1px solid #bed8c5",
            color: "#4b7356",
          }}
        >
          ファイルに保存
        </button>

        <details
          style={{
            marginLeft: 6,
            fontSize: 11,
            color: "#8a8f98",
          }}
        >
          <summary
            style={{
              cursor: "pointer",
              userSelect: "none",
              padding: "4px 6px",
            }}
          >
            管理者向け
          </summary>

          <button
            type="button"
            onClick={loadServerPersonalEvents}
            style={{
              ...miniBtn,
              marginTop: 6,
              ...(serverSource
                ? {
                    background: "#fff1dc",
                    border: "1px solid #d79a43",
                    color: "#8a5208",
                    fontWeight: 800,
                  }
                : {}),
            }}
          >
            管理者データ読込
          </button>
        </details>

        <input
          ref={personalFileInputRef}
          type="file"
          accept=".tsv,text/tab-separated-values,text/plain"
          onChange={importPersonalEventsFile}
          style={{ display: "none" }}
        />
      </div>
    </>
  );
}
