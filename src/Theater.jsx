import { useEffect, useMemo, useRef, useState } from "react";
import Icon from "./Icon";
import { CAT, catKey } from "./categories";
import { eventId } from "./event-links";

const BG_COLOR = {
  sf: "#EE8F97",
  science: "#F0A35D",
  education: "#E5C74F",
  computer: "#7DBF91",
  culture: "#80AFE0",
  society: "#8D97D8",
  me: "#B18AD0",
  tech: "#7DBF91",
  music: "#80AFE0",
};
const BG_ROWS = 7;

export default function Theater({
  thread,
  gradeLabel,
  birth,
  speed,
  onCycleSpeed,
  onClose,
  allEvents,
  hashtag,
  shareUrl,
}) {
  const evs = thread.events;
  const [idx, setIdx] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [done, setDone] = useState(false);
  const listRef = useRef(null);

  const font =
    '"Hiragino Kaku Gothic ProN", "Hiragino Sans", "Yu Gothic Medium", "Noto Sans JP", sans-serif';
  const mono = 'ui-monospace, "SF Mono", Menlo, Consolas, monospace';

  const go = (i) => {
    setDone(false);
    setIdx(Math.max(0, Math.min(evs.length - 1, i)));
  };

  // 自動送り。文字数に応じた時間で次へ
  useEffect(() => {
    if (!playing || done) return;
    const next = () => {
      if (idx + 1 < evs.length) setIdx(idx + 1);
      else {
        setDone(true);
        setPlaying(false);
      }
    };
    const text = `${evs[idx].y}年。${evs[idx].t}。${evs[idx].n || ""}`;
    const ms = Math.min(16000, 1800 + [...text].length * 70) / speed;
    const timer = setTimeout(next, ms);
    return () => clearTimeout(timer);
  }, [idx, playing, done, speed, evs]);

  // 現在の項目を画面の中央へ送る(これが「自動スクロール」の見え方になる)
  useEffect(() => {
    listRef.current?.querySelector(`[data-i="${idx}"]`)?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  }, [idx]);

  // 開いている間は背後の年表を動かさない
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
      else if (e.key === " ") {
        e.preventDefault();
        setPlaying((p) => !p);
      } else if (e.key === "ArrowRight" || e.key === "ArrowDown") go(idx + 1);
      else if (e.key === "ArrowLeft" || e.key === "ArrowUp") go(idx - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [idx, onClose]);

  const gradeOf = (ev) =>
    ev.y < birth ? "生まれる前" : gradeLabel(ev.y);

  // 背景の左右に流す、同じころの別カテゴリーの項目(その糸に入っているものは除く)。
  // 何が同時に起きていた時代なのかを、読まなくても感じられるようにするための層
  const bgRows = useMemo(() => {
    const inThread = new Set(evs.map(eventId));
    const year = evs[idx].y;
    let near = [];
    for (let win = 3; win <= 40 && near.length < 21; win += 3) {
      near = allEvents.filter((e) => Math.abs(e.y - year) <= win && !inThread.has(eventId(e)));
    }
    const rows = Array.from({ length: BG_ROWS }, () => []);
    near.forEach((e, i) => rows[i % BG_ROWS].push(e));
    return rows.filter((r) => r.length);
  }, [evs, idx, allEvents]);

  const ctlBtn = (on = false) => ({
    fontSize: 12, fontWeight: 700, cursor: "pointer", padding: "6px 12px",
    borderRadius: 999, fontFamily: font, lineHeight: 1.2,
    border: `1px solid ${on ? "#b0771e" : "#9aa3ad"}`,
    background: on ? "#f3dfb5" : "#ffffff",
    color: on ? "#6b4610" : "#374151",
  });

  return (
    <div
      role="dialog"
      aria-label={`テーマ再生:${thread.title}`}
      style={{
        position: "fixed", inset: 0, zIndex: 60, display: "flex", flexDirection: "column",
        background: "#f7f7f5", color: "#22272e", fontFamily: font,
      }}
    >
      {/* 見出し */}
      <div style={{ padding: "14px 16px 10px", borderBottom: "1px solid #d7dce2", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 10.5, letterSpacing: "0.2em", color: "#8a93a3" }}>テーマの糸</div>
            <div style={{ fontSize: 17, fontWeight: 800, marginTop: 3 }}>{thread.title}</div>
            <div style={{ fontSize: 11.5, color: "#4b5563", marginTop: 4, lineHeight: 1.6 }}>
              {thread.lead}
            </div>
          </div>
          <button onClick={onClose} aria-label="閉じる" style={{ ...ctlBtn(), padding: "6px 10px" }}>
            ×閉じる
          </button>
        </div>
        <div style={{ marginTop: 8, height: 3, background: "#d7dce2", borderRadius: 2 }}>
          <div
            style={{
              width: `${((idx + 1) / evs.length) * 100}%`, height: "100%",
              background: "#b0771e", borderRadius: 2, transition: "width 0.3s",
            }}
          />
        </div>
      </div>

      {/* 本体(現在の項目が中央に来るよう自動でスクロールする) */}
      <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
        <style>{`
          @keyframes lifelineDriftA { from { transform: translateX(0) } to { transform: translateX(-50%) } }
          @keyframes lifelineDriftB { from { transform: translateX(-50%) } to { transform: translateX(0) } }
        `}</style>
        {/* 同じころに起きていた別カテゴリーの出来事を、左右の背景に薄く流す */}
        <div style={{ position: "absolute", inset: 0, overflow: "hidden" }} aria-hidden="true">
          {bgRows.map((row, i) => (
            <div
              key={i}
              style={{
                position: "absolute", top: `${((i + 0.5) * 100) / bgRows.length}%`,
                left: 0, width: "max-content", display: "flex", gap: 46,
                whiteSpace: "nowrap", lineHeight: 1,
                animation: `lifelineDrift${i % 2 ? "B" : "A"} ${110 + i * 23}s linear infinite`,
              }}
            >
              {[...row, ...row].map((e, j) => (
                <span
                  key={j}
                  style={{
                    fontSize: 13 + ((i * 5) % 9), color: BG_COLOR[catKey(e)] || "#8a93a3",
                    opacity: 0.34, fontWeight: 600,
                  }}
                >
                  <span style={{ fontFamily: mono, marginRight: 8, opacity: 0.65 }}>{e.y}</span>
                  {e.t.replace(/[((].*$/, "")}
                </span>
              ))}
            </div>
          ))}
        </div>
        {/* 中央は読ませたいので、背景の層を覆い隠す */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute", inset: 0, pointerEvents: "none",
            background:
              "linear-gradient(90deg, rgba(247,247,245,0) 0%, rgba(247,247,245,0.97) 20%, rgba(247,247,245,0.97) 80%, rgba(247,247,245,0) 100%)",
          }}
        />
        <div ref={listRef} style={{ position: "absolute", inset: 0, overflowY: "auto", padding: "40vh 16px" }}>
        <div style={{ maxWidth: 640, margin: "0 auto" }}>
          {evs.map((ev, i) => {
            const active = i === idx;
            const color = CAT[catKey(ev)]?.bg || "#6b7280";
            return (
              <div
                key={eventId(ev)}
                data-i={i}
                onClick={() => go(i)}
                style={{
                  padding: active ? "16px 0" : "9px 0", cursor: "pointer",
                  opacity: active ? 1 : 0.52, transition: "opacity 0.35s",
                }}
              >
                <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                  <span
                    style={{
                      fontFamily: mono, fontSize: active ? 15 : 13, fontWeight: 700,
                      color: "#8a93a3", width: 48, flexShrink: 0,
                    }}
                  >
                    {ev.y}
                  </span>
                  <span
                    style={{
                      flexShrink: 0, fontSize: 11, fontWeight: 800, color: "#12151b",
                      background: "#c9ced8", borderRadius: 5, padding: "2px 7px", marginTop: 1,
                    }}
                  >
                    {gradeOf(ev)}
                  </span>
                  <Icon name={ev.ic} color={color} size={active ? 20 : 16} />
                  <span
                    style={{
                      fontSize: active ? 19 : 14, fontWeight: active ? 800 : 500,
                      lineHeight: 1.5, flex: 1,
                    }}
                  >
                    {ev.t}
                  </span>
                </div>
                {active && ev.n && (
                  <div
                    style={{
                      marginTop: 10, marginLeft: 58, paddingLeft: 12,
                      borderLeft: `3px solid ${color}`,
                      fontSize: 13.5, lineHeight: 1.85, color: "#4b5563",
                    }}
                  >
                    {ev.n}
                  </div>
                )}
              </div>
            );
          })}
          {done && (
            <div style={{ textAlign: "center", marginTop: 24, fontSize: 12.5, color: "#9aa3b2" }}>
              この糸はここまで。
              <button onClick={() => go(0)} style={{ ...ctlBtn(), marginLeft: 10 }}>
                最初から
              </button>
            </div>
          )}
        </div>
        </div>
      </div>

      {/* 操作 */}
      <div
        style={{
          flexShrink: 0, borderTop: "1px solid #d7dce2", padding: "10px 16px",
          display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap",
          justifyContent: "center", background: "#eef0f3",
        }}
      >
        <button onClick={() => go(idx - 1)} style={ctlBtn()} aria-label="前へ">◀</button>
        <button
          onClick={() => {
            if (done) go(0);
            setPlaying((p) => (done ? true : !p));
          }}
          style={{ ...ctlBtn(playing), minWidth: 76 }}
        >
          {playing ? "❙❙ 一時停止" : "▶ 再生"}
        </button>
        <button onClick={() => go(idx + 1)} style={ctlBtn()} aria-label="次へ">▶</button>
        <button
          onClick={onCycleSpeed}
          style={ctlBtn(speed !== 1)}
        >
          {speed}倍速
        </button>
        <span style={{ fontFamily: mono, fontSize: 11.5, color: "#8a93a3" }}>
          {idx + 1} / {evs.length}
        </span>
        <a
          href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(
            `「${thread.title}」——${thread.lead} ${hashtag}`
          )}&url=${encodeURIComponent(`${shareUrl}?t=${thread.key}`)}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{ ...ctlBtn(), textDecoration: "none" }}
        >
          この糸をXで共有
        </a>
      </div>
    </div>
  );
}
