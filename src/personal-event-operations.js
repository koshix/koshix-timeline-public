export function createPersonalDraft() {
  return {
    date: "",
    title: "",
    importance: 2,
    summary: "",
  };
}

export function personalDraftFromEvent(
  event = {}
) {
  return {
    date: event.date ?? "",
    title: event.title ?? "",
    importance: event.importance ?? 2,
    summary: event.summary ?? "",
  };
}

function normalizedDraft(draft = {}) {
  return {
    date: String(
      draft.date ?? ""
    ).trim(),
    title: String(
      draft.title ?? ""
    ).trim(),
    importance: Number(
      draft.importance
    ),
    summary: String(
      draft.summary ?? ""
    ).trim(),
  };
}

export function applyPersonalEventDraft(
  events,
  {
    existing = null,
    draft = {},
    newId = null,
  } = {}
) {
  const current =
    Array.isArray(events)
      ? events
      : [];

  const values = normalizedDraft(draft);

  let event;

  if (existing) {
    event = {
      ...existing,
      ...values,
    };
  } else {
    if (!newId) {
      throw new Error(
        "新規自分史の id がありません"
      );
    }

    if (
      current.some(
        (item) => item.id === newId
      )
    ) {
      throw new Error(
        `自分史 id "${newId}" が重複しています`
      );
    }

    event = {
      id: newId,
      ...values,
      cats: ["me"],
      primary: "me",
    };
  }

  const nextEvents = existing
    ? current.map((item) =>
        item.id === existing.id
          ? event
          : item
      )
    : [...current, event];

  return {
    event,
    events: nextEvents,
    created: !existing,
  };
}

export function removePersonalEventById(
  events,
  id
) {
  return (
    Array.isArray(events)
      ? events
      : []
  ).filter(
    (event) => event.id !== id
  );
}
