function cloneValue(value) {
  return Array.isArray(value) ? [...value] : value;
}

function applyChanges(event, changes) {
  const next = { ...event };

  for (const [key, value] of Object.entries(changes)) {
    if (key === "id") {
      throw new Error("既存イベントの id は変更できません");
    }

    if (value === null) {
      delete next[key];
    } else {
      next[key] = cloneValue(value);
    }
  }

  if (Object.prototype.hasOwnProperty.call(changes, "date")) {
    next.y = Number(String(next.date).slice(0, 4));
  }

  return next;
}

export function applyEventCustomizations(
  baseEvents,
  customizations = {}
) {
  if (!Array.isArray(baseEvents)) {
    throw new Error("正本イベントが配列ではありません");
  }

  const overrides = customizations.overrides ?? {};
  const hidden = customizations.hidden ?? [];
  const additions = customizations.additions ?? [];

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

  const baseIds = new Set();
  for (const event of baseEvents) {
    if (!event?.id) {
      throw new Error("正本イベントに id がありません");
    }
    if (baseIds.has(event.id)) {
      throw new Error(`正本イベント id "${event.id}" が重複しています`);
    }
    baseIds.add(event.id);
  }

  const orphaned = new Set();

  for (const id of Object.keys(overrides)) {
    if (!baseIds.has(id)) {
      orphaned.add(id);
    }
  }

  for (const id of hidden) {
    if (!baseIds.has(id)) {
      orphaned.add(id);
    }
  }

  const hiddenIds = new Set(hidden);

  const events = baseEvents
    .filter((event) => !hiddenIds.has(event.id))
    .map((event) => {
      const changes = overrides[event.id];
      return changes
        ? applyChanges(event, changes)
        : { ...event };
    });

  const usedIds = new Set(baseIds);

  for (const addition of additions) {
    if (!addition?.id) {
      throw new Error("追加イベントに id がありません");
    }

    if (usedIds.has(addition.id)) {
      throw new Error(
        `追加イベント id "${addition.id}" が正本または追加項目と重複しています`
      );
    }

    usedIds.add(addition.id);

    const event = {
      ...addition,
      ...(Array.isArray(addition.cats)
        ? { cats: [...addition.cats] }
        : {}),
      ...(Array.isArray(addition.subs)
        ? { subs: [...addition.subs] }
        : {}),
      ...(Array.isArray(addition.l)
        ? { l: [...addition.l] }
        : {}),
    };

    if (event.date) {
      event.y = Number(String(event.date).slice(0, 4));
    }

    events.push(event);
  }

  events.sort(
    (a, b) =>
      a.y - b.y ||
      String(a.date ?? "").localeCompare(String(b.date ?? "")) ||
      String(a.t ?? "").localeCompare(String(b.t ?? ""), "ja")
  );

  return {
    events,
    orphaned: [...orphaned].sort(),
  };
}
