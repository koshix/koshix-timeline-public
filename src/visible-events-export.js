import { eventYear } from "./event-schema.js";
import { catsOf } from "./categories";

function cleanCell(value) {
  return String(value ?? "")
    .replace(/\t/g, " ")
    .replace(/\r?\n/g, " ")
    .trim();
}

function listCell(value) {
  return Array.isArray(value)
    ? value.map(cleanCell).filter(Boolean).join("|")
    : cleanCell(value);
}

export function buildVisiblePublicExport(events, gradeLabel) {
  const header = [
    "id",
    "date",
    "end_date",
    "title",
    "cats",
    "primary",
    "subs",
    "region",
    "importance",
    "summary",
    "sources",
    "search",
    "note",
    "age",
    "grade",
  ];

  const rows = events.map((event) => [
    event.id ?? "",
    event.date ?? "",
    event.end_date ?? "",
    event.title ?? "",
    listCell(catsOf(event)),
    event.primary ?? "",
    listCell(event.subs),
    event.region ?? "",
    event.importance ?? 2,
    event.summary ?? "",
    listCell(event.sources),
    event.search ?? "",
    event.note ?? "",
    event.age,
    gradeLabel(eventYear(event)),
  ]);

  return { header, rows };
}

export function buildVisiblePersonalExport(events, gradeLabel) {
  const header = [
    "id",
    "date",
    "end_date",
    "title",
    "cats",
    "primary",
    "subs",
    "region",
    "importance",
    "summary",
    "sources",
    "search",
    "note",
    "age",
    "grade",
  ];

  const rows = events.map((event) => [
    event.id ?? "",
    event.date ?? "",
    event.end_date ?? "",
    event.title ?? "",
    listCell(event.cats ?? ["me"]),
    event.primary ?? "me",
    listCell(event.subs),
    event.region ?? "",
    event.importance ?? 2,
    event.summary ?? "",
    listCell(event.sources),
    event.search ?? "",
    event.note ?? "",
    event.age,
    gradeLabel(eventYear(event)),
  ]);

  return { header, rows };
}
