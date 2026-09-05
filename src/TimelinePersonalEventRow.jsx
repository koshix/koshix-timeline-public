import { eventYear } from "./event-schema.js";
import { eventId } from "./event-links";
import { CAT } from "./categories";
import Icon from "./Icon";

export default function TimelinePersonalEventRow({
  event,
  eraHeadings,
  stage,
  font,
  mono,
  gradeLabel,
  isEventOpen,
  toggleEvent,
  personalEventsSource,
  startEditingPersonalEvent,
  deletePersonalEvent,
  miniBtn,
  gradeBadgeStyle,
  formatEventDate,
}) {
  const id = eventId(event);
  const isOpen = isEventOpen(id);

  return (
    <li
      id={`ev-${id}`}
      style={{
        borderBottom: "1px solid #ececea",
        background: "#f2faf6",
      }}
    >
      {eraHeadings}
      <button
        onClick={() => toggleEvent(id)}
        aria-expanded={isOpen}
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: 10,
          padding: "8px 4px",
          width: "100%",
          textAlign: "left",
          background: "none",
          border: "none",
          cursor: "pointer",
          fontFamily: font,
        }}
      >
        <span
          style={{
            fontFamily: mono,
            fontSize: 13,
            color: "#8a8f98",
            width: 44,
            flexShrink: 0,
            paddingTop: 3,
          }}
        >
          {eventYear(event)}
        </span>
        <span
          style={{
            flexShrink: 0,
            minWidth: 44,
            textAlign: "center",
            fontSize: 13,
            fontWeight: 800,
            ...gradeBadgeStyle(
              stage,
              event.age
            ),
            borderRadius: 6,
            padding: "3px 8px",
          }}
        >
          {gradeLabel(eventYear(event))}
        </span>
        <Icon
          name={event.icon ?? "flag"}
          color={CAT.me.bg}
        />
        <span
          style={{
            fontSize: 14,
            lineHeight: 1.55,
            flex: 1,
            fontWeight: 700,
            color: CAT.me.bg,
          }}
        >
          {event.title}
        </span>
        <span
          style={{
            fontSize: 11,
            color: "#b0b4bb",
            paddingTop: 4,
            flexShrink: 0,
            transform:
              isOpen
                ? "rotate(90deg)"
                : "none",
            transition:
              "transform 0.15s",
          }}
          aria-hidden="true"
        >
          ▶
        </span>
      </button>

      {isOpen &&
        personalEventsSource === "browser" && (
          <div
            style={{
              display: "flex",
              gap: 8,
              margin: "0 4px 8px 108px",
            }}
          >
            <button
              type="button"
              onClick={() =>
                startEditingPersonalEvent(
                  event
                )
              }
              style={miniBtn}
            >
              修正
            </button>
            <button
              type="button"
              onClick={() =>
                deletePersonalEvent(event)
              }
              style={{
                ...miniBtn,
                color: "#9b2c2c",
                border:
                  "1px solid #d8a4a4",
                background: "#fff7f7",
              }}
            >
              削除
            </button>
          </div>
        )}

      {isOpen && event.summary && (
        <div
          style={{
            margin: "0 4px 10px 108px",
            padding: "10px 14px",
            fontSize: 13,
            lineHeight: 1.75,
            color: "#3d4450",
            background: stage.bg,
            borderLeft:
              `3px solid ${CAT.me.bg}`,
            borderRadius:
              "0 8px 8px 0",
          }}
        >
          <div
            style={{
              marginBottom: 6,
              fontSize: 11.5,
              fontWeight: 700,
              color: "#6b7280",
            }}
          >
            日付：
            {formatEventDate(event.date)}
          </div>
          {event.summary}
          {event.note && (
            <div
              style={{
                marginTop: 9,
                padding: "7px 10px",
                border:
                  "1px solid #d8dce2",
                borderRadius: 7,
                background: "#ffffff88",
                color: "#626974",
                fontSize: 11.5,
                lineHeight: 1.65,
              }}
            >
              <span
                style={{
                  fontWeight: 800,
                }}
              >
                補足：
              </span>
              {event.note}
            </div>
          )}
        </div>
      )}
    </li>
  );
}
