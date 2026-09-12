import { eventYear } from "./event-schema.js";
import { eventId } from "./event-links";
import { CAT } from "./categories";
import Icon from "./Icon";
import { resolvePublicEventIcon } from "./event-icon.js";
import EventReferenceLinks from "./EventReferenceLinks";
import EventCustomizationActions from "./EventCustomizationActions";
import EventCustomizationEditForm from "./EventCustomizationEditForm";
import TimelineEventRowShell from "./TimelineEventRowShell";

export default function TimelinePublicEventRow({
  event,
  eraHeadings,
  stage,
  font,
  mono,
  gradeLabel,
  isEventOpen,
  toggleEvent,
  eventCustomizations,
  editingEventId,
  eventEditDraft,
  updateEventEditDraft,
  deleteAddedEvent,
  startEditingEvent,
  hideEvent,
  saveEditedEvent,
  cancelEditingEvent,
  hashtag,
  shareBaseUrl,
  miniBtn,
  gradeBadgeStyle,
  formatEventDate,
  ImportanceBadge,
}) {
  const id = eventId(event);
  const isOpen = isEventOpen(id);
  const grade = gradeLabel(
    eventYear(event)
  );
  const hasAgeProjection =
    Number.isFinite(event.age);

  const shareText =
    (
      hasAgeProjection
        ? (
            event.age < 0
              ? `${eventYear(event)}年(生まれる前)`
              : `${eventYear(event)}年・${grade}のとき`
          )
        : `${eventYear(event)}年`
    )
    + `:${event.title} ${hashtag}`;

  const secondaryCats = (
    event.cats ?? []
  ).filter(
    (category) =>
      category !== event.primary
      && category !== "sf"
  );

  const secondaryCatLabels =
    secondaryCats.map(
      (key) => CAT[key]?.label || key
    );

  const isAdded = (
    eventCustomizations.additions ?? []
  ).some(
    (item) => item.id === id
  );

  const isEditing =
    editingEventId === id;

  const headerContent = (
    <>
      <ImportanceBadge
        level={event.importance}
      />
      <Icon
        name={resolvePublicEventIcon(event)}
        color={CAT[event.primary].bg}
      />
      <span
        style={{
          fontSize: 14,
          lineHeight: 1.55,
          flex: 1,
          minWidth: 0,
        }}
      >
        {event.cats?.includes("sf") && (
          <span
            title="SF作品"
            aria-label="SF作品"
            style={{
              display: "inline-block",
              marginRight: 6,
              padding: "1px 5px",
              borderRadius: 5,
              fontSize: 10.5,
              lineHeight: 1.4,
              fontWeight: 800,
              fontStyle: "italic",
              color: CAT.work.fg,
              background: CAT.work.bg,
              verticalAlign: 1,
            }}
          >
            SF
          </span>
        )}
        {event.title}
      </span>

      {secondaryCats.length > 0 && (
        <span
          title={`関連：${secondaryCatLabels.join("・")}`}
          aria-label={`関連分野 ${secondaryCats.length}件: ${secondaryCatLabels.join("・")}`}
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 22,
            height: 22,
            border: "1px solid #cbd1d8",
            borderRadius: "50%",
            background: "#f7f8f9",
            color: "#626974",
            fontSize: 10,
            fontWeight: 800,
            lineHeight: 1,
            flexShrink: 0,
            marginTop: 2,
            boxSizing: "border-box",
          }}
        >
          +{secondaryCats.length}
        </span>
      )}
    </>
  );

  return (
    <TimelineEventRowShell
      id={id}
      event={event}
      eraHeadings={eraHeadings}
      stage={stage}
      font={font}
      mono={mono}
      gradeLabel={gradeLabel}
      isOpen={isOpen}
      toggleEvent={toggleEvent}
      gradeBadgeStyle={gradeBadgeStyle}
      buttonColor="#22272e"
      headerContent={headerContent}
    >
      {isOpen && event.summary && (
        <div
          style={{
            margin:
              "0 4px 10px 108px",
            padding: "10px 14px",
            fontSize: 13,
            lineHeight: 1.75,
            color: "#3d4450",
            background: stage.bg,
            borderLeft:
              `3px solid ${
                CAT[event.primary].bg
              }`,
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

          {secondaryCats.length > 0 && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                marginBottom: 7,
                fontSize: 11.5,
              }}
            >
              <span
                style={{
                  color: "#4b5563",
                  fontWeight: 800,
                }}
              >
                関連分野：
              </span>

              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 20,
                  height: 20,
                  border: "1px solid #b9c0c9",
                  borderRadius: "50%",
                  background: "#f1f3f5",
                  color: "#4f5660",
                  fontSize: 9.5,
                  fontWeight: 800,
                  lineHeight: 1,
                  boxSizing: "border-box",
                  flexShrink: 0,
                }}
              >
                +{secondaryCats.length}
              </span>

              <span>
                {secondaryCats.map((key, index) => (
                  <span key={key}>
                    {index > 0 && (
                      <span style={{ color: "#8a8f98" }}>・</span>
                    )}
                    <span
                      style={{
                        color: CAT[key]?.bg || "#626974",
                        fontWeight: 700,
                      }}
                    >
                      {CAT[key]?.label || key}
                    </span>
                  </span>
                ))}
              </span>
            </div>
          )}

          {event.summary}

          <EventReferenceLinks
            title={event.title}
            query={event.search}
            links={event.sources}
            color={
              CAT[event.primary].bg
            }
          />

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

          <EventCustomizationActions
            isAdded={isAdded}
            isEditing={isEditing}
            onDeleteAdded={() =>
              deleteAddedEvent(event)
            }
            onStartEditing={() =>
              startEditingEvent(event)
            }
            onHide={() =>
              hideEvent(event)
            }
            hashtag={hashtag}
            color={
              CAT[event.primary].bg
            }
            shareText={shareText}
            note={event.summary}
            shareUrl={
              `${shareBaseUrl}?e=${
                encodeURIComponent(id)
              }`
            }
            miniBtn={miniBtn}
          />

          {isEditing && (
            <EventCustomizationEditForm
              draft={eventEditDraft}
              updateDraft={
                updateEventEditDraft
              }
              onSave={() =>
                saveEditedEvent(event)
              }
              onCancel={
                cancelEditingEvent
              }
              font={font}
              miniBtn={miniBtn}
            />
          )}
        </div>
      )}
    </TimelineEventRowShell>
  );
}
