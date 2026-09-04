import { catsOf, primaryCatOf } from "./categories.js";
import { buildLifeModel } from "./life-stages.js";
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
          event.t,
          event.n,
          event.q,
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
  importanceMin,
  search,
}) {
  const categoryOn = (key) => catOff[key] !== true;

  return events
    .filter((event) => {
      const primary = primaryCatOf(event);

      return (
        categoryOn(primary) &&
        (
          primary !== "work" ||
          !sfOnly ||
          catsOf(event).includes("sf")
        ) &&
        (event.importance ?? 2) >= importanceMin &&
        search.matches(event)
      );
    })
    .map((event) => ({
      ...event,
      cats: catsOf(event),
      // 既存表示コードとの互換のため
      // cat には正規化した主分類を入れる。
      cat: primaryCatOf(event),
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
  importanceMin,
  search,
}) {
  const selectedPublicEvents =
    selectPublicTimelineEvents({
      events: publicEvents,
      catOff,
      sfOnly,
      importanceMin,
      search,
    });

  const selectedPersonalEvents = showPersonal
    ? personalEvents
        .filter(search.matches)
        .map((event) => ({
          ...event,
          cat: "me",
          cats: event.cats ?? ["me"],
          primary: "me",
          ic: event.ic ?? "flag",
        }))
    : [];

  return [
    ...selectedPublicEvents,
    ...selectedPersonalEvents,
  ]
    .map((event) => ({
      ...event,
      age: event.y - birth,
    }))
    .sort(
      (a, b) =>
        a.y - b.y ||
        TIMELINE_CATEGORY_RANK[a.cat] -
          TIMELINE_CATEGORY_RANK[b.cat]
    );
}

export function buildTimelineLifeContext({
  birth,
  month,
  earlyChildhoodHistory,
  higherEducationHistory,
  graduateEducationHistory,
  adultPeriodsEnabled,
  adultPeriods,
}) {
  const life = buildLifeModel({
    birth,
    month,
    earlyChildhoodHistory,
    higherEducationHistory,
    graduateEducationHistory,
    adultYear: "",
  });

  const validation = validateAdultPeriods(
    adultPeriodsEnabled ? adultPeriods : [],
    {
      adultYear: life.adultYear,
    }
  );

  const usableAdultPeriods =
    adultPeriodsEnabled &&
    validation.errors.length === 0
      ? validation.periods
      : [];

  return {
    life,
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
    const baseStage = life.stageOf(event.y);

    if (baseStage.key === "pre") {
      if (event.y < TIMELINE_START_YEAR) {
        continue;
      }

      const period = preBirthPeriods.find(
        (candidate) =>
          event.y >= candidate.from &&
          event.y <= candidate.to
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
        ? adultPeriodOf(event.y, adultPeriods)
        : null;

    const stage = customAdultPeriod
      ? {
          ...baseStage,
          label: customAdultPeriod.label,
        }
      : baseStage;

    const key = customAdultPeriod
      ? `adult-period:${customAdultPeriod.from}:${
          customAdultPeriod.to ?? "open"
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
      (event) => event.cat !== "me"
    ).length,
    myShown: visibleItems.filter(
      (event) => event.cat === "me"
    ).length,
  };
}
