import {
  EVENT_FIELD_MAP,
  EVENT_FIELD_ORDER,
  EVENT_INTERNAL_TO_EXTERNAL,
  isValidEventDate,
} from "./event-schema.js";

export const EVENT_CUSTOMIZATIONS_TSV_HEADER = [
  "action",
  "id",
  "field",
  "value_json",
];

const ALLOWED_DERIVED_FIELDS = new Set([
  "id",
  "y",
  "cat",
]);

function parseJsonValue(value, lineNo) {
  if (value === "") {
    throw new Error(
      `${lineNo}行目: value_json がありません`
    );
  }

  try {
    return JSON.parse(value);
  } catch {
    throw new Error(
      `${lineNo}行目: value_json がJSONとして不正です`
    );
  }
}

function requireKnownField(field, lineNo) {
  if (
    !Object.prototype.hasOwnProperty.call(
      EVENT_FIELD_MAP,
      field
    )
  ) {
    throw new Error(
      `${lineNo}行目: field "${field}" は未対応です`
    );
  }
}

function validateAddition(event, id) {
  if (!isValidEventDate(event.date ?? "")) {
    throw new Error(
      `追加項目 "${id}": date "${event.date ?? ""}" が不正です`
    );
  }

  if (
    event.end_date !== undefined &&
    event.end_date !== null &&
    event.end_date !== "" &&
    !isValidEventDate(event.end_date)
  ) {
    throw new Error(
      `追加項目 "${id}": end_date "${event.end_date}" が不正です`
    );
  }

  if (
    typeof event.t !== "string" ||
    !event.t.trim()
  ) {
    throw new Error(
      `追加項目 "${id}": title がありません`
    );
  }

  if (
    !Array.isArray(event.cats) ||
    event.cats.length === 0 ||
    event.cats.some(
      (value) =>
        typeof value !== "string" || !value.trim()
    )
  ) {
    throw new Error(
      `追加項目 "${id}": cats が不正です`
    );
  }

  if (
    typeof event.primary !== "string" ||
    !event.primary.trim()
  ) {
    throw new Error(
      `追加項目 "${id}": primary がありません`
    );
  }

  if (![1, 2, 3].includes(Number(event.importance))) {
    throw new Error(
      `追加項目 "${id}": importance は1, 2, 3のいずれかです`
    );
  }

  if (
    typeof event.ic !== "string" ||
    !event.ic.trim()
  ) {
    throw new Error(
      `追加項目 "${id}": icon がありません`
    );
  }

  if (
    typeof event.n !== "string" ||
    !event.n.trim()
  ) {
    throw new Error(
      `追加項目 "${id}": summary がありません`
    );
  }

  if (typeof event.core !== "boolean") {
    throw new Error(
      `追加項目 "${id}": core は true / false で指定してください`
    );
  }
}

export function parseEventCustomizationsTsv(text) {
  const normalized = String(text ?? "").replace(
    /\r\n/g,
    "\n"
  );

  const lines = normalized
    .split("\n")
    .filter((line) => line.trim() !== "");

  if (lines.length === 0) {
    throw new Error(
      "年表カスタマイズTSVにデータがありません"
    );
  }

  const header = lines[0].split("\t");

  if (
    header.join("\t") !==
    EVENT_CUSTOMIZATIONS_TSV_HEADER.join("\t")
  ) {
    throw new Error(
      "年表カスタマイズTSVのヘッダーが想定と違います"
    );
  }

  const overrides = {};
  const hidden = [];
  const hiddenIds = new Set();
  const additionFields = new Map();

  for (let i = 1; i < lines.length; i++) {
    const lineNo = i + 1;
    const cells = lines[i].split("\t");

    if (
      cells.length !==
      EVENT_CUSTOMIZATIONS_TSV_HEADER.length
    ) {
      throw new Error(
        `${lineNo}行目: 列数が ${cells.length}。` +
        `${EVENT_CUSTOMIZATIONS_TSV_HEADER.length}列必要です`
      );
    }

    const [action, id, field, valueJson] = cells;

    if (!id) {
      throw new Error(
        `${lineNo}行目: id がありません`
      );
    }

    if (action === "hide") {
      if (field !== "" || valueJson !== "") {
        throw new Error(
          `${lineNo}行目: hide 行では field と value_json は空欄にしてください`
        );
      }

      if (hiddenIds.has(id)) {
        throw new Error(
          `${lineNo}行目: hide id "${id}" が重複しています`
        );
      }

      hiddenIds.add(id);
      hidden.push(id);
      continue;
    }

    if (action === "override") {
      requireKnownField(field, lineNo);

      const internalField = EVENT_FIELD_MAP[field];
      const value = parseJsonValue(
        valueJson,
        lineNo
      );

      if (!overrides[id]) {
        overrides[id] = {};
      }

      if (
        Object.prototype.hasOwnProperty.call(
          overrides[id],
          internalField
        )
      ) {
        throw new Error(
          `${lineNo}行目: override "${id}" の field "${field}" が重複しています`
        );
      }

      overrides[id][internalField] = value;
      continue;
    }

    if (action === "add") {
      requireKnownField(field, lineNo);

      const internalField = EVENT_FIELD_MAP[field];
      const value = parseJsonValue(
        valueJson,
        lineNo
      );

      if (!additionFields.has(id)) {
        additionFields.set(id, {});
      }

      const event = additionFields.get(id);

      if (
        Object.prototype.hasOwnProperty.call(
          event,
          internalField
        )
      ) {
        throw new Error(
          `${lineNo}行目: add "${id}" の field "${field}" が重複しています`
        );
      }

      event[internalField] = value;
      continue;
    }

    throw new Error(
      `${lineNo}行目: action "${action}" は未対応です`
    );
  }

  const additions = [];

  for (const [id, fields] of additionFields) {
    const event = {
      id,
      ...fields,
    };

    if (event.date) {
      event.y = Number(
        String(event.date).slice(0, 4)
      );
    }

    if (event.primary) {
      event.cat = event.primary;
    }

    validateAddition(event, id);
    additions.push(event);
  }

  additions.sort(
    (a, b) =>
      String(a.date).localeCompare(String(b.date)) ||
      String(a.t).localeCompare(String(b.t), "ja")
  );

  return {
    overrides,
    hidden,
    additions,
  };
}

