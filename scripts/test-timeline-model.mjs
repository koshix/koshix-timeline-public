import assert from "node:assert/strict";

import {
  buildTimelineEventList,
  buildTimelineGroups,
  buildTimelineLifeContext,
  buildTimelineVisibility,
  createTimelineSearch,
  selectPublicTimelineEvents,
} from "../src/timeline-model.js";

const events = [
  {
    id: "science-important",
    y: 2000,
    date: "2000",
    t: "量子研究",
    n: "物理学の成果",
    cat: "science",
    importance: 3,
  },
  {
    id: "tech-alias",
    y: 2001,
    date: "2001",
    t: "ネットワーク技術",
    n: "インターネット",
    cat: "tech",
    importance: 2,
  },
  {
    id: "work-sf",
    y: 2002,
    date: "2002",
    t: "宇宙小説",
    n: "SF作品",
    cat: "work",
    cats: ["work", "sf"],
    importance: 2,
  },
  {
    id: "work-non-sf",
    y: 2003,
    date: "2003",
    t: "一般小説",
    cat: "work",
    importance: 2,
  },
  {
    id: "low",
    y: 2004,
    date: "2004",
    t: "低重要度",
    cat: "society",
    importance: 1,
  },
];

const allSearch = createTimelineSearch("");

const standard = selectPublicTimelineEvents({
  events,
  catOff: {},
  sfOnly: false,
  importanceMin: 2,
  search: allSearch,
});

assert.deepEqual(
  standard.map((event) => event.id),
  [
    "science-important",
    "tech-alias",
    "work-sf",
    "work-non-sf",
  ]
);

assert.equal(
  standard.find((event) => event.id === "tech-alias").cat,
  "computer"
);

assert.deepEqual(
  standard.find((event) => event.id === "work-sf").cats,
  ["work", "sf"]
);

const categoryFiltered = selectPublicTimelineEvents({
  events,
  catOff: { science: true },
  sfOnly: false,
  importanceMin: 2,
  search: allSearch,
});

assert.equal(
  categoryFiltered.some(
    (event) => event.id === "science-important"
  ),
  false
);

const sfOnly = selectPublicTimelineEvents({
  events,
  catOff: {},
  sfOnly: true,
  importanceMin: 2,
  search: allSearch,
});

assert.equal(
  sfOnly.some((event) => event.id === "work-sf"),
  true
);

assert.equal(
  sfOnly.some((event) => event.id === "work-non-sf"),
  false
);

assert.equal(
  sfOnly.some((event) => event.id === "science-important"),
  true
);

const searched = selectPublicTimelineEvents({
  events,
  catOff: {},
  sfOnly: false,
  importanceMin: 1,
  search: createTimelineSearch("インターネット"),
});

assert.deepEqual(
  searched.map((event) => event.id),
  ["tech-alias"]
);

const invalidSearch = createTimelineSearch("(");

assert.ok(invalidSearch.error);
assert.equal(
  selectPublicTimelineEvents({
    events,
    catOff: {},
    sfOnly: false,
    importanceMin: 1,
    search: invalidSearch,
  }).length,
  0
);

const personalEvents = [
  {
    id: "personal",
    y: 2001,
    date: "2001",
    t: "私の出来事",
  },
];

const timelineList = buildTimelineEventList({
  publicEvents: events,
  personalEvents,
  showPersonal: true,
  birth: 1990,
  catOff: {},
  sfOnly: false,
  importanceMin: 2,
  search: allSearch,
});

assert.deepEqual(
  timelineList.map((event) => event.id),
  [
    "science-important",
    "personal",
    "tech-alias",
    "work-sf",
    "work-non-sf",
  ]
);

const personal = timelineList.find(
  (event) => event.id === "personal"
);

assert.equal(personal.age, 11);
assert.equal(personal.cat, "me");
assert.deepEqual(personal.cats, ["me"]);
assert.equal(personal.primary, "me");
assert.equal(personal.ic, "flag");

const personalSearch = buildTimelineEventList({
  publicEvents: events,
  personalEvents,
  showPersonal: true,
  birth: 1990,
  catOff: {},
  sfOnly: false,
  importanceMin: 1,
  search: createTimelineSearch("私の出来事"),
});

assert.deepEqual(
  personalSearch.map((event) => event.id),
  ["personal"]
);

const personalHidden = buildTimelineEventList({
  publicEvents: events,
  personalEvents,
  showPersonal: false,
  birth: 1990,
  catOff: {},
  sfOnly: false,
  importanceMin: 2,
  search: allSearch,
});

assert.equal(
  personalHidden.some(
    (event) => event.id === "personal"
  ),
  false
);

const lifeContext = buildTimelineLifeContext({
  birth: 1990,
  month: 4,
  earlyChildhoodHistory: [],
  higherEducationHistory: [],
  graduateEducationHistory: [],
  adultPeriodsEnabled: true,
  adultPeriods: [
    {
      start: "2010",
      end: "2014",
      label: "第1期",
    },
  ],
});

