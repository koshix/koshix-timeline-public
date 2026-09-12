import { CAT } from "./categories";
import PersonalHistoryControls from "./PersonalHistoryControls";
import PersonalHistoryEventForm from "./PersonalHistoryEventForm";
import PersonalHistoryEditorList from "./PersonalHistoryEditorList";

export default function PersonalHistorySection({
  personalHistoryOpen,
  togglePersonalHistory,
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
        background: "#faf7fc",
        border: "1px solid #dfd2ea",
        borderRadius: 12,
        padding: "12px 16px",
        marginTop: 16,
        marginBottom: 14,
      }}
    >
      <button
        type="button"
        onClick={togglePersonalHistory}
        aria-expanded={personalHistoryOpen}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          width: "100%",
          boxSizing: "border-box",
          background: "transparent",
          border: "none",
          padding: 0,
          cursor: "pointer",
          textAlign: "left",
          fontFamily: font,
          color: "#22272e",
        }}
      >
        <span
          style={{
            fontSize: 14,
            fontWeight: 800,
            color: CAT.me.bg,
          }}
        >
          ②自分史の編集（任意）
        </span>
        <span style={{ flex: 1 }} />
        <span
          style={{
            fontSize: 11,
            color: "#8a8f98",
          }}
        >
          {personalHistoryOpen ? "▼ 閉じる" : "▶ 開く"}
        </span>
      </button>

      {personalHistoryOpen && (
        <>
          <div
            style={{
              margin: "12px 0 10px",
              padding: "9px 11px",
              border: "1px solid #cfd8e3",
              borderRadius: 9,
              background: "#f7f9fc",
              fontSize: 11.5,
              lineHeight: 1.7,
              color: "#59616c",
            }}
          >
            <strong>個人情報の扱い：</strong>
            ここで入力した内容は、この端末のこのブラウザ内だけに保存されます。
            公開年表の元データには書き込まれません。
          </div>
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
          ③年表で見る ↓
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
        </>
      )}
    </div>
  );
}
