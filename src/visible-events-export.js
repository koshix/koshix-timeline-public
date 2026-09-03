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
    "icon",
    "summary",
    "sources",
    "search",
    "note",
    "core",
    "age",
    "grade",
  ];

  const rows = events.map((event) => [
    event.id ?? "",
    event.date ?? "",
    event.end_date ?? "",
    event.t ?? "",
    listCell(catsOf(event)),
    event.primary ?? event.cat ?? "",
    listCell(event.subs),
    event.region ?? "",
    event.importance ?? 2,
    event.ic ?? "",
    event.n ?? "",
    listCell(event.l),
    event.q ?? "",
    event.note ?? "",
    event.core ? "1" : "0",
    event.age,
    gradeLabel(event.y),
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
    "icon",
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
    event.t ?? "",
    listCell(event.cats ?? ["me"]),
    event.primary ?? "me",
    listCell(event.subs),
    event.region ?? "",
    event.importance ?? 2,
    event.ic ?? "flag",
    event.n ?? "",
    listCell(event.l),
    event.q ?? "",
    event.note ?? "",
    event.age,
    gradeLabel(event.y),
  ]);

  return { header, rows };
}