assert.equal(lifeContext.life.adultYear, 2009);
assert.equal(lifeContext.life.gradeLabel(1997), "小1");
assert.deepEqual(lifeContext.adultPeriodErrors, []);
assert.equal(lifeContext.adultPeriods.length, 1);
assert.equal(lifeContext.adultPeriods[0].from, 2010);
assert.equal(lifeContext.adultPeriods[0].to, 2014);
assert.equal(lifeContext.adultPeriods[0].label, "第1期");

const invalidAdultPeriods =
  buildTimelineLifeContext({
    birth: 1990,
    month: 4,
    earlyChildhoodHistory: [],
    higherEducationHistory: [],
    graduateEducationHistory: [],
    adultPeriodsEnabled: true,
    adultPeriods: [
      {
        start: "2000",
        end: "2005",
        label: "早すぎる期間",
      },
    ],
  });

assert.equal(invalidAdultPeriods.adultPeriods.length, 0);
assert.ok(invalidAdultPeriods.adultPeriodErrors.length > 0);

const disabledAdultPeriods =
  buildTimelineLifeContext({
    birth: 1990,
    month: 4,
    earlyChildhoodHistory: [],
    higherEducationHistory: [],
    graduateEducationHistory: [],
    adultPeriodsEnabled: false,
    adultPeriods: [
      {
        start: "2010",
        end: "2014",
        label: "第1期",
      },
    ],
  });

assert.deepEqual(disabledAdultPeriods.adultPeriods, []);
assert.deepEqual(disabledAdultPeriods.adultPeriodErrors, []);

const groupedEvents = [
  {
    id: "too-early",
    y: 1500,
    cat: "science",
  },
  {
    id: "pre",
    y: 1950,
    cat: "science",
  },
  {
    id: "elementary",
    y: 1997,
    cat: "science",
  },
  {
    id: "adult-before-period",
    y: 2009,
    cat: "science",
  },
  {
    id: "adult-period-start",
    y: 2010,
    cat: "science",
  },
  {
    id: "adult-period-end",
    y: 2014,
    cat: "science",
  },
  {
    id: "adult-after-period",
    y: 2015,
    cat: "science",
  },
];

const timelineGroups = buildTimelineGroups({
  events: groupedEvents,
  life: lifeContext.life,
  adultPeriods: lifeContext.adultPeriods,
  birth: 1990,
});

const preGroup = timelineGroups.find(
  (group) => group.key === "pre-20-first"
);

assert.ok(preGroup);
assert.deepEqual(
  preGroup.items.map((event) => event.id),
  ["pre"]
);

assert.equal(
  timelineGroups
    .flatMap((group) => group.items)
    .some((event) => event.id === "too-early"),
  false
);

const elementaryGroup = timelineGroups.find(
  (group) => group.key === "elem"
);

assert.ok(elementaryGroup);
assert.deepEqual(
  elementaryGroup.items.map((event) => event.id),
  ["elementary"]
);

const adultPeriodGroup = timelineGroups.find(
  (group) =>
    group.key === "adult-period:2010:2014"
);

assert.ok(adultPeriodGroup);
assert.equal(
  adultPeriodGroup.stage.label,
  "第1期"
);
assert.deepEqual(
  adultPeriodGroup.items.map((event) => event.id),
  [
    "adult-period-start",
    "adult-period-end",
  ]
);

const ordinaryAdultGroups =
  timelineGroups.filter(
    (group) => group.key === "adult"
  );

assert.deepEqual(
  ordinaryAdultGroups.map((group) =>
    group.items.map((event) => event.id)
  ),
  [
    ["adult-before-period"],
    ["adult-after-period"],
  ]
);

const closedVisibility =
  buildTimelineVisibility({
    groups: timelineGroups,
    searchText: "",
    closedStages: new Set(["elem"]),
  });

const closedElementaryGroup =
  closedVisibility.groups.find(
    (group) => group.key === "elem"
  );

assert.equal(closedElementaryGroup.closed, true);
assert.equal(
  closedVisibility.visibleItems.some(
    (event) => event.id === "elementary"
  ),
  false
);
assert.equal(closedVisibility.shown, 5);
assert.equal(closedVisibility.myShown, 0);

// 入力groups自体は変更しない。
assert.equal(elementaryGroup.closed, undefined);

const searchVisibility =
  buildTimelineVisibility({
    groups: timelineGroups,
    searchText: "検索中",
    closedStages: new Set(["elem"]),
  });

assert.equal(
  searchVisibility.groups.find(
    (group) => group.key === "elem"
  ).closed,
  false
);
assert.equal(
  searchVisibility.visibleItems.some(
    (event) => event.id === "elementary"
  ),
  true
);

const personalVisibility =
  buildTimelineVisibility({
    groups: [
      {
        key: "test",
        items: [
          { id: "public", cat: "science" },
          { id: "personal", cat: "me" },
        ],
      },
    ],
    searchText: "",
    closedStages: new Set(),
  });

assert.equal(personalVisibility.shown, 1);
assert.equal(personalVisibility.myShown, 1);

console.log(
  "OK: 年表の検索・イベント統合・人生モデル・成人期検証・人生段階射影・表示集計を検査しました"
);
