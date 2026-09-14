export default function AppFooter({
  appVersion,
  appUpdatedDate,
  publicDistributionEnabled,
  downloadUrl,
  publicSourceUrl,
  accessStatsUrl,
  personalEventsSource,
  lifeSettingsSource,
  administratorDataStatus,
  authenticateAndLoadAdministratorData,
  clearAdministratorBrowserData,
  miniBtn,
}) {
  return (
    <footer
      style={{
        fontSize: 12,
        color: "#59616c",
        marginTop: 28,
        lineHeight: 1.8,
        background: "#fff",
        border: "1px solid #e2e4e8",
        borderRadius: 12,
        padding: "12px 14px",
      }}
    >
      <div
        style={{
          color: "#59616c",
          fontWeight: 800,
          fontSize: 13,
        }}
      >
        このサイトについて
      </div>

      <div
        style={{
          marginTop: 3,
          fontSize: 12,
          color: "#59616c",
        }}
      >
        Webアプリ v{appVersion}　最終更新 {appUpdatedDate}
      </div>

      <div style={{ marginTop: 8 }}>
        公開された歴史的出来事を、生年・学齢期・人生段階に重ねて表示するインタラクティブ年表です。
        小中学校の学齢は誕生年と誕生月から概算し、高校など・大学など・大学院は設定した教育歴を反映します。成人期は必要に応じて任意に分割できます。
      </div>

      {publicDistributionEnabled &&
        (downloadUrl || publicSourceUrl) && (
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 10,
              marginTop: 8,
            }}
          >
            {downloadUrl && (
              <a
                href={downloadUrl}
                download="koshix-timeline-starter.zip"
                style={{ color: "#59616c" }}
              >
                ダウンロード版
              </a>
            )}
            {publicSourceUrl && (
              <a
                href={publicSourceUrl}
                target="_blank"
                rel="noreferrer"
                style={{ color: "#59616c" }}
              >
                公開用ソース
              </a>
            )}
          </div>
        )}

      <details
        style={{
          marginTop: 10,
          paddingTop: 10,
          borderTop: "1px solid #eceef1",
          fontSize: 11,
          color: "#8a8f98",
        }}
      >
        <summary
          style={{
            cursor: "pointer",
            userSelect: "none",
            padding: "4px 0",
          }}
        >
          管理者向け
        </summary>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: 10,
            marginTop: 6,
          }}
        >
          <button
            type="button"
            onClick={
              authenticateAndLoadAdministratorData
            }
            style={{
              ...miniBtn,
              ...(personalEventsSource === "server" &&
              lifeSettingsSource === "server"
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

          <button
            type="button"
            onClick={
              clearAdministratorBrowserData
            }
            style={{
              ...miniBtn,
              background: "#fff3f3",
              border: "1px solid #e4bcbc",
              color: "#8a4f4f",
            }}
          >
            管理者データをブラウザから消去
          </button>

          {personalEventsSource === "server" &&
            lifeSettingsSource === "server" && (
              <span
                style={{
                  fontSize: 11,
                  color: "#7c551d",
                  fontWeight: 700,
                }}
              >
                管理者データ：ブラウザ保存済み
              </span>
            )}

          {administratorDataStatus && (
            <span
              style={{
                fontSize: 11,
                color: "#9b4a3c",
              }}
            >
              {administratorDataStatus}
            </span>
          )}

          {!publicDistributionEnabled &&
          personalEventsSource === "server" &&
          downloadUrl && (
            <a
              href={downloadUrl}
              download="koshix-timeline-starter.zip"
              style={{ color: "#59616c" }}
            >
              ダウンロード版
            </a>
          )}

          {!publicDistributionEnabled &&
          personalEventsSource === "server" &&
          publicSourceUrl && (
            <a
              href={publicSourceUrl}
              target="_blank"
              rel="noreferrer"
              style={{ color: "#59616c" }}
            >
              公開用ソース
            </a>
          )}

          {personalEventsSource === "server" && accessStatsUrl && (
            <a
              href={accessStatsUrl}
              target="_blank"
              rel="noreferrer"
              style={{ color: "#59616c" }}
            >
              アクセス統計
            </a>
          )}
        </div>
      </details>

      <div
        style={{
          marginTop: 10,
          paddingTop: 10,
          borderTop: "1px solid #eceef1",
        }}
      >
        <div style={{ fontSize: 12, color: "#59616c" }}>
          <div
            style={{
              marginBottom: 2,
            }}
          >
            著作権表示：
          </div>
          <div>
            このアプリは松尾公也氏の{" "}
          <a
            href="https://matsuo-koya.github.io/sf-tech-lifeline/"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "#59616c" }}
          >
            SF × テクノロジー 自分史年表
          </a>
          {"（"}
          <a
            href="https://github.com/matsuo-koya/sf-tech-lifeline"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "#59616c" }}
          >
            sf-tech-lifeline
          </a>
          {"）を基にKunio Koshigiriが改変しています。"}
          </div>
        </div>

        <div style={{ fontSize: 12, color: "#59616c" }}>
          原作品 © 2026 Koya Matsuo ／ 改変部分 © 2026 Kunio Koshigiri ／{" "}
          <a
            href={`${import.meta.env.BASE_URL}LICENSE.txt`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "#59616c" }}
          >
            MIT License
          </a>
          {" ／ "}
          <a
            href={`${import.meta.env.BASE_URL}THIRD-PARTY-NOTICES.md`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "#59616c" }}
          >
            第三者ソフトウェア表示
          </a>
        </div>
      </div>
    </footer>
  );
}
