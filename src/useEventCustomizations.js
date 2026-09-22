import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  applyEventCustomizations,
  EMPTY_EVENT_CUSTOMIZATIONS,
} from "./event-customizations.js";
import {
  parseEventCustomizationsTsv,
  serializeEventCustomizationsTsv,
} from "./event-customizations-tsv.js";
import {
  workspaceStore,
} from "./workspace-store.js";
import { downloadBlob } from "./browser-download.js";
import { isValidEventDate } from "./event-schema.js";
import {
  addEventCustomization,
  customizationCounts,
  hideEventCustomization,
  removeAddedEventCustomization,
  restoreHiddenEventCustomization,
  updateEventOverride,
} from "./event-customization-operations.js";

export default function useEventCustomizations({
  events = [],
  mainCategories = [],
  onReplaced,
  onEventRemoved,
} = {}) {
  const [
    eventCustomizations,
    setEventCustomizations,
  ] = useState(EMPTY_EVENT_CUSTOMIZATIONS);
  const [
    eventCustomizationStatus,
    setEventCustomizationStatus,
  ] = useState("");
  const [
    eventCustomizationEditorOpen,
    setEventCustomizationEditorOpen,
  ] = useState(false);
  const [
    editingEventId,
    setEditingEventId,
  ] = useState(null);
  const [
    eventEditDraft,
    setEventEditDraft,
  ] = useState({
    title: "",
    summary: "",
    importance: 2,
  });
  const [
    eventAddOpen,
    setEventAddOpen,
  ] = useState(false);
  const [
    eventAddDraft,
    setEventAddDraft,
  ] = useState({
    date: "",
    title: "",
    category: "society",
    importance: 2,
    summary: "",
  });

  const eventCustomizationFileInputRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    workspaceStore.eventCustomizations.load()
      .then((customizations) => {
        applyEventCustomizations(
          events,
          customizations
        );

        if (!cancelled) {
          setEventCustomizations(customizations);
        }
      })
      .catch((err) => {
        console.error(
          "Browser event customizations could not be loaded:",
          err
        );
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const persistEventCustomizations = async (next) => {
    await workspaceStore.eventCustomizations.save(next);
    setEventCustomizations(next);
  };

  const resetEventEditDraft = () => {
    setEditingEventId(null);
    setEventEditDraft({
      title: "",
      summary: "",
      importance: 2,
    });
  };

  const saveEditedEvent = async (event) => {
    const base = events.find((item) => item.id === event.id);

    if (!base) {
      setEventCustomizationStatus(
        "正本に対応する項目が見つかりません"
      );
      return;
    }

    const title = eventEditDraft.title.trim();
    const summary = eventEditDraft.summary.trim();
    const importance = Number(eventEditDraft.importance);

    if (!title || !summary) {
      setEventCustomizationStatus(
        "タイトルと概要は空にできません"
      );
      return;
    }

    if (![1, 2, 3].includes(importance)) {
      setEventCustomizationStatus(
        "重要度は1、2、3のいずれかにしてください"
      );
      return;
    }

    const changes = {};

    if (title !== base.title) changes.title = title;
    if (summary !== base.summary) changes.summary = summary;
    if (importance !== base.importance) {
      changes.importance = importance;
    }

    const {
      next,
      merged,
    } = updateEventOverride(
      eventCustomizations,
      event.id,
      changes
    );

    try {
      await persistEventCustomizations(next);

      resetEventEditDraft();

      setEventCustomizationStatus(
        Object.keys(merged).length === 0
          ? `「${base.title}」を正本の内容に戻しました`
          : `「${title}」の修正をこのブラウザに保存しました`
      );
    } catch (err) {
      console.error(
        "Event customization could not be saved:",
        err
      );
      setEventCustomizationStatus(
        `保存失敗: ${err?.message || String(err)}`
      );
    }
  };

  const importEventCustomizationsFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";

    if (!file) return;

    try {
      const text = await file.text();
      const parsed = parseEventCustomizationsTsv(text);

      const preview = applyEventCustomizations(
        events,
        parsed
      );

      const {
        overrideCount,
        hiddenCount,
        additionCount,
      } = customizationCounts(parsed);

      const ok = window.confirm(
        `「${file.name}」を読み込み、` +
        `現在の年表カスタマイズを置き換えますか？\n\n` +
        `修正 ${overrideCount}件 / ` +
        `非表示 ${hiddenCount}件 / ` +
        `追加 ${additionCount}件`
      );

      if (!ok) return;

      await persistEventCustomizations(parsed);

      resetEventEditDraft();
      setEventAddOpen(false);
      resetEventAddDraft();
      onReplaced?.();

      const orphanCount = preview.orphaned.length;

      setEventCustomizationStatus(
        `${file.name} から年表カスタマイズを読み込み、` +
        `このブラウザに保存しました` +
        `（修正 ${overrideCount}件 / ` +
        `非表示 ${hiddenCount}件 / ` +
        `追加 ${additionCount}件` +
        (
          orphanCount > 0
            ? ` / 正本にないID ${orphanCount}件`
            : ""
        ) +
        `）`
      );
    } catch (err) {
      console.error(
        "Event customizations could not be imported:",
        err
      );
      setEventCustomizationStatus(
        `TSV読み込み失敗: ${err?.message || String(err)}`
      );
    }
  };

  const exportEventCustomizationsFile = () => {
    try {
      const text = serializeEventCustomizationsTsv(
        eventCustomizations
      );

      const blob = new Blob(
        [text],
        {
          type: "text/tab-separated-values;charset=utf-8",
        }
      );

      downloadBlob(
        blob,
        "koshix-timeline-customizations.tsv"
      );

      const {
        overrideCount,
        hiddenCount,
        additionCount,
      } = customizationCounts(
        eventCustomizations
      );

      setEventCustomizationStatus(
        `年表カスタマイズをTSVへ書き出しました` +
        `（修正 ${overrideCount}件 / ` +
        `非表示 ${hiddenCount}件 / ` +
        `追加 ${additionCount}件）`
      );
    } catch (err) {
      console.error(
        "Event customizations could not be exported:",
        err
      );
      setEventCustomizationStatus(
        `TSV書き出し失敗: ${err?.message || String(err)}`
      );
    }
  };

  const saveAddedEvent = async () => {
    const date = eventAddDraft.date.trim();
    const title = eventAddDraft.title.trim();
    const summary = eventAddDraft.summary.trim();
    const category = eventAddDraft.category;
    const importance = Number(eventAddDraft.importance);

    if (!isValidEventDate(date)) {
      setEventCustomizationStatus(
        "日付は実在する YYYY、YYYY-MM、YYYY-MM-DD の形式で入力してください"
      );
      return;
    }


    if (!title || !summary) {
      setEventCustomizationStatus(
        "タイトルと概要は空にできません"
      );
      return;
    }

    if (!mainCategories.includes(category)) {
      setEventCustomizationStatus("分野の指定が不正です");
      return;
    }

    if (![1, 2, 3].includes(importance)) {
      setEventCustomizationStatus(
        "重要度は1、2、3のいずれかにしてください"
      );
      return;
    }

    const usedIds = new Set([
      ...events.map((event) => event.id),
      ...(eventCustomizations.additions ?? [])
        .map((event) => event.id),
    ]);

    let id;
    do {
      id =
        `custom-${Date.now().toString(36)}-` +
        Math.random().toString(36).slice(2, 8);
    } while (usedIds.has(id));

    const addition = {
      id,
      date,
      title: title,
      cats: [category],
      primary: category,
      importance,
      summary: summary,
    };

    const next = addEventCustomization(
      eventCustomizations,
      addition
    );

    try {
      await persistEventCustomizations(next);
      setEventAddOpen(false);
      resetEventAddDraft();
      setEventCustomizationStatus(
        `「${title}」をこのブラウザの年表に追加しました`
      );
    } catch (err) {
      console.error(
        "Custom event could not be added:",
        err
      );
      setEventCustomizationStatus(
        `追加失敗: ${err?.message || String(err)}`
      );
    }
  };

  const deleteAddedEvent = async (event) => {
    const addition = (eventCustomizations.additions ?? []).find(
      (item) => item.id === event.id
    );

    if (!addition) {
      setEventCustomizationStatus(
        "追加項目として保存されているデータが見つかりません"
      );
      return;
    }

    const ok = window.confirm(
      `追加項目「${addition.title}」をこのブラウザから削除しますか？`
    );

    if (!ok) return;

    const next =
      removeAddedEventCustomization(
        eventCustomizations,
        event.id
      );

    try {
      await persistEventCustomizations(next);

      onEventRemoved?.(event);

      setEventCustomizationStatus(
        `「${addition.title}」を削除しました`
      );
    } catch (err) {
      console.error(
        "Custom event could not be deleted:",
        err
      );
      setEventCustomizationStatus(
        `削除失敗: ${err?.message || String(err)}`
      );
    }
  };

  const hideEvent = async (event) => {
    const ok = window.confirm(
      `年表項目「${event.title}」をこのブラウザで非表示にしますか？`
    );

    if (!ok) return;

    const next =
      hideEventCustomization(
        eventCustomizations,
        event.id
      );

    try {
      await persistEventCustomizations(next);

      if (editingEventId === event.id) {
        resetEventEditDraft();
      }

      onEventRemoved?.(event);

      setEventCustomizationStatus(
        `「${event.title}」を非表示にしました`
      );
    } catch (err) {
      console.error(
        "Event could not be hidden:",
        err
      );
      setEventCustomizationStatus(
        `非表示失敗: ${err?.message || String(err)}`
      );
    }
  };

  const restoreHiddenEvent = async (id) => {
    const base = events.find((event) => event.id === id);

    const next =
      restoreHiddenEventCustomization(
        eventCustomizations,
        id
      );

    try {
      await persistEventCustomizations(next);
      setEventCustomizationStatus(
        base
          ? `「${base.title}」を表示に戻しました`
          : `項目 ${id} の非表示指定を解除しました`
      );
    } catch (err) {
      console.error(
        "Hidden event could not be restored:",
        err
      );
      setEventCustomizationStatus(
        `復帰失敗: ${err?.message || String(err)}`
      );
    }
  };

  const clearEventCustomizations = async () => {
    const {
      total,
    } = customizationCounts(
      eventCustomizations
    );

    if (total === 0) {
      setEventCustomizationStatus(
        "保存されている年表カスタマイズはありません"
      );
      return;
    }

    const ok = window.confirm(
      `年表カスタマイズ ${total}件をこのブラウザから消去しますか？`
    );

    if (!ok) return;

    try {
      await workspaceStore.eventCustomizations.clear();
      setEventCustomizations({
        overrides: {},
        hidden: [],
        additions: [],
      });
      resetEventEditDraft();
      setEventCustomizationStatus(
        "年表カスタマイズを消去し、正本の年表に戻しました"
      );
    } catch (err) {
      console.error(
        "Browser event customizations could not be cleared:",
        err
      );
      setEventCustomizationStatus(
        `消去失敗: ${err?.message || String(err)}`
      );
    }
  };

  const startEditingEvent = (event) => {
    setEditingEventId(event.id);
    setEventEditDraft({
      title: event.title ?? "",
      summary: event.summary ?? "",
      importance: event.importance ?? 2,
    });
    setEventCustomizationStatus(
      `「${event.title}」を修正中です`
    );
  };

  const cancelEditingEvent = () => {
    resetEventEditDraft();
    setEventCustomizationStatus("");
  };

  const resetEventAddDraft = () => {
    setEventAddDraft({
      date: "",
      title: "",
      category: "society",
      importance: 2,
      summary: "",
    });
  };

  const openNewEventForm = () => {
    resetEventAddDraft();
    setEventCustomizationEditorOpen(true);
    setEventAddOpen(true);
    setEventCustomizationStatus("");
  };

  const cancelAddingEvent = () => {
    setEventAddOpen(false);
    resetEventAddDraft();
    setEventCustomizationStatus("");
  };

  const toggleEventCustomizationEditor = () => {
    setEventCustomizationEditorOpen((value) => !value);
    setEventAddOpen(false);
    resetEventAddDraft();
  };

  const closeEventCustomizationEditor = () => {
    setEventCustomizationEditorOpen(false);
    setEventAddOpen(false);
    resetEventAddDraft();
  };

  const updateEventEditDraft = (field, value) => {
    setEventEditDraft((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const updateEventAddDraft = (field, value) => {
    setEventAddDraft((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  return {
    eventCustomizations,
    eventCustomizationStatus,
    eventCustomizationEditorOpen,
    editingEventId,
    eventEditDraft,
    eventAddOpen,
    eventAddDraft,
    eventCustomizationFileInputRef,
    startEditingEvent,
    cancelEditingEvent,
    openNewEventForm,
    cancelAddingEvent,
    toggleEventCustomizationEditor,
    closeEventCustomizationEditor,
    updateEventEditDraft,
    updateEventAddDraft,
    saveEditedEvent,
    importEventCustomizationsFile,
    exportEventCustomizationsFile,
    saveAddedEvent,
    deleteAddedEvent,
    hideEvent,
    restoreHiddenEvent,
    clearEventCustomizations,
  };
}
