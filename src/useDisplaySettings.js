import { useState } from "react";

export default function useDisplaySettings({
  saved = {},
  mainCategories = [],
} = {}) {
  // 大分類フィルタ。true が入っているカテゴリーだけを非表示にする
  const [catOff, setCatOff] = useState(
    saved.catOff ?? {}
  );
  // 「作品」のうちSFタグを持つ項目だけに絞る補助フィルタ
  const [sfOnly, setSfOnly] = useState(
    saved.sfOnly ?? false
  );
  // 分類ボタンを主分類だけで判定するか、副分類も含めて判定するか。
  const [categoryMatchMode, setCategoryMatchMode] =
    useState(
      saved.categoryMatchMode === "related"
        ? "related"
        : "primary"
    );

  // subsを使った主分類横断フィルタ。
  // 空配列なら絞り込みなし、複数選択時はOR。
  const [subFilters, setSubFilters] = useState(
    Array.isArray(saved.subFilters)
      ? saved.subFilters
      : []
  );

  const catOn = (key) =>
    catOff[key] !== true;

  const toggleCat = (key) =>
    setCatOff((previous) => ({
      ...previous,
      [key]: !previous[key],
    }));

  const toggleSfOnly = () => {
    setSfOnly((previous) => !previous);
    setCatOff((previous) => ({
      ...previous,
      work: false,
    }));
  };

  const toggleSubFilter = (key) => {
    setSubFilters((previous) =>
      previous.includes(key)
        ? previous.filter((item) => item !== key)
        : [...previous, key]
    );
  };

  const setAllCats = (on) => {
    setCatOff(
      on
        ? {}
        : Object.fromEntries(
            mainCategories.map((key) => [
              key,
              true,
            ])
          )
    );
    if (on) {
      setSfOnly(false);
      setSubFilters([]);
    }
  };

  // 公開イベントの表示量。3=重要、2=標準、1=全部
  const [importanceMin, setImportanceMin] = useState(
    saved.importanceMin ?? 2
  );
  const setImportanceLevel = (level) => {
    setImportanceMin(Number(level));
  };

  // 畳んでいる期間(帯)のキー。
  // 新仕様の初回は、期間キー確定後にApp側で全期間を閉じる。
  const [closedStages, setClosedStages] = useState(
    () =>
      new Set(
        Array.isArray(saved.closed)
          ? saved.closed
          : []
      )
  );
  const toggleStage = (key) =>
    setClosedStages((previous) => {
      const next = new Set(previous);
      next.has(key)
        ? next.delete(key)
        : next.add(key);
      return next;
    });

  const expandAllStages = () => {
    setClosedStages(new Set());
  };

  const collapseStages = (keys) => {
    setClosedStages(new Set(keys));
  };

  // 生年や進学・就職年の入力欄。必要なときだけ開く。
  const [setupOpen, setSetupOpen] = useState(
    saved.setupOpen ?? false
  );
  const openSetup = () => {
    setSetupOpen(true);
  };

  const toggleSetup = () => {
    setSetupOpen((previous) => !previous);
  };

  const closeSetup = () => {
    setSetupOpen(false);
  };

  // 自分史の編集欄も、必要なときだけ開く。
  const [personalHistoryOpen, setPersonalHistoryOpen] =
    useState(saved.personalHistoryOpen ?? false);

  const openPersonalHistory = () => {
    setPersonalHistoryOpen(true);
  };

  const closePersonalHistory = () => {
    setPersonalHistoryOpen(false);
  };

  const togglePersonalHistory = () => {
    setPersonalHistoryOpen((previous) => !previous);
  };

  return {
    catOff,
    sfOnly,
    subFilters,
    categoryMatchMode,
    setCategoryMatchMode,
    catOn,
    toggleCat,
    toggleSfOnly,
    toggleSubFilter,
    setAllCats,
    importanceMin,
    setImportanceLevel,
    closedStages,
    toggleStage,
    expandAllStages,
    collapseStages,
    setupOpen,
    openSetup,
    toggleSetup,
    closeSetup,
    personalHistoryOpen,
    openPersonalHistory,
    closePersonalHistory,
    togglePersonalHistory,
  };
}
