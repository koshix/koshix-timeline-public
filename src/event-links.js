import { eventYear } from "./event-schema.js";
import { LEGACY_EVENT_ID_ALIASES } from "./event-id-aliases.js";
export const legacyEventId = (event) => {
  const source = `${eventYear(event)}-${event.title}`;
  let hash = 5381;

  for (let i = 0; i < source.length; i += 1) {
    hash =
      ((hash * 33) ^ source.charCodeAt(i)) >>> 0;
  }

  return `${eventYear(event)}-${hash.toString(36)}`;
};

export const eventId = (event) =>
  event.id || legacyEventId(event);

const normalizeLegacyShareKey = (value) =>
  String(value ?? "")
    .normalize("NFKC")
    .replace(/\s+/g, "")
    .toLowerCase();

export const findEventByShareParam = (
  events,
  raw
) => {
  if (!raw) return null;

  let decoded = raw;

  try {
    decoded = decodeURIComponent(raw);
  } catch {}

  const key = normalizeLegacyShareKey(decoded);
  const aliasedId =
    LEGACY_EVENT_ID_ALIASES[decoded] ?? decoded;

  return (
    events.find(
      (event) => eventId(event) === aliasedId
    ) ||
    events.find(
      (event) => eventId(event) === decoded
    ) ||
    events.find(
      (event) =>
        normalizeLegacyShareKey(
          `${eventYear(event)}-${event.title}`
        ) === key
    ) ||
    events.find(
      (event) =>
        key.length > 6 &&
        normalizeLegacyShareKey(
          `${eventYear(event)}-${event.title}`
        ).startsWith(key)
    ) ||
    null
  );
};

export const weighShareText = (value) =>
  [...String(value ?? "")].reduce(
    (total, char) =>
      total +
      (/[\x00-\x7e]/.test(char) ? 1 : 2),
    0
  );

export const clipShareText = (
  value,
  budget
) => {
  const text = String(value ?? "");

  if (weighShareText(text) <= budget) {
    return text;
  }

  let output = "";
  let weight = 0;

  for (const char of [...text]) {
    const charWeight =
      /[\x00-\x7e]/.test(char) ? 1 : 2;

    if (weight + charWeight > budget - 2) {
      break;
    }

    output += char;
    weight += charWeight;
  }

  return output.replace(/[、。]$/, "") + "…";
};
