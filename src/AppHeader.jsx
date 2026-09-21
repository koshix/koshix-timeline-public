import ShareBar from "./ShareBar";

export default function AppHeader({
  appTitle,
  threadCount,
  eventCount,
  effectiveStats,
  hashtag,
  shareUrl,
  showBeginnerGuide,
  mono,
}) {
  return (
    <>
      {/* ヘッダー */}
      <header style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 11, letterSpacing: "0.25em", color: "#8a8f98", marginBottom: 6 }}>
          {threadCount}のテーマをたどる、自分の時代
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            flexWrap: "wrap",
          }}
        >
          <h1
            style={{
              fontSize: 29,
              fontWeight: 800,
              margin: 0,
              lineHeight: 1.35,
              flex: "1 1 300px",
            }}
          >
            {appTitle}
          </h1>

          <div
            role="group"
            aria-label="共有"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 7,
              flexWrap: "wrap",
              padding: "4px 7px",
              border: "1px solid #e2e4e8",
              borderRadius: 10,
              background: "#f7f8f9",
            }}
          >
            <span style={{ fontSize: 11.5, fontWeight: 700, color: "#6b7280" }}>
              共有：
            </span>
            <ShareBar
              small
              labelOnly
              hashtag={hashtag}
              url={shareUrl}
              text={`${appTitle}——${threadCount}のテーマで時代を自分の年齢から読む(${eventCount}項目) ${hashtag}`}
            />
          </div>
        </div>
        <div style={{ fontSize: 12.5, color: "#59616c", marginTop: 8, lineHeight: 1.7 }}>
          あなたの人生を、世界や日本の出来事の年表に重ねて見るアプリです。
        </div>
        <div style={{ fontSize: 11.5, color: "#8a8f98", marginTop: 8, fontFamily: mono }}>
          全{effectiveStats.count}項目・解説{effectiveStats.chars.toLocaleString()}字
        </div>
      </header>

      {showBeginnerGuide && (
      <section
        aria-label="はじめて使う方へ"
        style={{
          background: "#fffdf8",
          border: "1px solid #eadfce",
          borderRadius: 12,
          padding: "12px 14px",
          marginBottom: 14,
        }}
      >
        <div
          style={{
            fontSize: 14,
            fontWeight: 800,
            color: "#5f5142",
          }}
        >
          はじめて使う方へ
        </div>

        <div
          style={{
            fontSize: 11.5,
            lineHeight: 1.7,
            color: "#6b7280",
            marginTop: 3,
          }}
        >
          まず①で生年を設定してください。必要なら②で自分史を追加すると、世界や日本の出来事と自分の人生を重ねて見られます。
          設定や自分史は、この端末のこのブラウザ内だけに保存されます。
        </div>

      </section>
      )}
    </>
  );
}
