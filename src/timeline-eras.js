export const BACKGROUND_ERAS = [
  {
    key: "early-modern-world",
    from: 1501,
    to: 1581,
    label: "大航海・宗教改革と近世世界の形成",
  },
  {
    key: "scientific-revolution",
    from: 1582,
    to: 1687,
    label: "科学革命と近代世界の形成",
  },
  {
    key: "enlightenment",
    from: 1688,
    to: 1788,
    label: "啓蒙と古典科学",
  },
  {
    key: "revolution-industry",
    from: 1789,
    to: 1847,
    label: "革命と産業化",
  },
  {
    key: "modern-science",
    from: 1848,
    to: 1900,
    label: "近代科学と産業社会",
  },
  {
    key: "early-20c",
    from: 1901,
    to: 1913,
    label: "20世紀世界の成立",
  },
  {
    key: "world-wars",
    from: 1914,
    to: 1945,
    label: "世界戦争と大衆社会",
  },
  {
    key: "postwar",
    from: 1946,
    to: 1972,
    label: "戦後体制・冷戦・科学技術社会",
  },
  {
    key: "information-coldwar",
    from: 1973,
    to: 1990,
    label: "情報化と後期冷戦",
  },
  {
    key: "internet-global",
    from: 1991,
    to: 2007,
    label: "インターネットとグローバル化",
  },
  {
    key: "smartphone-data",
    from: 2008,
    to: 2019,
    label: "スマートフォン・SNS・データ社会",
  },
  {
    key: "ai-postpandemic",
    from: 2020,
    to: Infinity,
    label: "AI・パンデミック後の世界",
  },
];

export const backgroundEraOf = (year) =>
  BACKGROUND_ERAS.find(
    (era) => year >= era.from && year <= era.to
  ) ?? null;

export const TIMELINE_START_YEAR = 1501;

export const preBirthPeriodsOf = (birthYear) => {
  const endYear = Number(birthYear) - 1;

  if (
    !Number.isFinite(endYear) ||
    endYear < TIMELINE_START_YEAR
  ) {
    return [];
  }

  const periods = [];
  const lastCentury =
    Math.floor((endYear - 1) / 100) + 1;

  const firstCentury =
    Math.floor((TIMELINE_START_YEAR - 1) / 100) + 1;

  for (
    let century = firstCentury;
    century <= lastCentury;
    century += 1
  ) {
    const centuryStart = (century - 1) * 100 + 1;

    const halves = [
      {
        key: "first",
        label: `${century}世紀前半`,
        from: centuryStart,
        to: centuryStart + 49,
      },
      {
        key: "second",
        label: `${century}世紀後半`,
        from: centuryStart + 50,
        to: centuryStart + 99,
      },
    ];

    for (const half of halves) {
      const from = Math.max(
        TIMELINE_START_YEAR,
        half.from
      );
      const to = Math.min(endYear, half.to);

      if (from <= to) {
        periods.push({
          key: `pre-${century}-${half.key}`,
          label: half.label,
          from,
          to,
        });
      }
    }
  }

  return periods;
};

export const JAPANESE_ERAS = [
  {
    key: "meiji",
    label: "明治",
    from: 1868,
    to: 1911,
  },
  {
    key: "taisho",
    label: "大正",
    from: 1912,
    to: 1925,
  },
  {
    key: "showa",
    label: "昭和",
    from: 1926,
    to: 1988,
  },
  {
    key: "heisei",
    label: "平成",
    from: 1989,
    to: 2018,
  },
  {
    key: "reiwa",
    label: "令和",
    from: 2019,
    to: Infinity,
  },
];

export const japaneseEraOf = (year) =>
  JAPANESE_ERAS.find(
    (era) => year >= era.from && year <= era.to
  ) ?? null;

export const HALF_CENTURY_MARKERS = [
  {
    key: "21c-first",
    label: "21世紀前半",
    from: 2001,
    to: 2050,
  },
];

export const halfCenturyMarkerOf = (year) =>
  HALF_CENTURY_MARKERS.find(
    (period) => year >= period.from && year <= period.to
  ) ?? null;
