import {
  splitEventList,
} from "./event-schema.js";

function listCell(value) {
  if (Array.isArray(value)) {
    return value
      .map((item) => String(item ?? "").trim())
      .filter(Boolean)
      .join("|");
  }

  return String(value ?? "");
}

export function decodeEventRow(
  row,
  {
    forcePrimary = null,
    defaultIcon = "",
  } = {}
) {
  const primary = forcePrimary ?? row.primary;

  return {
    id: row.id,
    date: row.date,
    ...(row.end_date
      ? { end_date: row.end_date }
      : {}),
    title: row.title,
    cats: splitEventList(row.cats),
    primary,
    ...(row.subs
      ? { subs: splitEventList(row.subs) }
      : {}),
    ...(row.region ? { region: row.region } : {}),
    importance: Number(row.importance),
    icon: row.icon || defaultIcon,
    summary: row.summary,
    ...(row.sources
      ? { sources: splitEventList(row.sources) }
      : {}),
    ...(row.search ? { search: row.search } : {}),
    ...(row.note ? { note: row.note } : {}),
  };
}

export function encodeEventRow(
  event,
  {
    forcePrimary = null,
    defaultIcon = "",
  } = {}
) {
  return {
    id: String(event.id ?? ""),
    date: String(event.date ?? ""),
    end_date: String(event.end_date ?? ""),
    title: String(event.title ?? ""),
    cats: listCell(event.cats),
    primary: String(
      forcePrimary ??
      event.primary ??
      ""
    ),
    subs: listCell(event.subs),
    region: String(event.region ?? ""),
    importance: String(event.importance ?? 2),
    icon: String(
      event.icon ??
      defaultIcon
    ),
    summary: String(
      event.summary ??
      ""
    ),
    sources: listCell(event.sources),
    search: String(event.search ?? ""),
    note: String(event.note ?? ""),
  };
}
