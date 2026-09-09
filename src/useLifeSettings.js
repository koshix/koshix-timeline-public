import {
  useRef,
  useState,
} from "react";

import {
  mergeLifeSettings,
  parseLifeSettingsTsv,
  serializeLifeSettingsTsv,
} from "./life-settings";
import {
  educationForKind,
  normalizeEducation,
} from "./education-history";
import { downloadBlob } from "./browser-download.js";
import { workspaceStore } from "./workspace-store.js";

const normalizeAdultPeriods = (periods) =>
  Array.isArray(periods)
    ? periods.map((period) => ({
        start: String(period.start ?? ""),
        end:
          period.end != null
            ? String(period.end)
            : "",
        label: String(period.label ?? ""),
      }))
    : [];

export default function useLifeSettings({
  initialBirth,
  initialMonth,
  initialEducation = [],
  savedAdultPeriods = [],
} = {}) {
  const [birth, setBirth] = useState(initialBirth);
  const [month, setMonth] = useState(initialMonth);
  const [education, setEducation] = useState(
    () => normalizeEducation(initialEducation)
  );
  const [adultPeriods, setAdultPeriods] = useState(
    () => normalizeAdultPeriods(savedAdultPeriods)
  );
  const [
    lifeSettingsStatus,
    setLifeSettingsStatus,
  ] = useState("");

  const [
    lifeSettingsSource,
    setLifeSettingsSource,
  ] = useState("browser");

  const [
    educationEditorRevision,
    setEducationEditorRevision,
  ] = useState(0);

  const lifeSettingsFileInputRef = useRef(null);

  const updateEducation = (history) => {
    setEducation(
      normalizeEducation(history)
    );
  };

  const setBirthYear = (value) => {
    const year = Number(value);

    if (
      Number.isInteger(year) &&
      year >= 1501 &&
      year <= 2100
    ) {
      setBirth(year);
    }
  };

  const setBirthMonth = (value) => {
    const nextMonth = Number(value);

    if (
      Number.isInteger(nextMonth) &&
      nextMonth >= 0 &&
      nextMonth <= 12
    ) {
      setMonth(nextMonth);
    }
  };

  const resetBirthSettings = () => {
    setBirth(null);
    setMonth(0);
    setLifeSettingsStatus("");
  };

  const firstHigherEducation =
    educationForKind(
      education,
      "higher"
    )[0] ?? null;
  const firstGraduateEducation =
    educationForKind(
      education,
      "graduate"
    )[0] ?? null;

  const firstHigherYear =
    firstHigherEducation?.start ?? "";
  const firstHigherType =
    firstHigherEducation?.type ?? "university";
  const firstGraduateYear =
    firstGraduateEducation?.start ?? "";
  const firstGraduateType =
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
    if (
      adultYear == null ||
      !Number.isInteger(Number(adultYear))
    ) {
      return;
    }

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

  const resetAdultPeriods = () => {
    setAdultPeriods([]);
    setLifeSettingsStatus("");
  };

  const exportLifeSettingsFile = () => {
    try {
      const text = serializeLifeSettingsTsv({
        birth,
        month,
        education,
        adultPeriods,
      });

      const blob = new Blob(
        ["\uFEFF", text],
        {
          type: "text/tab-separated-values;charset=utf-8",
        }
      );

      downloadBlob(
        blob,
        "koshix-timeline-life-settings.tsv"
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
        workspaceStore.settings.load() || {};

      const next =
        mergeLifeSettings(
          current,
          imported
        );

      workspaceStore.settings.replace(next);

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

  const applyServerLifeSettings = (settings) => {
    setLifeSettingsSource("server");
    setBirth(settings.birth);
    setMonth(settings.month);
    setEducation(
      normalizeEducation(
        settings.education
      )
    );
    setEducationEditorRevision(
      (current) => current + 1
    );
    setAdultPeriods(
      normalizeAdultPeriods(
        settings.adultPeriods
      )
    );
    setLifeSettingsStatus(
      "管理者人生設定を読み込みました"
    );
  };

  return {
    birth,
    month,
    setBirthYear,
    setBirthMonth,
    resetBirthSettings,
    education,
    updateEducation,
    firstHigherYear,
    firstHigherType,
    firstGraduateYear,
    firstGraduateType,
    adultPeriods,
    lifeSettingsStatus,
    lifeSettingsSource,
    educationEditorRevision,
    lifeSettingsFileInputRef,
    importLifeSettingsFile,
    exportLifeSettingsFile,
    applyServerLifeSettings,
    resetAdultPeriods,
    updateAdultPeriod,
    addAdultPeriod,
    removeAdultPeriod,
  };
}
