import {
  parseLifeSettingsTsv,
} from "./life-settings.js";

export async function loadLifeSettings() {
  const response = await fetch(
    `${import.meta.env.BASE_URL}personal/koshix-timeline-life-settings.tsv`,
    {
      cache: "no-store",
      credentials: "same-origin",
    }
  );

  if (!response.ok) {
    return null;
  }

  const text = await response.text();
  const settings =
    parseLifeSettingsTsv(text);

  console.info(
    "Runtime life settings TSV loaded"
  );

  return settings;
}
