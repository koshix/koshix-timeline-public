function isObject(value) {
  return Boolean(value) &&
    typeof value === "object" &&
    !Array.isArray(value);
}

export function createVersionedRecord(
  format,
  schemaVersion,
  data
) {
  if (!format || typeof format !== "string") {
    throw new Error("保存形式名が不正です");
  }

  if (!Number.isInteger(schemaVersion) || schemaVersion < 1) {
    throw new Error("保存形式versionが不正です");
  }

  return {
    format,
    schemaVersion,
    data,
  };
}

export function decodeVersionedRecord(
  value,
  {
    format,
    currentVersion,
    migrations = {},
    validateData = (data) => data,
    context = "保存データ",
  }
) {
  const hasEnvelope =
    isObject(value) &&
    Object.prototype.hasOwnProperty.call(value, "format") &&
    Object.prototype.hasOwnProperty.call(value, "schemaVersion") &&
    Object.prototype.hasOwnProperty.call(value, "data");

  if (!hasEnvelope) {
    throw new Error(
      `${context}のversion付き形式が不正です`
    );
  }

  if (value.format !== format) {
    throw new Error(
      `${context}の形式が不正です: ${value.format}`
    );
  }

  if (
    !Number.isInteger(value.schemaVersion) ||
    value.schemaVersion < 1
  ) {
    throw new Error(
      `${context}のschemaVersionが不正です`
    );
  }

  if (value.schemaVersion > currentVersion) {
    throw new Error(
      `${context}は新しい形式(version ${value.schemaVersion})で、` +
      `この版(version ${currentVersion})では読めません`
    );
  }

  const originalVersion = value.schemaVersion;
  let schemaVersion = originalVersion;
  let data = value.data;

  while (schemaVersion < currentVersion) {
    const migrate = migrations[schemaVersion];

    if (typeof migrate !== "function") {
      throw new Error(
        `${context} version ${schemaVersion} からの移行処理がありません`
      );
    }

    data = migrate(data);
    schemaVersion += 1;
  }

  const validatedData = validateData(data);
  const record = createVersionedRecord(
    format,
    currentVersion,
    validatedData
  );

  return {
    data: validatedData,
    record,
    migrated: originalVersion !== currentVersion,
  };
}
