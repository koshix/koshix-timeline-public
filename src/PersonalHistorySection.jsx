import { CAT } from "./categories";
import PersonalHistoryControls from "./PersonalHistoryControls";
import PersonalHistoryEventForm from "./PersonalHistoryEventForm";
import PersonalHistoryEditorList from "./PersonalHistoryEditorList";

export default function PersonalHistorySection({
  myEvents,
  personalEventsSource,
  personalFileStatus,
  personalAddOpen,
  personalEditorOpen,
  editingPersonalId,
  personalDraft,
  personalFileInputRef,
  importPersonalEventsFile,
  exportPersonalEventsFile,
  togglePersonalEditor,
  closePersonalEditor,
  updatePersonalDraft,
  openNewPersonalEventForm,
  closePersonalEventForm,
  startEditingPersonalEvent,
  clearPersonalEventsFile,
  savePersonalEvent,
  deletePersonalEvent,
  copyServerPersonalEventsToBrowser,
  onViewTimeline,
  font,
  miniBtn,
}) {
  return (
    <div
      id="personal-history"
      style={{
        scrollMarginTop: 16,
        background: "#f7f2fb",
        border: "1px solid #dfd2ea",
        borderRadius: 12,
        padding: "12px 16px",
        marginTop: 16,
        marginBottom: 14,
      }}
    >
      <PersonalHistoryControls
        eventCount={myEvents.length}
        personalEventsSource={
          personalEventsSource
        }
        personalEditorOpen={
          personalEditorOpen
        }
        personalFileInputRef={
          personalFileInputRef
        }
        importPersonalEventsFile={
          importPersonalEventsFile
        }
        exportPersonalEventsFile={
          exportPersonalEventsFile
        }
        togglePersonalEditor={
          togglePersonalEditor
        }
        clearPersonalEventsFile={
          clearPersonalEventsFile
        }
        copyServerPersonalEventsToBrowser={
          copyServerPersonalEventsToBrowser
        }
        titleColor={CAT.me.bg}
        miniBtn={miniBtn}
      />

      {personalEditorOpen
        && personalEventsSource !== "server" && (
          <PersonalHistoryEditorList
            events={myEvents}
            openNewPersonalEventForm={
              openNewPersonalEventForm
            }
            closePersonalEditor={
              closePersonalEditor
            }
            startEditingPersonalEvent={
              startEditingPersonalEvent
            }
            deletePersonalEvent={
              deletePersonalEvent
            }
            miniBtn={miniBtn}
          />
        )}

      {personalAddOpen
        && personalEventsSource !== "server" && (
          <PersonalHistoryEventForm
            draft={personalDraft}
            isEditing={
              Boolean(editingPersonalId)
            }
            updateDraft={
              updatePersonalDraft
            }
            savePersonalEvent={
              savePersonalEvent
            }
            closePersonalEventForm={
              closePersonalEventForm
            }
            font={font}
            miniBtn={miniBtn}
          />
        )}

      {personalEventsSource === "server" && (
        <div
          style={{
            fontSize: 10.5,
            lineHeight: 1.6,
            color: "#8a6a3d",
            marginTop: 8,
          }}
        >
          管理者データは読み取り専用です。編集する場合は「編集用に取り込む」でこのブラウザに複製します。
        </div>
      )}

      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          marginTop: 10,
        }}
      >
        <button
          type="button"
          onClick={onViewTimeline}
          style={{
            ...miniBtn,
            fontWeight: 800,
            border: "1px solid #9aa4b2",
            background: "#ffffff",
            color: "#4b5563",
          }}
        >
          年表で見る ↑
        </button>
      </div>

      {personalFileStatus && (
        <div
          role="status"
          style={{
            fontSize: 11,
            lineHeight: 1.6,
            color: "#6b7280",
            marginTop: 8,
          }}
        >
          {personalFileStatus}
        </div>
      )}
    </div>
  );
}
