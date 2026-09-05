import {
  clipShareText,
  weighShareText,
} from "./event-links";

export default function ShareBar({
  text,
  url,
  hashtag,
  compact = false,
  small = false,
  color = "#37414f",
  note,
  labelOnly = false,
}) {
  const encodedText =
    encodeURIComponent(text);
  const encodedUrl =
    encodeURIComponent(url);

  const targets = [
    [
      "X",
      `https://x.com/intent/post?text=${encodedText}&url=${encodedUrl}`,
    ],
    [
      "Bluesky",
      `https://bsky.app/intent/compose?text=${encodeURIComponent(
        `${text} ${url}`
      )}`,
    ],
    ...(compact
      ? []
      : [
          [
            "Facebook",
            `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
          ],
          [
            "LINE",
            `https://social-plugins.line.me/lineit/share?url=${encodedUrl}&text=${encodedText}`,
          ],
        ]),
  ];

  const head = text.replace(
    ` ${hashtag}`,
    ""
  );

  const room =
    280 -
    23 -
    weighShareText(head) -
    weighShareText(hashtag) -
    5;

  const noteText = note
    ? `${head}\n\n${clipShareText(
        note,
        Math.max(40, room)
      )}\n${hashtag}`
    : "";

  const base = {
    fontSize:
      compact || small ? 11 : 11.5,
    fontWeight: 700,
    textDecoration: "none",
    borderRadius:
      labelOnly ? 0 : 999,
    padding:
      labelOnly
        ? "2px 3px"
        : compact || small
          ? "3px 10px"
          : "4px 12px",
    border:
      labelOnly
        ? "none"
        : `1px solid ${color}44`,
    background:
      labelOnly
        ? "transparent"
        : "#ffffffaa",
    color,
    cursor: "pointer",
    lineHeight: 1.6,
    fontFamily: "inherit",
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 6,
      }}
    >
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 6,
          alignItems: "center",
        }}
      >
        {note && (
          <span
            style={{
              fontSize: 10.5,
              color: "#9aa0a8",
              flexShrink: 0,
              minWidth: 72,
            }}
          >
            タイトルのみ
          </span>
        )}

        {targets.map(
          ([label, href]) => (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              style={base}
            >
              {labelOnly
                ? label === "LINE"
                  ? "Line"
                  : label
                : `${label}で共有`}
            </a>
          )
        )}
      </div>

      {note && (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 6,
            alignItems: "center",
          }}
        >
          <span
            style={{
              fontSize: 10.5,
              color: "#9aa0a8",
              flexShrink: 0,
              minWidth: 72,
            }}
          >
            解説をつけて
          </span>

          <a
            href={`https://x.com/intent/post?text=${encodeURIComponent(
              noteText
            )}&url=${encodedUrl}`}
            target="_blank"
            rel="noopener noreferrer"
            style={base}
          >
            Xに投稿
          </a>

          <a
            href={`https://bsky.app/intent/compose?text=${encodeURIComponent(
              `${noteText}\n${url}`
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            style={base}
          >
            Blueskyに投稿
          </a>

        </div>
      )}
    </div>
  );
}
