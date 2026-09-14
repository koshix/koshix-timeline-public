import { eventYear } from "./event-schema.js";
import TimelineEraHeadings from "./TimelineEraHeadings";
import TimelinePersonalEventRow from "./TimelinePersonalEventRow";
import TimelinePublicEventRow from "./TimelinePublicEventRow";

export default function TimelineGroupList({
  timeline,
  earlyHistory,
  toggleStage,
  eventOpen,
  personal,
  customization,
  sharing,
  ui,
}) {
  const grouped = timeline;
  const {
    count: earlyHistoryCount,
    open: earlyHistoryOpen,
    setOpen: setEarlyHistoryOpen,
    keys: earlyHistoryGroupKeys,
  } = earlyHistory;
  const {
    isEventOpen,
    toggleEvent,
  } = eventOpen;
  const {
    source: personalEventsSource,
    startEditing: startEditingPersonalEvent,
    deleteEvent: deletePersonalEvent,
  } = personal;
  const {
    eventCustomizations,
    editingEventId,
    eventEditDraft,
    updateEventEditDraft,
    deleteAddedEvent,
    startEditingEvent,
    hideEvent,
    saveEditedEvent,
    cancelEditingEvent,
  } = customization;
  const {
    hashtag: HASHTAG,
    baseUrl: SHARE_URL,
  } = sharing;
  const {
    font,
    mono,
    miniBtn,
    gradeBadgeStyle,
    formatEventDate,
    ImportanceBadge,
  } = ui;

  return (
    <>
      {/* 16〜19世紀の背景史をまとめる大枠 */}
      {earlyHistoryCount > 0 && (
        <section style={{ marginBottom: 12 }}>
          <button
            type="button"
            onClick={() =>
              setEarlyHistoryOpen((open) => !open)
            }
            aria-expanded={earlyHistoryOpen}
            style={{
              display: "flex",
              alignItems: "baseline",
              gap: 10,
              width: "100%",
              boxSizing: "border-box",
              padding: "9px 14px",
              border: "1px solid #e0e3e7",
              borderLeft: "4px solid #b8bec6",
              borderRadius: 8,
              background: "#f7f8f9",
              color: "#7b838c",
              cursor: "pointer",
              textAlign: "left",
              fontFamily: font,
            }}
          >
            <strong
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: "#7b838c",
              }}
            >
              16〜19世紀
            </strong>

            <span
              style={{
                fontFamily: mono,
                fontSize: 11.5,
                color: "#8a9199",
              }}
            >
              1501–1900
            </span>

            <span style={{ flex: 1 }} />

            <span
              style={{
                fontFamily: mono,
                fontSize: 11,
                color: "#9aa0a8",
              }}
            >
              {earlyHistoryCount}件
            </span>

            <span
              aria-hidden="true"
              style={{
                fontSize: 10.5,
                color: "#9299a1",
              }}
            >
              {earlyHistoryOpen ? "▼" : "▶"}
            </span>
          </button>
        </section>
      )}

      {/* 個人史グループ */}
      {grouped.groups.map((g) => {
      const stageClosed = g.closed;
      const isEarlyHistory =
        earlyHistoryGroupKeys.has(g.key);

      if (isEarlyHistory && !earlyHistoryOpen) {
        return null;
      }
      return (
        <section key={g.key} style={{ marginBottom: 22 }}>
          <button
            onClick={() => toggleStage(g.key)}
            aria-expanded={!stageClosed}
            style={{
              display: "flex", alignItems: "baseline", gap: 10, width: "100%", boxSizing: "border-box",
              borderTop: "none", borderRight: "none", borderBottom: "none",
              borderLeftWidth: 6, borderLeftStyle: "solid", borderLeftColor: g.stage.color,
              background: g.stage.bg, borderRadius: 8,
              padding: "8px 14px", marginBottom: 8,
              cursor: "pointer", textAlign: "left", fontFamily: font,
            }}
          >
            <h2 style={{ fontSize: 16, fontWeight: 800, margin: 0, color: g.stage.color }}>
              {g.stage.label}
            </h2>
            <span style={{ fontFamily: mono, fontSize: 12, color: "#6b7280" }}>
              {g.rangeFrom != null
                ? `${g.rangeFrom}–${g.rangeTo}`
                : `${eventYear(g.items[0])}–${eventYear(g.items[g.items.length - 1])}`}
            </span>
            <span style={{ flex: 1 }} />
            <span style={{ fontFamily: mono, fontSize: 11.5, color: "#8a8f98" }}>
              {g.items.length}件
            </span>
            <span style={{ fontSize: 11, color: g.stage.color }} aria-hidden="true">
              {stageClosed ? "▶" : "▼"}
            </span>
          </button>
          {!stageClosed && (
          <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
            {g.items.map((ev, i) => {
              const eraHeadings = (
                <TimelineEraHeadings
                  event={ev}
                  previousEvent={
                    i > 0
                      ? g.items[i - 1]
                      : null
                  }
                  mono={mono}
                />
              );

              if (ev.primary === "me") {
                return (
                  <TimelinePersonalEventRow
                    key={ev.id}
                    event={ev}
                    eraHeadings={eraHeadings}
                    stage={g.stage}
                    font={font}
                    mono={mono}
                    gradeLabel={grouped.gradeLabel}
                    isEventOpen={isEventOpen}
                    toggleEvent={toggleEvent}
                    personalEventsSource={
                      personalEventsSource
                    }
                    startEditingPersonalEvent={
                      startEditingPersonalEvent
                    }
                    deletePersonalEvent={
                      deletePersonalEvent
                    }
                    miniBtn={miniBtn}
                    gradeBadgeStyle={
                      gradeBadgeStyle
                    }
                    formatEventDate={
                      formatEventDate
                    }
                  />
                );
              }

              return (
                <TimelinePublicEventRow
                  key={ev.id}
                  event={ev}
                  eraHeadings={eraHeadings}
                  stage={g.stage}
                  font={font}
                  mono={mono}
                  gradeLabel={grouped.gradeLabel}
                  isEventOpen={isEventOpen}
                  toggleEvent={toggleEvent}
                  eventCustomizations={
                    eventCustomizations
                  }
                  editingEventId={
                    editingEventId
                  }
                  eventEditDraft={
                    eventEditDraft
                  }
                  updateEventEditDraft={
                    updateEventEditDraft
                  }
                  deleteAddedEvent={
                    deleteAddedEvent
                  }
                  startEditingEvent={
                    startEditingEvent
                  }
                  hideEvent={hideEvent}
                  saveEditedEvent={
                    saveEditedEvent
                  }
                  cancelEditingEvent={
                    cancelEditingEvent
                  }
                  hashtag={HASHTAG}
                  shareBaseUrl={SHARE_URL}
                  miniBtn={miniBtn}
                  gradeBadgeStyle={
                    gradeBadgeStyle
                  }
                  formatEventDate={
                    formatEventDate
                  }
                  ImportanceBadge={
                    ImportanceBadge
                  }
                />
              );
            })}
          </ul>
          )}
        </section>
      );
      })}
    </>
  );
}
