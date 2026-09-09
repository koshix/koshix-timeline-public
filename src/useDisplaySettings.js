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
  // 保存済みの開閉状態がなければ全期間を開いた状態で始める。
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

  // 生年や進学・就職年の入力欄。一度入れたら畳んでおける(初回訪問時だけ開いた状態)
  const [setupOpen, setSetupOpen] = useState(
    saved.setupOpen ?? !saved.birth
  );
  const openSetup = () => {
    setSetupOpen(true);
  };

  const toggleSetup = () => {
    setSetupOpen((previous) => !previous);
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
  };
}
