import {
  useRef,
  useState,
} from "react";

import {
  mergeLifeSettings,
  parseLifeSettingsTsv,
  serializeLifeSettingsTsv,
} from "./life-settings";
import { settingsStore } from "./settings-store";

const normalizeAdultPeriods = (periods) =>
  Array.isArray(periods)
    ? periods.map((period) => ({
        start: String(period.start ?? period.from ?? ""),
        end:
          period.end != null
            ? String(period.end)
            : period.to != null
              ? String(period.to)
              : "",
        label: String(period.label ?? ""),
      }))
    : [];

export default function useLifeSettings({
  initialBirth,
  initialMonth,
  initialEducation = {},
  savedAdultPeriodsEnabled = false,
  savedAdultPeriods = [],
} = {}) {
  const [birth, setBirth] = useState(initialBirth);
  const [month, setMonth] = useState(initialMonth);
  const [
    earlyChildhoodHistory,
    setEarlyChildhoodHistory,
  ] = useState(
    initialEducation.earlyChildhoodHistory ?? []
  );
  const [
    higherEducationHistory,
    setHigherEducationHistory,
  ] = useState(
    initialEducation.higherEducationHistory ?? []
  );
  const [
    graduateEducationHistory,
    setGraduateEducationHistory,
  ] = useState(
    initialEducation.graduateEducationHistory ?? []
  );
  const [
    adultPeriodsEnabled,
    setAdultPeriodsEnabled,
  ] = useState(savedAdultPeriodsEnabled);
  const [adultPeriods, setAdultPeriods] = useState(
    () => normalizeAdultPeriods(savedAdultPeriods)
  );
  const [
    lifeSettingsStatus,
    setLifeSettingsStatus,
  ] = useState("");

  const lifeSettingsFileInputRef = useRef(null);

  const updateEarlyChildhoodHistory = (history) => {
    setEarlyChildhoodHistory(history);
  };

  const updateHigherEducationHistory = (history) => {
    setHigherEducationHistory(history);
  };

  const updateGraduateEducationHistory = (history) => {
    setGraduateEducationHistory(history);
  };

  const adjustBirthYear = (delta) => {
    setBirth((current) =>
      Math.max(
        1930,
        Math.min(2010, current + delta)
      )
    );
  };

  const setBirthYear = (value) => {
    setBirth(Number(value));
  };

  const setBirthMonth = (value) => {
    setMonth(Number(value));
  };

  const firstHigherEducation =
    higherEducationHistory[0] ?? null;
  const firstGraduateEducation =
    graduateEducationHistory[0] ?? null;

  const higherEdY =
    firstHigherEducation?.start ?? "";
  const higherEdType =
    firstHigherEducation?.type ?? "university";
  const graduateY =
    firstGraduateEducation?.start ?? "";
  const graduateType =
    firstGraduateEducation?.type ?? "masters";

  const updateAdultPeriod = (index, key, value) => {
    setAdultPeriods((previous) =>
      previous.map((period, i) =>
        i === index
          ? { ...period, [key]: value }
          : period
      )
    );
    setLifeSettingsStatus("");
  };

  const addAdultPeriod = (adultYear) => {
    setAdultPeriods((previous) => {
      const last = previous.at(-1);
      const lastEnd = last?.end ?? "";

      const start =
        previous.length === 0
          ? String(adultYear)
          : lastEnd !== "" &&
              Number.isFinite(Number(lastEnd))
            ? String(Number(lastEnd) + 1)
            : "";

      return [
        ...previous,
        {
          start,
          end: "",
          label: "",
        },
      ];
    });

    setLifeSettingsStatus("");
  };

  const removeAdultPeriod = (index) => {
    setAdultPeriods((previous) =>
      previous.filter((_, i) => i !== index)
    );
    setLifeSettingsStatus("");
  };

  const setAdultPeriodSplittingEnabled = (enabled) => {
    setAdultPeriodsEnabled(Boolean(enabled));
    setLifeSettingsStatus("");
  };

  const resetAdultPeriods = () => {
    setAdultPeriodsEnabled(false);
    setAdultPeriods([]);
    setLifeSettingsStatus("");
  };

  const exportLifeSettingsFile = () => {
    try {
      const text = serializeLifeSettingsTsv(
        settingsStore.load() || {}
      );

      const blob = new Blob(
        ["\uFEFF", text],
        {
          type: "text/tab-separated-values;charset=utf-8",
        }
      );

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download =
        "koshix-timeline-life-settings.tsv";

      document.body.appendChild(link);
      link.click();
      link.remove();

      setTimeout(
        () => URL.revokeObjectURL(url),
        0
      );

      setLifeSettingsStatus(
        "人生設定全体をTSVへ書き出しました。"
      );
    } catch (err) {
      console.error(
        "Life settings could not be exported:",
        err
      );

      setLifeSettingsStatus(
        `TSV書き出し失敗: ${err?.message || String(err)}`
      );
    }
  };

  const importLifeSettingsFile = async (event) => {
    const file = event.target.files?.[0];

    event.target.value = "";

    if (!file) return;

    try {
      const imported =
        parseLifeSettingsTsv(
          await file.text()
        );

      const ok = window.confirm(
        `「${file.name}」から人生設定を読み込み、` +
        "現在の生年・幼保歴・大学等・大学院・成人期分割を置き換えますか？"
      );

      if (!ok) return;

      const current =
        settingsStore.load() || {};

      const next =
        mergeLifeSettings(
          current,
          imported
        );

      settingsStore.replace(next);

      window.location.reload();
    } catch (err) {
      console.error(
        "Life settings could not be imported:",
        err
      );

      setLifeSettingsStatus(
        `TSV読み込み失敗: ${err?.message || String(err)}`
      );
    }
  };

  return {
    birth,
    month,
    adjustBirthYear,
    setBirthYear,
    setBirthMonth,
    earlyChildhoodHistory,
    updateEarlyChildhoodHistory,
    higherEducationHistory,
    updateHigherEducationHistory,
    graduateEducationHistory,
    updateGraduateEducationHistory,
    higherEdY,
    higherEdType,
    graduateY,
    graduateType,
    adultPeriodsEnabled,
    adultPeriods,
    lifeSettingsStatus,
    lifeSettingsFileInputRef,
    importLifeSettingsFile,
    exportLifeSettingsFile,
    setAdultPeriodSplittingEnabled,
    resetAdultPeriods,
    updateAdultPeriod,
    addAdultPeriod,
    removeAdultPeriod,
  };
}
