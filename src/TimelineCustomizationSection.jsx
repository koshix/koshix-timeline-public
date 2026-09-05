import { eventYear } from "./event-schema.js";
import { CAT } from "./categories";
import EventCustomizationAddForm from "./EventCustomizationAddForm";
import EventCustomizationControls from "./EventCustomizationControls";
import EventCustomizationHiddenList from "./EventCustomizationHiddenList";

export default function TimelineCustomizationSection({
  eventCustomizations,
  eventCustomizationStatus,
  eventCustomizationEditorOpen,
  eventCustomizationFileInputRef,
  importEventCustomizationsFile,
  exportEventCustomizationsFile,
  toggleEventCustomizationEditor,
  closeEventCustomizationEditor,
  clearEventCustomizations,
  openNewEventForm,
  eventAddOpen,
  eventAddDraft,
  updateEventAddDraft,
  saveAddedEvent,
  cancelAddingEvent,
  restoreHiddenEvent,
  events,
  mainCategories,
  font,
  miniBtn,
}) {
  const categoryOptions = mainCategories.map(
    (key) => ({
      key,
      label: CAT[key].label,
    })
  );

  const hiddenItems = (
    eventCustomizations.hidden ?? []
  ).map((id) => {
    const base = events.find(
      (event) => event.id === id
    );

    return {
      id,
      label: base
        ? `${eventYear(base)} ${base.title}`
        : id,
    };
  });

  return (
    <div
      id="timeline-customization"
      style={{
        scrollMarginTop: 16,
        background: "#f3f7fb",
        border: "1px solid #cfdce8",
        borderRadius: 12,
        padding: "12px 16px",
        marginTop: 16,
        marginBottom: 14,
      }}
    >
      <EventCustomizationControls
        overrideCount={
          Object.keys(
            eventCustomizations.overrides ?? {}
          ).length
        }
        hiddenCount={
          eventCustomizations.hidden?.length ?? 0
        }
        additionCount={
          eventCustomizations.additions?.length
          ?? 0
        }
        eventCustomizationStatus={
          eventCustomizationStatus
        }
        eventCustomizationEditorOpen={
          eventCustomizationEditorOpen
        }
        eventCustomizationFileInputRef={
          eventCustomizationFileInputRef
        }
        importEventCustomizationsFile={
          importEventCustomizationsFile
        }
        exportEventCustomizationsFile={
          exportEventCustomizationsFile
        }
        toggleEventCustomizationEditor={
          toggleEventCustomizationEditor
        }
        clearEventCustomizations={
          clearEventCustomizations
        }
        miniBtn={miniBtn}
      />

      {eventCustomizationEditorOpen && (
        <div
          style={{
            marginTop: 12,
            padding: 12,
            border: "1px solid #cfdce8",
            borderRadius: 10,
            background: "#fff",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <strong
              style={{
                fontSize: 12,
                color: "#365f7d",
              }}
            >
              年表の変更内容を編集
            </strong>

            <span style={{ flex: 1 }} />

            <button
              type="button"
              onClick={openNewEventForm}
              style={{
                ...miniBtn,
                background: "#e7f1fb",
                border: "1px solid #91b3d2",
                color: "#315f87",
                fontWeight: 800,
              }}
            >
              ＋追加
            </button>

            <button
              type="button"
              onClick={
                closeEventCustomizationEditor
              }
              style={{
                ...miniBtn,
                marginLeft: 6,
              }}
            >
              ×閉じる
            </button>
          </div>
        </div>
      )}

      {eventCustomizationEditorOpen
        && eventAddOpen && (
          <EventCustomizationAddForm
            draft={eventAddDraft}
            categoryOptions={categoryOptions}
            updateDraft={updateEventAddDraft}
            saveAddedEvent={saveAddedEvent}
            cancelAddingEvent={
              cancelAddingEvent
            }
            font={font}
            miniBtn={miniBtn}
          />
        )}

      {eventCustomizationEditorOpen
        && hiddenItems.length > 0 && (
          <EventCustomizationHiddenList
            items={hiddenItems}
            restoreHiddenEvent={
              restoreHiddenEvent
            }
            miniBtn={miniBtn}
          />
        )}
    </div>
  );
}
