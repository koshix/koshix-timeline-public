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

export const PUBLIC_EVENT_PRIMARY_CATEGORY_KEYS = [
  "society",
  "science",
  "education",
  "computer",
  "culture",
  "work",
];

export const PUBLIC_EVENT_CATEGORY_KEYS = [
  "sf",
  ...PUBLIC_EVENT_PRIMARY_CATEGORY_KEYS,
];

export const PUBLIC_EVENT_CATEGORIES = new Set(
  PUBLIC_EVENT_CATEGORY_KEYS
);

export const PUBLIC_EVENT_PRIMARY_CATEGORIES = new Set(
  PUBLIC_EVENT_PRIMARY_CATEGORY_KEYS
);

export const PUBLIC_EVENT_SUB_TAG_KEYS = [
  "thought",
  "rights",
  "law",
  "war",
  "revolution",
  "literature",
  "music",
  "art",
  "visual",
  "communication",
  "politics",
  "economy",
  "industry",
  "technology",
  "math",
  "matter",
  "life",
  "environment",
  "space",
];

export const PUBLIC_EVENT_SUB_TAGS = new Set(
  PUBLIC_EVENT_SUB_TAG_KEYS
);

// 画面上の横断フィルタ。
// unrest（動乱）は実データタグではなく、war / revolution のOR条件。
export const PUBLIC_EVENT_SUB_FILTER_ROWS = [
  [
    ["thought", "思想"],
    ["rights", "人権"],
    ["law", "法制"],
    ["unrest", "動乱"],
    ["politics", "政治"],
    ["economy", "経済"],
  ],
  [
    ["literature", "文学"],
    ["music", "音楽"],
    ["art", "美術"],
    ["visual", "映像"],
    ["communication", "通信"],
    ["industry", "産業"],
  ],
  [
    ["technology", "技術"],
    ["math", "数理"],
    ["matter", "物質"],
    ["life", "生命"],
    ["environment", "環境"],
    ["space", "宇宙"],
  ],
];

export const PUBLIC_EVENT_SUB_FILTER_TAGS = {
  unrest: ["war", "revolution"],
};

export const PUBLIC_EVENT_SUB_FILTER_ICONS = {
  thought: ["thought"],
  rights: ["rights-expand", "rights-suppress"],
  law: ["law"],
  unrest: ["war", "revolution"],
  politics: ["politics-japan", "politics-world"],
  economy: ["economy"],

  literature: [
    "literature-japan",
    "literature-world",
  ],
  music: ["music"],
  art: ["art"],
  visual: ["visual-work", "visual-media"],
  communication: ["communication"],
  industry: ["industry"],

  technology: [
    "technology-innovation",
    "technology-implementation",
  ],
  math: ["math"],
  matter: ["matter-physics", "matter-material"],
  life: ["life-science", "life-health"],
  environment: ["environment"],
  space: ["space"],
};

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

function eventDateBoundaryNumber(
  value,
  endBoundary = false
) {
  const match =
    /^(\d{4})(?:-(\d{2})(?:-(\d{2}))?)?$/.exec(
      String(value ?? "")
    );

  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = match[2]
    ? Number(match[2])
    : endBoundary
      ? 12
      : 1;

  let day;

  if (match[3]) {
    day = Number(match[3]);
  } else if (!endBoundary) {
    day = 1;
  } else {
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

    day = daysInMonth[month - 1];
  }

  return (
    year * 10000 +
    month * 100 +
    day
  );
}

function isEndDateDefinitelyBeforeStart(
  date,
  endDate
) {
  const start =
    eventDateBoundaryNumber(date, false);
  const end =
    eventDateBoundaryNumber(endDate, true);

  if (start === null || end === null) {
    return false;
  }

  return end < start;
}

export function parseEventSourceItem(value) {
  const item =
    String(value ?? "").trim();

  const separator =
    item.lastIndexOf("::");

  if (
    separator <= 0 ||
    separator >= item.length - 2
  ) {
    throw new Error(
      "sources は 対象::表示名 の形式で指定してください"
    );
  }

  const target =
    item.slice(0, separator).trim();
  const label =
    item.slice(separator + 2).trim();

  if (!target || !label) {
    throw new Error(
      "sources は 対象::表示名 の形式で指定してください"
    );
  }

  const external =
    target.startsWith("https://") ||
    target.startsWith("http://");

  const englishWikipedia =
    target.startsWith("en:");

  if (
    /[\[\]]/.test(target) ||
    (
      !external &&
      !englishWikipedia &&
      target.includes("://")
    ) ||
    (
      englishWikipedia &&
      !target.slice(3).trim()
    )
  ) {
    throw new Error(
      `sources の対象形式が不正です: ${target}`
    );
  }

  return {
    target,
    label,
  };
}

export function validateEventSources(value) {
  const items = Array.isArray(value)
    ? value
        .map((item) =>
          String(item ?? "").trim()
        )
        .filter(Boolean)
    : splitEventList(value);

  for (const item of items) {
    if (
      /\[[^\]]+\]\([^)]+\)/.test(item)
    ) {
      throw new Error(
        "sources にMarkdownリンク記法は使えません。URL::表示名で指定してください"
      );
    }

    parseEventSourceItem(item);
  }
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

  if (
    row.end_date &&
    isEndDateDefinitelyBeforeStart(
      row.date,
      row.end_date
    )
  ) {
    throw new Error(
      `end_date "${row.end_date}" が date "${row.date}" より前です`
    );
  }

  if (!row.title) {
    throw new Error("title がありません");
  }

  if (!row.summary) {
    throw new Error("summary がありません");
  }

  validateEventSources(row.sources);

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
    !PUBLIC_EVENT_PRIMARY_CATEGORIES.has(row.primary)
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

export function validatePublicEvent(event) {
  if (!event?.id) {
    throw new Error("id がありません");
  }

  const date = String(event.date ?? "");
  if (!isValidEventDate(date)) {
    throw new Error(
      `date "${date}" の形式が不正です`
    );
  }

  const endDate = String(event.end_date ?? "");
  if (
    endDate &&
    !isValidEventDate(endDate)
  ) {
    throw new Error(
      `end_date "${endDate}" の形式が不正です`
    );
  }

  if (
    endDate &&
    isEndDateDefinitelyBeforeStart(
      date,
      endDate
    )
  ) {
    throw new Error(
      `end_date "${endDate}" が date "${date}" より前です`
    );
  }

  if (
    typeof event.title !== "string" ||
    !event.title.trim()
  ) {
    throw new Error("title がありません");
  }

  if (
    typeof event.summary !== "string" ||
    !event.summary.trim()
  ) {
    throw new Error("summary がありません");
  }

  validateEventSources(event.sources);

  const importance = Number(event.importance);
  if (![1, 2, 3].includes(importance)) {
    throw new Error(
      "importance は 1, 2, 3 のいずれかです"
    );
  }

  const cats = event.cats;
  if (
    !Array.isArray(cats) ||
    cats.length === 0
  ) {
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
    !PUBLIC_EVENT_PRIMARY_CATEGORIES.has(event.primary)
  ) {
    throw new Error(
      `primary "${event.primary}" が不正です`
    );
  }

  if (!cats.includes(event.primary)) {
    throw new Error(
      `primary "${event.primary}" が cats に含まれていません`
    );
  }

  const subs = event.subs ?? [];
  if (!Array.isArray(subs)) {
    throw new Error("subs が配列ではありません");
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
    subs,
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
