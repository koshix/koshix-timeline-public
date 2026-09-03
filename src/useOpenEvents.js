import { useState } from "react";

export default function useOpenEvents() {
  const [openEventIds, setOpenEventIds] = useState(
    () => new Set()
  );

  const isEventOpen = (id) =>
    openEventIds.has(id);

  const toggleEvent = (id) =>
    setOpenEventIds((previous) => {
      const next = new Set(previous);
      next.has(id)
        ? next.delete(id)
        : next.add(id);
      return next;
    });

  const openEvent = (id) =>
    setOpenEventIds((previous) =>
      new Set(previous).add(id)
    );

  const closeEvent = (id) =>
    setOpenEventIds((previous) => {
      const next = new Set(previous);
      next.delete(id);
      return next;
    });

  const openOnlyEvents = (ids) => {
    setOpenEventIds(new Set(ids));
  };

  const closeAllEvents = () => {
    setOpenEventIds(new Set());
  };

  return {
    isEventOpen,
    toggleEvent,
    openEvent,
    closeEvent,
    openOnlyEvents,
    closeAllEvents,
  };
}
