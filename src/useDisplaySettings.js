import { useState } from "react";

export default function useDisplaySettings({
  saved = {},
  initialClosedStages = [],
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
  // 新規起動時は出生前を閉じ、出生年以降を開く「半」を既定値にする。
  // 保存済みの開閉状態がある場合は、それを優先する。
  const [closedStages, setClosedStages] = useState(
    () =>
      new Set(
        Array.isArray(saved.closed)
          ? saved.closed
          : initialClosedStages
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

  // 再生速度はテーマをまたいでも覚えておく
  const [speed, setSpeed] = useState(
    saved.speed ?? 1
  );

  const cyclePlaybackSpeed = () => {
    setSpeed((current) =>
      current === 1
        ? 1.5
        : current === 1.5
          ? 2
          : 1
    );
  };

  return {
    catOff,
    sfOnly,
    catOn,
    toggleCat,
    toggleSfOnly,
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
    speed,
    cyclePlaybackSpeed,
  };
}
