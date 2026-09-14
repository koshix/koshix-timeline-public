import assert from "node:assert/strict";

import {
  buildTimelineControlTargets,
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
    date: "2000",
    title: "量子研究",
    summary: "物理学の成果",
    cats: ["science"],
    primary: "science",
    importance: 3,
  },
  {
    id: "computer-standard",
    date: "2001",
    title: "ネットワーク技術",
    summary: "インターネット",
    cats: ["computer"],
    primary: "computer",
    importance: 2,
  },
  {
    id: "work-sf",
    date: "2002",
    title: "宇宙小説",
    summary: "SF作品",
    cats: ["work", "sf"],
    primary: "work",
    importance: 2,
  },
  {
    id: "work-non-sf",
    date: "2003",
    title: "一般小説",
    cats: ["work"],
    primary: "work",
    importance: 2,
  },
  {
    id: "low",
    date: "2004",
    title: "低重要度",
    cats: ["society"],
    primary: "society",
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
    "computer-standard",
    "work-sf",
    "work-non-sf",
  ]
);

assert.equal(
  standard.find((event) => event.id === "computer-standard").primary,
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

const educationCategoryEvents = [
  {
    id: "education-primary",
    date: "2000",
    title: "教育制度",
    cats: ["education"],
    primary: "education",
    importance: 2,
  },
  {
    id: "science-education-related",
    date: "2001",
    title: "科学教育",
    cats: ["science", "education"],
    primary: "science",
    importance: 2,
  },
];

const educationOnlyOff = {
  work: true,
  science: true,
  computer: true,
  culture: true,
  society: true,
};

const educationPrimaryOnly =
  selectPublicTimelineEvents({
    events: educationCategoryEvents,
    catOff: educationOnlyOff,
    sfOnly: false,
    importanceMin: 2,
    search: allSearch,
    categoryMatchMode: "primary",
  });

assert.deepEqual(
  educationPrimaryOnly.map((event) => event.id),
  ["education-primary"]
);

const educationRelated =
  selectPublicTimelineEvents({
    events: educationCategoryEvents,
    catOff: educationOnlyOff,
    sfOnly: false,
    importanceMin: 2,
    search: allSearch,
    categoryMatchMode: "related",
  });

assert.deepEqual(
  educationRelated.map((event) => event.id),
  [
    "education-primary",
    "science-education-related",
  ]
);

const workRelatedEvents = [
  {
    id: "work-related-non-sf",
    date: "2000",
    title: "作品関連の非SF科学",
    cats: ["science", "work"],
    primary: "science",
    importance: 2,
  },
  {
    id: "work-related-sf",
    date: "2001",
    title: "作品関連のSF科学",
    cats: ["science", "work", "sf"],
    primary: "science",
    importance: 2,
  },
  {
    id: "work-primary-sf",
    date: "2002",
    title: "SF作品",
    cats: ["work", "sf"],
    primary: "work",
    importance: 2,
  },
];

const workOnlyOff = {
  science: true,
  education: true,
  computer: true,
  culture: true,
  society: true,
};

const workRelatedSfOnly =
  selectPublicTimelineEvents({
    events: workRelatedEvents,
    catOff: workOnlyOff,
    sfOnly: true,
    importanceMin: 2,
    search: allSearch,
    categoryMatchMode: "related",
  });

assert.deepEqual(
  workRelatedSfOnly.map((event) => event.id),
  [
    "work-related-sf",
    "work-primary-sf",
  ]
);

const workPrimarySfOnly =
  selectPublicTimelineEvents({
    events: workRelatedEvents,
    catOff: workOnlyOff,
    sfOnly: true,
    importanceMin: 2,
    search: allSearch,
    categoryMatchMode: "primary",
  });

assert.deepEqual(
  workPrimarySfOnly.map((event) => event.id),
  ["work-primary-sf"]
);

// scienceもONなら、非SFでもscienceとの関連一致で表示する。
// SF✓はworkカテゴリだけのサブフィルタである。
const scienceAndWorkRelatedSfOnly =
  selectPublicTimelineEvents({
    events: workRelatedEvents,
    catOff: {
      education: true,
      computer: true,
      culture: true,
      society: true,
    },
    sfOnly: true,
    importanceMin: 2,
    search: allSearch,
    categoryMatchMode: "related",
  });

assert.deepEqual(
  scienceAndWorkRelatedSfOnly.map(
    (event) => event.id
  ),
  [
    "work-related-non-sf",
    "work-related-sf",
    "work-primary-sf",
  ]
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

const subFilterEvents = [
  {
    id: "math",
    date: "2000",
    title: "数理",
    cats: ["science"],
    primary: "science",
    subs: ["math"],
    importance: 2,
  },
  {
    id: "rights",
    date: "2001",
    title: "人権",
    cats: ["society"],
    primary: "society",
    subs: ["politics", "rights"],
    importance: 2,
  },
  {
    id: "thought",
    date: "2002",
    title: "思想文学",
    cats: ["work"],
    primary: "work",
    subs: ["thought", "literature"],
    importance: 2,
  },
  {
    id: "sf-literature",
    date: "2003",
    title: "SF文学",
    cats: ["work", "sf"],
    primary: "work",
    subs: ["literature"],
    importance: 2,
  },
];

const selectSubFilters = (
  subFilters,
  options = {}
) =>
  selectPublicTimelineEvents({
    events: subFilterEvents,
    catOff: {},
    sfOnly: false,
    subFilters,
    importanceMin: 2,
    search: allSearch,
    ...options,
  });

assert.deepEqual(
  selectSubFilters(["thought", "rights"])
    .map((event) => event.id),
  ["rights", "thought"]
);

assert.deepEqual(
  selectSubFilters(
    ["rights"],
    { catOff: { society: true } }
  ).map((event) => event.id),
  []
);

assert.deepEqual(
  selectSubFilters(["literature"])
    .map((event) => event.id),
  ["thought"]
);

assert.deepEqual(
  selectSubFilters(
    ["literature"],
    { sfOnly: true }
  ).map((event) => event.id),
  ["sf-literature"]
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
  ["computer-standard"]
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
    date: "2001",
    title: "私の出来事",
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
    "computer-standard",
    "work-sf",
    "work-non-sf",
  ]
);

const personal = timelineList.find(
  (event) => event.id === "personal"
);

assert.equal(personal.age, 11);

const unprojectedTimelineList =
  buildTimelineEventList({
    publicEvents: events,
    personalEvents,
    showPersonal: true,
    birth: null,
    catOff: {},
    sfOnly: false,
    importanceMin: 2,
    search: allSearch,
  });

assert.equal(
  unprojectedTimelineList.every(
    (event) => event.age === null
  ),
  true
);

assert.equal(
  Object.prototype.hasOwnProperty.call(personal, "cat"),
  false
);
assert.deepEqual(personal.cats, ["me"]);
assert.equal(personal.primary, "me");
assert.equal(
  Object.prototype.hasOwnProperty.call(
    personal,
    "icon"
  ),
  false
);

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
  education: [],
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
assert.equal(lifeContext.birthConfigured, true);
assert.equal(lifeContext.projectionBirth, 1990);
assert.deepEqual(lifeContext.adultPeriodErrors, []);

const unprojectedLifeContext =
  buildTimelineLifeContext({
    birth: null,
    month: 0,
    education: [],
    adultPeriods: [
      {
        start: "2000",
        end: "2010",
        label: "未使用",
      },
    ],
  });

assert.equal(
  unprojectedLifeContext.birthConfigured,
  false
);
assert.equal(
  unprojectedLifeContext.projectionBirth,
  2101
);
assert.deepEqual(
  unprojectedLifeContext.adultPeriods,
  []
);
assert.deepEqual(
  unprojectedLifeContext.adultPeriodErrors,
  []
);
assert.equal(lifeContext.adultPeriods.length, 1);
assert.equal(lifeContext.adultPeriods[0].start, 2010);
assert.equal(lifeContext.adultPeriods[0].end, 2014);
assert.equal(lifeContext.adultPeriods[0].label, "第1期");

const invalidAdultPeriods =
  buildTimelineLifeContext({
    birth: 1990,
    month: 4,
    education: [],
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

const emptyAdultPeriods =
  buildTimelineLifeContext({
    birth: 1990,
    month: 4,
    education: [],
    adultPeriods: [],
  });

assert.deepEqual(emptyAdultPeriods.adultPeriods, []);
assert.deepEqual(emptyAdultPeriods.adultPeriodErrors, []);

const groupedEvents = [
  {
    id: "too-early",
    date: "1500",
    cats: ["science"],
    primary: "science",
  },
  {
    id: "pre",
    date: "1950",
    cats: ["science"],
    primary: "science",
  },
  {
    id: "elementary",
    date: "1997",
    cats: ["science"],
    primary: "science",
  },
  {
    id: "adult-before-period",
    date: "2009",
    cats: ["science"],
    primary: "science",
  },
  {
    id: "adult-period-start",
    date: "2010",
    cats: ["science"],
    primary: "science",
  },
  {
    id: "adult-period-end",
    date: "2014",
    cats: ["science"],
    primary: "science",
  },
  {
    id: "adult-after-period",
    date: "2015",
    cats: ["science"],
    primary: "science",
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
          { id: "public", primary: "science" },
          { id: "personal", primary: "me" },
        ],
      },
    ],
    searchText: "",
    closedStages: new Set(),
  });

assert.equal(personalVisibility.shown, 1);
assert.equal(personalVisibility.myShown, 1);


const controlTargets =
  buildTimelineControlTargets({
    groups: timelineGroups,
  });

assert.equal(
  controlTargets.allStageKeys.includes("elem"),
  true
);

assert.deepEqual(
  controlTargets.allEventIds,
  [
    "pre",
    "elementary",
    "adult-before-period",
    "adult-period-start",
    "adult-period-end",
    "adult-after-period",
  ]
);

console.log(
  "OK: 年表の検索・イベント統合・人生モデル・成人期検証・人生段階射影・表示集計を検査しました"
);
