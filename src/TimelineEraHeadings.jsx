import { eventYear } from "./event-schema.js";
import {
  backgroundEraOf,
  halfCenturyMarkerOf,
  japaneseEraOf,
} from "./timeline-eras";

const ERA_HEADING_STYLES = {
  background: {
    padding: "7px 10px 7px 58px",
    border: "#758395",
    borderBottom: "#d3dae2",
    background:
      "linear-gradient(90deg, #e9eef3 0%, #f7f8fa 80%)",
    color: "#3f4b59",
    badgeBackground: "#748294",
    strongColor: "#384553",
    rangeColor: "#78838f",
  },
  halfCentury: {
    padding: "6px 10px 6px 58px",
    border: "#8d949e",
    borderBottom: "#dadde2",
    background:
      "linear-gradient(90deg, #eff1f4 0%, #fafafa 80%)",
    color: "#555e69",
    badgeBackground: "#8d949e",
    strongColor: "#4f5863",
    rangeColor: "#808892",
  },
  japanese: {
    padding: "6px 10px 6px 58px",
    border: "#957782",
    borderBottom: "#e0d4d9",
    background:
      "linear-gradient(90deg, #f2e9ed 0%, #faf8f9 80%)",
    color: "#56434a",
    badgeBackground: "#91717c",
    strongColor: "#503d44",
    rangeColor: "#89737b",
  },
};

function EraHeading({
  badge,
  era,
  mono,
  style,
}) {
  if (!era) return null;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        flexWrap: "wrap",
        padding: style.padding,
        borderTop:
          `2px solid ${style.border}`,
        borderBottom:
          `1px solid ${style.borderBottom}`,
        background: style.background,
        color: style.color,
      }}
    >
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          padding: "2px 7px",
          borderRadius: 999,
          background: style.badgeBackground,
          color: "#fff",
          fontSize: 10.5,
          fontWeight: 800,
          letterSpacing: "0.05em",
          lineHeight: 1.4,
        }}
      >
        {badge}
      </span>
      <strong
        style={{
          fontSize: 13,
          fontWeight: 800,
          color: style.strongColor,
        }}
      >
        {era.label}
      </strong>
      <span
        style={{
          fontFamily: mono,
          fontSize: 11,
          fontWeight: 600,
          color: style.rangeColor,
        }}
      >
        {era.from}–
        {Number.isFinite(era.to) ? era.to : ""}
      </span>
    </div>
  );
}

function changedEra({
  event,
  previousEvent,
  resolver,
}) {
  const current = resolver(
    eventYear(event)
  );

  if (!current) return null;

  if (!previousEvent) return current;

  const previous = resolver(
    eventYear(previousEvent)
  );

  return previous?.key === current.key
    ? null
    : current;
}

export default function TimelineEraHeadings({
  event,
  previousEvent,
  mono,
}) {
  const backgroundEra = changedEra({
    event,
    previousEvent,
    resolver: backgroundEraOf,
  });

  const halfCenturyMarker = changedEra({
    event,
    previousEvent,
    resolver: halfCenturyMarkerOf,
  });

  const japaneseEra = changedEra({
    event,
    previousEvent,
    resolver: japaneseEraOf,
  });

  return (
    <>
      <EraHeading
        badge="背景史"
        era={backgroundEra}
        mono={mono}
        style={ERA_HEADING_STYLES.background}
      />
      <EraHeading
        badge="世紀"
        era={halfCenturyMarker}
        mono={mono}
        style={ERA_HEADING_STYLES.halfCentury}
      />
      <EraHeading
        badge="元号"
        era={japaneseEra}
        mono={mono}
        style={ERA_HEADING_STYLES.japanese}
      />
    </>
  );
}
