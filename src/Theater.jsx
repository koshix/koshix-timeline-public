import { eventYear } from "./event-schema.js";
import { validYear } from "./life-stages.js";
import { useEffect, useRef, useState } from "react";
import Icon from "./Icon";
import { CAT, catKey } from "./categories";
import { eventId } from "./event-links";
import ShareBar from "./ShareBar";

export default function Theater({
  thread,
  gradeLabel,
  birth,
  onClose,
  hashtag,
  shareUrl,
}) {
  const evs = thread.events;
  const [idx, setIdx] = useState(0);
  const listRef = useRef(null);

  const font =
    '"Hiragino Kaku Gothic ProN", "Hiragino Sans", "Yu Gothic Medium", "Noto Sans JP", sans-serif';
  const mono = 'ui-monospace, "SF Mono", Menlo, Consolas, monospace';

  const go = (i) => {
    setIdx(Math.max(0, Math.min(evs.length - 1, i)));
  };

  // 現在の項目を画面の中央へ送る
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
      else if (e.key === "ArrowRight" || e.key === "ArrowDown") go(idx + 1);
      else if (e.key === "ArrowLeft" || e.key === "ArrowUp") go(idx - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [idx, onClose]);

  const birthConfigured =
    validYear(birth) != null;

  const gradeOf = (ev) =>
    eventYear(ev) < birth
      ? "生まれる前"
      : gradeLabel(eventYear(ev));

  const ctlBtn = (on = false) => ({
    fontSize: 12, fontWeight: 700, cursor: "pointer", padding: "6px 12px",
    borderRadius: 999, fontFamily: font, lineHeight: 1.2,
    border: `1px solid ${on ? "#b0771e" : "#9aa3ad"}`,
    background: on ? "#f3dfb5" : "#ffffff",
    color: on ? "#6b4610" : "#374151",
  });

  const threadShareUrl = (() => {
    const url = new URL(
      shareUrl || window.location.href,
      window.location.href
    );
    url.search = "";
    url.hash = "";

    if (thread.dynamic && thread.query) {
      url.searchParams.set("threads", "1");
      url.searchParams.set("q", thread.query);
      url.searchParams.set("play", "1");
    } else {
      url.searchParams.set("t", thread.key);
    }

    return url.toString();
  })();

  const threadShareText =
    `「${thread.title}」——${thread.lead} ${hashtag}`;

  return (
    <div
      role="dialog"
      aria-label={`テーマ閲覧:${thread.title}`}
      style={{
        position: "fixed", inset: 0, zIndex: 60, display: "flex", flexDirection: "column",
        background: "#f7f7f5", color: "#22272e", fontFamily: font,
      }}
    >
      {/* 見出し */}
      <div style={{ padding: "14px 16px 10px", borderBottom: "1px solid #d7dce2", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 10.5, letterSpacing: "0.2em", color: "#8a93a3" }}>テーマでたどる</div>
            <div style={{ fontSize: 17, fontWeight: 800, marginTop: 3 }}>{thread.title}</div>
            <div style={{ fontSize: 11.5, color: "#4b5563", marginTop: 4, lineHeight: 1.6 }}>
              {thread.lead}
            </div>
          </div>
          <button onClick={onClose} aria-label="閉じる" style={{ ...ctlBtn(), padding: "6px 10px" }}>
            × 閉じる
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

      {/* 本体(現在の項目が中央に来るようスクロールする) */}
      <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
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
                    {eventYear(ev)}
                  </span>
                  {birthConfigured && (
                    <span
                      style={{
                        flexShrink: 0, fontSize: 11, fontWeight: 800, color: "#12151b",
                        background: "#c9ced8", borderRadius: 5, padding: "2px 7px", marginTop: 1,
                      }}
                    >
                      {gradeOf(ev)}
                    </span>
                  )}
                  <Icon name={ev.icon} color={color} size={active ? 20 : 16} />
                  <span
                    style={{
                      fontSize: active ? 19 : 14, fontWeight: active ? 800 : 500,
                      lineHeight: 1.5, flex: 1,
                    }}
                  >
                    {ev.title}
                  </span>
                </div>
                {active && ev.summary && (
                  <div
                    style={{
                      marginTop: 10, marginLeft: 58, paddingLeft: 12,
                      borderLeft: `3px solid ${color}`,
                      fontSize: 13.5, lineHeight: 1.85, color: "#4b5563",
                    }}
                  >
                    {ev.summary}
                  </div>
                )}
              </div>
            );
          })}
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
        <button
          onClick={() => go(idx - 1)}
          disabled={idx === 0}
          style={{ ...ctlBtn(), opacity: idx === 0 ? 0.45 : 1 }}
          aria-label="前へ"
        >
          ◀ 前へ
        </button>
        <button
          onClick={() => go(idx + 1)}
          disabled={idx === evs.length - 1}
          style={{ ...ctlBtn(), opacity: idx === evs.length - 1 ? 0.45 : 1 }}
          aria-label="次へ"
        >
          次へ ▶
        </button>
        <span style={{ fontFamily: mono, fontSize: 11.5, color: "#8a93a3" }}>
          {idx + 1} / {evs.length}
        </span>
        <ShareBar
          compact
          text={threadShareText}
          url={threadShareUrl}
          hashtag={hashtag}
        />
      </div>
    </div>
  );
}
