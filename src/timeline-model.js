import {
  eventYear,
  PUBLIC_EVENT_CATEGORY_KEYS,
} from "./event-schema.js";
import { eventId } from "./event-links.js";
import { catsOf, primaryCatOf } from "./categories.js";

const RELATED_CATEGORY_KEYS = new Set(
  PUBLIC_EVENT_CATEGORY_KEYS.filter(
    (key) => key !== "sf"
  )
);
import {
  buildLifeModel,
  validYear,
} from "./life-stages.js";
import {
  adultPeriodOf,
  validateAdultPeriods,
} from "./adult-periods.js";
import {
  TIMELINE_START_YEAR,
  preBirthPeriodsOf,
} from "./timeline-eras.js";
import {
  matchesSearchExpression,
  normalizeSearchText,
  parseSearchExpression,
} from "./search-query.js";

export function createTimelineSearch(searchText) {
  const text = String(searchText ?? "");
  const active = text.trim().length > 0;
  const expression = parseSearchExpression(text);

  return {
    error: expression.error,

    matches(event) {
      if (!active) return true;
      if (expression.error) return false;

      const haystack = normalizeSearchText(
        [
          event.date,
          event.end_date,
          event.title,
          event.summary,
          event.search,
          event.note,
          event.region,
        ]
          .filter(Boolean)
          .join(" ")
      );

      return matchesSearchExpression(
        expression.root,
        haystack
      );
    },
  };
}

export function selectPublicTimelineEvents({
  events,
  catOff,
  sfOnly,
  subFilters = [],
  importanceMin,
  search,
  categoryMatchMode = "primary",
}) {
  const categoryOn = (key) => catOff[key] !== true;
  const activeSubFilters = new Set(subFilters);

  return events
    .filter((event) => {
      const primary = primaryCatOf(event);
      const categories = catsOf(event);
      const matchesCategory = (key) =>
        RELATED_CATEGORY_KEYS.has(key) &&
        categoryOn(key) &&
        (
          key !== "work" ||
          !sfOnly ||
          categories.includes("sf")
        );

      const categoryVisible =
        categoryMatchMode === "related"
          ? categories.some(matchesCategory)
          : matchesCategory(primary);

      const eventSubs = Array.isArray(event.subs)
        ? event.subs
        : [];

      const subVisible =
        activeSubFilters.size === 0 ||
        eventSubs.some((key) =>
          activeSubFilters.has(key)
        );

      return (
        categoryVisible &&
        subVisible &&
        (event.importance ?? 2) >= importanceMin &&
        search.matches(event)
      );
    })
    .map((event) => ({
      ...event,
      cats: catsOf(event),
      primary: primaryCatOf(event),
    }));
}

const TIMELINE_CATEGORY_RANK = {
  me: 0,
  sf: 1,
  science: 2,
  education: 3,
  computer: 4,
  culture: 5,
  society: 6,
};

export function buildTimelineEventList({
  publicEvents,
  personalEvents,
  showPersonal,
  birth,
  catOff,
  sfOnly,
  subFilters = [],
  importanceMin,
  search,
  categoryMatchMode = "primary",
}) {
  const selectedPublicEvents =
    selectPublicTimelineEvents({
      events: publicEvents,
      catOff,
      sfOnly,
      subFilters,
      importanceMin,
      search,
      categoryMatchMode,
    });

  const selectedPersonalEvents = showPersonal
    ? personalEvents
        .filter(search.matches)
        .map((event) => ({
          ...event,
          cats: event.cats ?? ["me"],
          primary: "me",
        }))
    : [];

  const birthYear = validYear(birth);

  return [
    ...selectedPublicEvents,
    ...selectedPersonalEvents,
  ]
    .map((event) => ({
      ...event,
      age:
        birthYear == null
          ? null
          : eventYear(event) - birthYear,
    }))
    .sort(
      (a, b) =>
        eventYear(a) - eventYear(b) ||
        TIMELINE_CATEGORY_RANK[a.primary] -
          TIMELINE_CATEGORY_RANK[b.primary]
    );
}

