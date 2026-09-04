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
    includeCore = false,
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
    y: Number(String(row.date).slice(0, 4)),
    t: row.title,
    cats: splitEventList(row.cats),
    primary,
    ...(row.subs
      ? { subs: splitEventList(row.subs) }
      : {}),
    ...(row.region ? { region: row.region } : {}),
    importance: Number(row.importance),
    ...(includeCore
      ? { core: row.core === "1" }
      : {}),
    ic: row.icon || defaultIcon,
    n: row.summary,
    ...(row.sources
      ? { l: splitEventList(row.sources) }
      : {}),
    ...(row.search ? { q: row.search } : {}),
    ...(row.note ? { note: row.note } : {}),
  };
}

export function encodeEventRow(
  event,
  {
    forcePrimary = null,
    includeCore = false,
    defaultIcon = "",
  } = {}
) {
  return {
    id: String(event.id ?? ""),
    date: String(event.date ?? ""),
    end_date: String(event.end_date ?? ""),
    title: String(event.t ?? event.title ?? ""),
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
      event.ic ??
      event.icon ??
      defaultIcon
    ),
    summary: String(
      event.n ??
      event.summary ??
      ""
    ),
    sources: listCell(event.l ?? event.sources),
    search: String(event.q ?? event.search ?? ""),
    note: String(event.note ?? ""),
    ...(includeCore
      ? { core: event.core ? "1" : "0" }
      : {}),
  };
}