function assertSerializableFields(event, context) {
  for (const key of Object.keys(event)) {
    if (
      !Object.prototype.hasOwnProperty.call(
        EVENT_INTERNAL_TO_EXTERNAL,
        key
      ) &&
      !ALLOWED_DERIVED_FIELDS.has(key)
    ) {
      throw new Error(
        `${context}: 未対応の内部フィールド "${key}" があります`
      );
    }
  }
}

function jsonCell(value, context) {
  if (value === undefined) {
    throw new Error(
      `${context}: undefined はTSVへ書き出せません`
    );
  }

  return JSON.stringify(value);
}

export function serializeEventCustomizationsTsv(
  customizations
) {
  const overrides = customizations?.overrides ?? {};
  const hidden = customizations?.hidden ?? [];
  const additions = customizations?.additions ?? [];

  if (
    !overrides ||
    typeof overrides !== "object" ||
    Array.isArray(overrides)
  ) {
    throw new Error("overrides の形式が不正です");
  }

  if (!Array.isArray(hidden)) {
    throw new Error("hidden の形式が不正です");
  }

  if (!Array.isArray(additions)) {
    throw new Error("additions の形式が不正です");
  }

  const rows = [];

  for (const id of Object.keys(overrides).sort()) {
    if (!id) {
      throw new Error(
        "override に空の id があります"
      );
    }

    const changes = overrides[id];

    if (
      !changes ||
      typeof changes !== "object" ||
      Array.isArray(changes)
    ) {
      throw new Error(
        `override "${id}" の形式が不正です`
      );
    }

    assertSerializableFields(
      changes,
      `override "${id}"`
    );

    for (const externalField of EVENT_FIELD_ORDER) {
      const internalField = EVENT_FIELD_MAP[externalField];

      if (
        !Object.prototype.hasOwnProperty.call(
          changes,
          internalField
        )
      ) {
        continue;
      }

      rows.push([
        "override",
        id,
        externalField,
        jsonCell(
          changes[internalField],
          `override "${id}" field "${externalField}"`
        ),
      ]);
    }
  }

  for (const id of [...new Set(hidden)].sort()) {
    if (!id) {
      throw new Error("hide に空の id があります");
    }

    rows.push([
      "hide",
      id,
      "",
      "",
    ]);
  }

  const sortedAdditions = [...additions].sort(
    (a, b) =>
      String(a.id ?? "").localeCompare(
        String(b.id ?? "")
      )
  );

  for (const event of sortedAdditions) {
    if (!event?.id) {
      throw new Error(
        "追加項目に id がありません"
      );
    }

    assertSerializableFields(
      event,
      `追加項目 "${event.id}"`
    );

    validateAddition(event, event.id);

    for (const externalField of EVENT_FIELD_ORDER) {
      const internalField = EVENT_FIELD_MAP[externalField];

      if (
        !Object.prototype.hasOwnProperty.call(
          event,
          internalField
        )
      ) {
        continue;
      }

      rows.push([
        "add",
        event.id,
        externalField,
        jsonCell(
          event[internalField],
          `追加項目 "${event.id}" field "${externalField}"`
        ),
      ]);
    }
  }

  const lines = [
    EVENT_CUSTOMIZATIONS_TSV_HEADER.join("\t"),
    ...rows.map((row) => row.join("\t")),
  ];

  const text = `${lines.join("\n")}\n`;

  // 書き出したTSV自身が読み戻せることを保証する。
  parseEventCustomizationsTsv(text);

  return text;
}