export function buildTimelineLifeContext({
  birth,
  month,
  education,
  adultPeriods,
}) {
  const birthYear = validYear(birth);
  const birthConfigured =
    birthYear != null;

  // 生年未設定時も共通年表を年代順に表示できるよう、
  // 内部投影だけは年表上限の翌年を仮の生年として使う。
  // この値を利用者の生年として表示・保存してはならない。
  const projectionBirth =
    birthConfigured ? birthYear : 2101;

  const life = buildLifeModel({
    birth: projectionBirth,
    month: birthConfigured ? month : 0,
    education:
      birthConfigured ? education : [],
  });

  const validation = validateAdultPeriods(
    birthConfigured ? adultPeriods : [],
    {
      adultYear: life.adultYear,
    }
  );

  const usableAdultPeriods =
    validation.errors.length === 0
      ? validation.periods
      : [];

  return {
    life,
    birthConfigured,
    projectionBirth,
    adultPeriods: usableAdultPeriods,
    adultPeriodErrors: validation.errors,
  };
}

export function buildTimelineGroups({
  events,
  life,
  adultPeriods,
  birth,
}) {
  const preBirthPeriods = preBirthPeriodsOf(birth);
  const preBirthStage = life.stageOf(birth - 1);

  const groups = preBirthPeriods.map((period) => ({
    key: period.key,
    stage: {
      ...preBirthStage,
      key: period.key,
      label: period.label,
    },
    adultPeriod: null,
    rangeFrom: period.from,
    rangeTo: period.to,
    items: [],
  }));

  const preBirthGroups = new Map(
    groups.map((group) => [group.key, group])
  );

  for (const event of events) {
    const baseStage = life.stageOf(eventYear(event));

    if (baseStage.key === "pre") {
      if (eventYear(event) < TIMELINE_START_YEAR) {
        continue;
      }

      const period = preBirthPeriods.find(
        (candidate) =>
          eventYear(event) >= candidate.from &&
          eventYear(event) <= candidate.to
      );

      if (period) {
        preBirthGroups
          .get(period.key)
          ?.items.push(event);
      }

      continue;
    }

    const customAdultPeriod =
      baseStage.key === "adult"
        ? adultPeriodOf(eventYear(event), adultPeriods)
        : null;

    const stage = customAdultPeriod
      ? {
          ...baseStage,
          label: customAdultPeriod.label,
        }
      : baseStage;

    const key = customAdultPeriod
      ? `adult-period:${customAdultPeriod.start}:${
          customAdultPeriod.end ?? "open"
        }`
      : baseStage.key;

    const last = groups[groups.length - 1];

    if (last && last.key === key) {
      last.items.push(event);
    } else {
      groups.push({
        key,
        stage,
        adultPeriod: customAdultPeriod,
        items: [event],
      });
    }
  }

  return groups;
}

export function buildTimelineVisibility({
  groups,
  searchText,
  closedStages,
}) {
  const searchActive = searchText.trim().length > 0;

  const visibleGroups = groups.map((group) => ({
    ...group,
    closed:
      !searchActive &&
      closedStages.has(group.key),
  }));

  const visibleItems = visibleGroups
    .filter((group) => !group.closed)
    .flatMap((group) => group.items);

  return {
    groups: visibleGroups,
    visibleItems,
    shown: visibleItems.filter(
      (event) => event.primary !== "me"
    ).length,
    myShown: visibleItems.filter(
      (event) => event.primary === "me"
    ).length,
  };
}

export function buildTimelineControlTargets({
  groups,
}) {
  const allStageKeys = groups.map(
    (group) => group.key
  );

  const allEvents = groups.flatMap(
    (group) => group.items
  );

  return {
    allStageKeys,
    allEventIds: allEvents.map(eventId),
  };
}
