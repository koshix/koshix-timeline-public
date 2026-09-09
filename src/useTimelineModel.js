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
  subFilters = [],
  categoryMatchMode = "primary",
  importanceMin,
  showPersonal,
  searchText,
  closedStages,
}) {
  return useMemo(() => {
    const search = createTimelineSearch(searchText);

    const {
      life,
      birthConfigured,
      projectionBirth,
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
      subFilters,
      categoryMatchMode,
      importanceMin,
      search,
    });

    const groups = buildTimelineGroups({
      events,
      life,
      adultPeriods: usableAdultPeriods,
      birth: projectionBirth,
    });

    const visibility = buildTimelineVisibility({
      groups,
      searchText,
      closedStages,
    });

    const controlTargets =
      buildTimelineControlTargets({
        groups: visibility.groups,
      });

    return {
      groups: visibility.groups,
      visibleItems: visibility.visibleItems,
      controlTargets,
      gradeLabel:
        birthConfigured
          ? life.gradeLabel
          : () => "",
      birthConfigured,
      adultYear:
        birthConfigured
          ? life.adultYear
          : null,
      adultPeriodErrors,
      adultPeriods: usableAdultPeriods,
      warnings:
        birthConfigured
          ? life.warnings
          : [],
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
    subFilters,
    categoryMatchMode,
    importanceMin,
    showPersonal,
    searchText,
    closedStages,
  ]);
}
