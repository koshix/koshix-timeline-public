import { eventYear } from "./event-schema.js";

export default function TimelineEventRowShell({
  id,
  event,
  eraHeadings,
  stage,
  font,
  mono,
  gradeLabel,
  isOpen,
  toggleEvent,
  gradeBadgeStyle,
  background,
  buttonColor,
  headerContent,
  children,
}) {
  const hasAgeProjection =
    Number.isFinite(event.age);

  return (
    <li
      id={`ev-${id}`}
      style={{
        borderBottom: "1px solid #ececea",
        background,
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
          boxSizing: "border-box",
          textAlign: "left",
          background: "none",
          border: "none",
          cursor: "pointer",
          fontFamily: font,
          color: buttonColor,
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

        {hasAgeProjection && (
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
        )}

        {headerContent}

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

      {children}
    </li>
  );
}
