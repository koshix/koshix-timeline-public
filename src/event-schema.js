export const EVENT_TSV_HEADER = [
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
];

export const PUBLIC_EVENT_TSV_HEADER =
  EVENT_TSV_HEADER;
export const PERSONAL_EVENT_TSV_HEADER =
  EVENT_TSV_HEADER;

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

export const PUBLIC_EVENT_SUB_TAG_ROWS = [
  [
    ["thought", "思想"],
    ["rights", "人権"],
    ["war", "戦争"],
    ["revolution", "革命"],
    ["literature", "文学"],
    ["music", "音楽"],
    ["art", "美術"],
    ["visual", "映像"],
  ],
  [
    ["politics", "政治"],
    ["economy", "経済"],
    ["technology", "技術"],
    ["math", "数理"],
    ["matter", "物質"],
    ["life", "生命"],
    ["environment", "環境"],
    ["space", "宇宙"],
  ],
];

export const PUBLIC_EVENT_SUB_TAG_KEYS =
  PUBLIC_EVENT_SUB_TAG_ROWS
    .flat()
    .map(([key]) => key);

export const PUBLIC_EVENT_SUB_TAGS = new Set(
  PUBLIC_EVENT_SUB_TAG_KEYS
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
  const match =
    /^(\d{4})(?:-(\d{2})(?:-(\d{2}))?)?$/.exec(value);

  if (!match) {
    return false;
  }

  const year = Number(match[1]);
  const month = match[2]
    ? Number(match[2])
    : null;
  const day = match[3]
    ? Number(match[3])
    : null;

  // 年精度 YYYY は有効。
  if (month === null) {
    return true;
  }

  if (month < 1 || month > 12) {
    return false;
  }

  // 月精度 YYYY-MM は有効。
  if (day === null) {
    return true;
  }

  const leapYear =
    year % 4 === 0 &&
    (year % 100 !== 0 || year % 400 === 0);

  const daysInMonth = [
    31,
    leapYear ? 29 : 28,
    31,
    30,
    31,
    30,
    31,
    31,
    30,
    31,
    30,
    31,
  ];

  return (
    day >= 1 &&
    day <= daysInMonth[month - 1]
  );
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
  const subs = splitEventList(row.subs);

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

  if (
    row.primary === "sf" ||
    !PUBLIC_EVENT_CATEGORIES.has(row.primary)
  ) {
    throw new Error(
      `primary "${row.primary}" が不正です`
    );
  }

  if (!cats.includes(row.primary)) {
    throw new Error(
      `primary "${row.primary}" が cats に含まれていません`
    );
  }

  for (const sub of subs) {
    if (!PUBLIC_EVENT_SUB_TAGS.has(sub)) {
      throw new Error(
        `未知のsubsタグ "${sub}"`
      );
    }
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
