import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  workspaceStore,
} from "./workspace-store.js";
import { downloadBlob } from "./browser-download.js";
import {
  parsePersonalEventsTsv,
  serializePersonalEventsTsv,
} from "./personal-events-tsv.js";

const createPersonalDraft = () => ({
  date: "",
  title: "",
  importance: 2,
  summary: "",
});

export default function usePersonalEvents({
  onFirstAdded,
  onCleared,
  onDeleted,
} = {}) {
  const [myEvents, setMyEvents] = useState([]);
  const [
    personalEventsSource,
    setPersonalEventsSource,
  ] = useState("");
  const [
    personalFileStatus,
    setPersonalFileStatus,
  ] = useState("");
  const [
    personalAddOpen,
    setPersonalAddOpen,
  ] = useState(false);
  const [
    personalEditorOpen,
    setPersonalEditorOpen,
  ] = useState(false);
  const [
    editingPersonalId,
    setEditingPersonalId,
  ] = useState(null);
  const [
    personalDraft,
    setPersonalDraft,
  ] = useState(createPersonalDraft);

  const personalFileInputRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    const loadInitialPersonalEvents =
      async () => {
        try {
          const administratorData =
            await workspaceStore
              .administratorData
              .load();

          if (
            !cancelled &&
            administratorData !== null
          ) {
            setMyEvents(
              administratorData.personalEvents
            );
            setPersonalEventsSource("server");
            setPersonalFileStatus(
              `管理者データ ${administratorData.personalEvents.length}件をブラウザ保存から読み込みました`
            );
            return;
          }
        } catch (err) {
          console.error(
            "Browser administrator data could not be loaded:",
            err
          );
        }

        try {
          const events =
            await workspaceStore
              .personalEvents
              .load();

          if (!cancelled) {
            setMyEvents(events);
            if (events.length > 0) {
              setPersonalEventsSource(
                "browser"
              );
            }
          }
        } catch (err) {
          console.error(
            "Browser personal history could not be loaded:",
            err
          );
          if (!cancelled) {
            setPersonalFileStatus(
              err?.message ||
                "ブラウザ内の自分史を読み込めませんでした"
            );
          }
        }
      };

    loadInitialPersonalEvents();

    return () => {
      cancelled = true;
    };
  }, []);

  const importPersonalEventsFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";

    if (!file) return;

    try {
      const text = await file.text();
      const events = parsePersonalEventsTsv(text);

      await workspaceStore.personalEvents.save(events);
      setMyEvents(events);
      setPersonalEventsSource("browser");
      setEditingPersonalId(null);
      setPersonalAddOpen(false);
      setPersonalFileStatus(
        `${file.name} から ${events.length}件を読み込み、このブラウザに保存しました`
      );
    } catch (err) {
      console.error(
        "Personal history file could not be imported:",
        err
      );
      setPersonalFileStatus(
        `読み込み失敗: ${err?.message || String(err)}`
      );
    }
  };

  const exportPersonalEventsFile = () => {
    try {
      const text = serializePersonalEventsTsv(myEvents);
      const blob = new Blob(
        [text],
        {
          type:
            "text/tab-separated-values;charset=utf-8",
        }
      );
      downloadBlob(
        blob,
        "koshix-timeline-personal-history.tsv"
      );

      setPersonalFileStatus(
        `${myEvents.length}件をTSVファイルへ書き出しました`
      );
    } catch (err) {
      console.error(
        "Personal history file could not be exported:",
        err
      );
      setPersonalFileStatus(
        `書き出し失敗: ${err?.message || String(err)}`
      );
    }
  };

  const resetPersonalDraft = () => {
    setPersonalDraft(createPersonalDraft());
  };

  const openPersonalEventEntry = () => {
    if (personalEventsSource === "server") return;

    setPersonalEditorOpen(true);
    setPersonalAddOpen(true);
    setEditingPersonalId(null);
    resetPersonalDraft();
  };

  const togglePersonalEditor = () => {
    if (personalEventsSource === "server") return;

    setPersonalEditorOpen((value) => !value);
    setPersonalAddOpen(false);
    setEditingPersonalId(null);
    resetPersonalDraft();
  };

  const closePersonalEditor = () => {
    setPersonalEditorOpen(false);
    setPersonalAddOpen(false);
    setEditingPersonalId(null);
    resetPersonalDraft();
  };

  const updatePersonalDraft = (field, value) => {
    setPersonalDraft((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const openNewPersonalEventForm = () => {
    if (personalEventsSource === "server") return;

    setPersonalEditorOpen(true);

    if (
      personalAddOpen &&
      editingPersonalId === null
    ) {
      setPersonalAddOpen(false);
      return;
    }

    setEditingPersonalId(null);
    resetPersonalDraft();
    setPersonalAddOpen(true);
  };

  const closePersonalEventForm = () => {
    setEditingPersonalId(null);
    resetPersonalDraft();
    setPersonalAddOpen(false);
  };

  const startEditingPersonalEvent = (event) => {
    if (personalEventsSource !== "browser") {
      setPersonalFileStatus(
        "編集できるのは、このブラウザに保存した自分史だけです"
      );
      return;
    }

    setPersonalEditorOpen(true);
    setEditingPersonalId(event.id);
    setPersonalDraft({
      date: event.date ?? "",
      title: event.title ?? "",
      importance: event.importance ?? 2,
      summary: event.summary ?? "",
    });
    setPersonalAddOpen(true);
    setPersonalFileStatus(
      `自分史「${event.title}」を編集中です`
    );

    setTimeout(() => {
      document
        .getElementById("personal-history-editor")
        ?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
    }, 0);
  };

  const clearPersonalEventsFile = async () => {
    if (personalEventsSource !== "browser") {
      setPersonalFileStatus(
        "消去できるのは、このブラウザの自分史を使用しているときだけです"
      );
      return;
    }

    const ok = window.confirm(
      `自分史 ${myEvents.length}件をこのブラウザから消去しますか？`
    );

    if (!ok) return;

    try {
      await workspaceStore.personalEvents.clear();

      setMyEvents([]);
      setPersonalEventsSource("");
      onCleared?.();
      setEditingPersonalId(null);
      resetPersonalDraft();
      setPersonalAddOpen(false);
      setPersonalEditorOpen(false);
      setPersonalFileStatus(
        "このブラウザの自分史を消去しました"
      );
    } catch (err) {
      console.error(
        "Personal history TSV could not be cleared:",
        err
      );
      setPersonalFileStatus(
        `消去失敗: ${err?.message || String(err)}`
      );
    }
  };

  const savePersonalEvent = async () => {
    if (personalEventsSource === "server") {
      setPersonalFileStatus(
        "管理者データを表示中はブラウザ自分史を追加・編集できません"
      );
      return;
    }

    const date = String(
      personalDraft.date ?? ""
    ).trim();
    const title = String(
      personalDraft.title ?? ""
    ).trim();
    const summary = String(
      personalDraft.summary ?? ""
    ).trim();

    const existing = editingPersonalId
      ? myEvents.find(
          (event) =>
            event.id === editingPersonalId
        )
      : null;

    if (editingPersonalId && !existing) {
      setPersonalFileStatus(
        "編集対象の自分史が見つかりません"
      );
      return;
    }

    const event = existing
      ? {
          ...existing,
          date,
          title: title,
          importance: Number(
            personalDraft.importance
          ),
          summary: summary,
        }
      : {
          id: `me-${Date.now().toString(36)}`,
          date,
          title: title,
          cats: ["me"],
          primary: "me",
          importance: Number(
            personalDraft.importance
          ),
          icon: "flag",
          summary: summary,
        };

    const firstAdded =
      !existing && myEvents.length === 0;

    const rawEvents = existing
      ? myEvents.map((item) =>
          item.id === editingPersonalId
            ? event
            : item
        )
      : [...myEvents, event];

    try {
      // 既存TSV仕様で検証してからIndexedDBへ保存する。
      const events = parsePersonalEventsTsv(
        serializePersonalEventsTsv(rawEvents)
      );

      await workspaceStore.personalEvents.save(events);

      setMyEvents(events);
      setPersonalEventsSource("browser");

      if (firstAdded) {
        onFirstAdded?.();
      }

      setEditingPersonalId(null);
      resetPersonalDraft();
      setPersonalAddOpen(false);
      setPersonalFileStatus(
        existing
          ? `自分史「${title}」を更新し、このブラウザに保存しました`
          : `自分史「${title}」を追加し、このブラウザに保存しました`
      );
    } catch (err) {
      console.error(
        "Personal history event could not be saved:",
        err
      );
      setPersonalFileStatus(
        `${existing ? "更新" : "追加"}失敗: ${
          err?.message || String(err)
        }`
      );
    }
  };

  const deletePersonalEvent = async (event) => {
    if (personalEventsSource !== "browser") {
      setPersonalFileStatus(
        "削除できるのは、このブラウザに保存した自分史だけです"
      );
      return;
    }

    const ok = window.confirm(
      `自分史「${event.title}」を削除しますか？`
    );

    if (!ok) return;

    try {
      const remaining = myEvents.filter(
        (item) => item.id !== event.id
      );

      // 削除後もTSVとして読み戻せることを確認してから保存する。
      const events = parsePersonalEventsTsv(
        serializePersonalEventsTsv(
          remaining
        )
      );

      await workspaceStore.personalEvents.save(events);

      setMyEvents(events);

      if (editingPersonalId === event.id) {
        setEditingPersonalId(null);
        resetPersonalDraft();
        setPersonalAddOpen(false);
      }

      onDeleted?.(event);

      setPersonalFileStatus(
        `自分史「${event.title}」を削除し、このブラウザに保存しました`
      );
    } catch (err) {
      console.error(
        "Personal history event could not be deleted:",
        err
      );
      setPersonalFileStatus(
        `削除失敗: ${err?.message || String(err)}`
      );
    }
  };

  const copyServerPersonalEventsToBrowser = async () => {
    if (personalEventsSource !== "server") return;

    const ok = window.confirm(
      `管理者データ ${myEvents.length}件を編集用としてこのブラウザに保存します。` +
        "このブラウザに保存済みの自分史がある場合は置き換えられます。続けますか？"
    );

    if (!ok) return;

    try {
      const events = parsePersonalEventsTsv(
        serializePersonalEventsTsv(myEvents)
      );

      await workspaceStore.personalEvents.save(events);

      setMyEvents(events);
      setPersonalEventsSource("browser");
      setEditingPersonalId(null);
      setPersonalAddOpen(false);
      setPersonalEditorOpen(true);
      setPersonalFileStatus(
        `管理者データ ${events.length}件を編集用としてこのブラウザに保存しました`
      );
    } catch (err) {
      console.error(
        "Administrator personal history could not be copied:",
        err
      );
      setPersonalFileStatus(
        `編集用への取り込み失敗: ${
          err?.message || String(err)
        }`
      );
    }
  };

  const applyServerPersonalEvents = (events) => {
    setMyEvents(events);
    setPersonalEventsSource("server");
    setEditingPersonalId(null);
    setPersonalAddOpen(false);
    setPersonalEditorOpen(false);
    setPersonalFileStatus(
      `管理者データ ${events.length}件を読み込みました`
    );
  };

  return {
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
    openPersonalEventEntry,
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
    applyServerPersonalEvents,
  };
}
