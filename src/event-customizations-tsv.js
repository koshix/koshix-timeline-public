import {
  EVENT_FIELD_ORDER,
  validatePublicEvent,
} from "./event-schema.js";

export const EVENT_CUSTOMIZATIONS_TSV_HEADER = [
  "action",
  "id",
  "field",
  "value_json",
];

const EVENT_FIELDS = new Set(EVENT_FIELD_ORDER);

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
  if (!EVENT_FIELDS.has(field)) {
    throw new Error(
      `${lineNo}行目: field "${field}" は未対応です`
    );
  }
}

function validateAddition(event, id) {
  try {
    validatePublicEvent(event);
  } catch (error) {
    throw new Error(
      `追加項目 "${id}": ${error.message}`
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
          field
        )
      ) {
        throw new Error(
          `${lineNo}行目: override "${id}" の field "${field}" が重複しています`
        );
      }

      overrides[id][field] = value;
      continue;
    }

    if (action === "add") {
      requireKnownField(field, lineNo);
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
          field
        )
      ) {
        throw new Error(
          `${lineNo}行目: add "${id}" の field "${field}" が重複しています`
        );
      }

      event[field] = value;
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

    validateAddition(event, id);
    additions.push(event);
  }

  additions.sort(
    (a, b) =>
      String(a.date).localeCompare(String(b.date)) ||
      String(a.title).localeCompare(String(b.title), "ja")
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
      key !== "id" &&
      !EVENT_FIELDS.has(key)
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

    for (const field of EVENT_FIELD_ORDER) {

      if (
        !Object.prototype.hasOwnProperty.call(
          changes,
          field
        )
      ) {
        continue;
      }

      rows.push([
        "override",
        id,
        field,
        jsonCell(
          changes[field],
          `override "${id}" field "${field}"`
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

    for (const field of EVENT_FIELD_ORDER) {

      if (
        !Object.prototype.hasOwnProperty.call(
          event,
          field
        )
      ) {
        continue;
      }

      rows.push([
        "add",
        event.id,
        field,
        jsonCell(
          event[field],
          `追加項目 "${event.id}" field "${field}"`
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
