import { useMemo } from "react";

import {
  buildTimelineControlTargets,
  buildTimelineEventList,
  buildTimelineGroups,
  buildTimelineLifeContext,
  buildTimelineVisibility,
  createTimelineSearch,
} from "./timeline-model.js";

export default function useTimelineModel({
  birth,
  month,
  education,
  adultPeriods,
  personalEvents,
  publicEvents,
  catOff,
  sfOnly,
  importanceMin,
  showPersonal,
  searchText,
  closedStages,
}) {
  return useMemo(() => {
    const search = createTimelineSearch(searchText);

    const {
      life,
      adultPeriods: usableAdultPeriods,
      adultPeriodErrors,
    } = buildTimelineLifeContext({
      birth,
      month,
      education,
      adultPeriods,
    });

    const events = buildTimelineEventList({
      publicEvents,
      personalEvents,
      showPersonal,
      birth,
      catOff,
      sfOnly,
      importanceMin,
      search,
    });

    const groups = buildTimelineGroups({
      events,
      life,
      adultPeriods: usableAdultPeriods,
      birth,
    });

    const visibility = buildTimelineVisibility({
      groups,
      searchText,
      closedStages,
    });

    const controlTargets =
      buildTimelineControlTargets({
        groups: visibility.groups,
        birth,
      });

    return {
      groups: visibility.groups,
      visibleItems: visibility.visibleItems,
      controlTargets,
      gradeLabel: life.gradeLabel,
      adultYear: life.adultYear,
      adultPeriodErrors,
      adultPeriods: usableAdultPeriods,
      warnings: life.warnings,
      shown: visibility.shown,
      myShown: visibility.myShown,
      searchError: search.error,
    };
  }, [
    birth,
    month,
    education,
    adultPeriods,
    personalEvents,
    publicEvents,
    catOff,
    sfOnly,
    importanceMin,
    showPersonal,
    searchText,
    closedStages,
  ]);
}
