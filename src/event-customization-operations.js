const EDITABLE_OVERRIDE_FIELDS = new Set([
  "title",
  "summary",
  "importance",
]);

export function customizationCounts(customizations = {}) {
  const overrideCount = Object.keys(
    customizations.overrides ?? {}
  ).length;
  const hiddenCount =
    customizations.hidden?.length ?? 0;
  const additionCount =
    customizations.additions?.length ?? 0;

  return {
    overrideCount,
    hiddenCount,
    additionCount,
    total:
      overrideCount +
      hiddenCount +
      additionCount,
  };
}

export function updateEventOverride(
  customizations,
  eventId,
  changes
) {
  const nextOverrides = {
    ...(customizations.overrides ?? {}),
  };

  const previous =
    nextOverrides[eventId] ?? {};

  const preserved = Object.fromEntries(
    Object.entries(previous).filter(
      ([key]) =>
        !EDITABLE_OVERRIDE_FIELDS.has(key)
    )
  );

  const merged = {
    ...preserved,
    ...changes,
  };

  if (Object.keys(merged).length === 0) {
    delete nextOverrides[eventId];
  } else {
    nextOverrides[eventId] = merged;
  }

  return {
    next: {
      overrides: nextOverrides,
      hidden: [
        ...(customizations.hidden ?? []),
      ],
      additions: [
        ...(customizations.additions ?? []),
      ],
    },
    merged,
  };
}

export function addEventCustomization(
  customizations,
  addition
) {
  return {
    overrides: {
      ...(customizations.overrides ?? {}),
    },
    hidden: [
      ...(customizations.hidden ?? []),
    ],
    additions: [
      ...(customizations.additions ?? []),
      addition,
    ],
  };
}

export function removeAddedEventCustomization(
  customizations,
  eventId
) {
  return {
    overrides: {
      ...(customizations.overrides ?? {}),
    },
    hidden: [
      ...(customizations.hidden ?? []),
    ],
    additions: (
      customizations.additions ?? []
    ).filter(
      (item) => item.id !== eventId
    ),
  };
}

export function hideEventCustomization(
  customizations,
  eventId
) {
  return {
    overrides: {
      ...(customizations.overrides ?? {}),
    },
    hidden: [
      ...new Set([
        ...(customizations.hidden ?? []),
        eventId,
      ]),
    ],
    additions: [
      ...(customizations.additions ?? []),
    ],
  };
}

export function restoreHiddenEventCustomization(
  customizations,
  eventId
) {
  return {
    overrides: {
      ...(customizations.overrides ?? {}),
    },
    hidden: (
      customizations.hidden ?? []
    ).filter(
      (itemId) => itemId !== eventId
    ),
    additions: [
      ...(customizations.additions ?? []),
    ],
  };
}
