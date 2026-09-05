export const PUBLIC_EVENT_TSV_HEADER = [
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
];

export const PERSONAL_EVENT_TSV_HEADER =
  PUBLIC_EVENT_TSV_HEADER.slice(0, -1);

export const PUBLIC_EVENT_CATEGORY_KEYS = [
  "sf",
  "work",
  "science",
  "education",
  "computer",
  "culture",
  "society",
];

export const PUBLIC_EVENT_CATEGORIES = new Set(
  PUBLIC_EVENT_CATEGORY_KEYS
);

// TSVとRuntime Eventは同じイベントフィールド名を使う。
// idを除く順序は公開TSV schemaを正本とする。
export const EVENT_FIELD_ORDER =
  PUBLIC_EVENT_TSV_HEADER.slice(1);

export function splitEventList(value) {
  if (!value) return [];

  return String(value)
    .split("|")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function eventYear(event) {
  return Number(
    String(event?.date ?? "").slice(0, 4)
  );
}

export function isValidEventDate(value) {
  if (!/^\d{4}(?:-\d{2}(?:-\d{2})?)?$/.test(value)) {
    return false;
  }

  const parts = value.split("-").map(Number);

  if (
    parts.length >= 2 &&
    (parts[1] < 1 || parts[1] > 12)
  ) {
    return false;
  }

  if (
    parts.length === 3 &&
    (parts[2] < 1 || parts[2] > 31)
  ) {
    return false;
  }

  return true;
}

function validateCommonEventRow(row) {
  if (!row.id) {
    throw new Error("id がありません");
  }

  if (!isValidEventDate(row.date)) {
    throw new Error(
      `date "${row.date}" の形式が不正です`
    );
  }

  if (
    row.end_date &&
    !isValidEventDate(row.end_date)
  ) {
    throw new Error(
      `end_date "${row.end_date}" の形式が不正です`
    );
  }

  if (!row.title) {
    throw new Error("title がありません");
  }

  if (!row.summary) {
    throw new Error("summary がありません");
  }

  const importance = Number(row.importance);

  if (![1, 2, 3].includes(importance)) {
    throw new Error(
      "importance は 1, 2, 3 のいずれかです"
    );
  }

  return {
    cats: splitEventList(row.cats),
    importance,
  };
}

export function validatePublicEventRow(row) {
  const { cats, importance } =
    validateCommonEventRow(row);

  if (cats.length === 0) {
    throw new Error("cats が空です");
  }

  for (const cat of cats) {
    if (!PUBLIC_EVENT_CATEGORIES.has(cat)) {
      throw new Error(
        `未知のカテゴリー "${cat}"`
      );
    }
  }

  if (!PUBLIC_EVENT_CATEGORIES.has(row.primary)) {
    throw new Error(
      `primary "${row.primary}" が不正です`
    );
  }

  if (!cats.includes(row.primary)) {
    throw new Error(
      `primary "${row.primary}" が cats に含まれていません`
    );
  }

  if (!["0", "1"].includes(row.core)) {
    throw new Error(
      "core は 0 または 1 にしてください"
    );
  }

  if (!row.icon) {
    throw new Error("icon がありません");
  }

  return {
    cats,
    importance,
  };
}

export function validatePersonalEventRow(row) {
  const { cats, importance } =
    validateCommonEventRow(row);

  if (!cats.includes("me")) {
    throw new Error("cats に me が必要です");
  }

  if (row.primary !== "me") {
    throw new Error("primary は me にしてください");
  }

  return {
    cats,
    importance,
  };
}
