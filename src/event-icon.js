// Public timeline icon selection.
//
// Principle:
// - If an event has multiple subs tags, the rarer tag in the current
//   public-data audit takes precedence.
// - Some tags then split into two visual subtypes.
// - If subs is empty, primary supplies a fallback icon.
// - Icons are derived at display time and are not stored in event TSV data.

export const SUB_ICON_PRIORITY = [
  "revolution", // 19
  "math",        // 26
  "art",         // 34
  "environment", // 36
  "space",       // 52
  "life",        // 54
  "thought",     // 54 (tie-break after life)
  "music",       // 59
  "economy",     // 61
  "visual",      // 70
  "war",         // 75
  "matter",      // 81
  "technology",  // 89
  "rights",      // 91
  "literature",  // 118
  "politics",    // 150
];

export const PUBLIC_EVENT_ICON_NAMES = new Set([
  "politics-japan",
  "politics-world",
  "literature-japan",
  "literature-world",
  "rights-expand",
  "rights-suppress",
  "technology-innovation",
  "technology-implementation",
  "matter-physics",
  "matter-material",
  "war",
  "visual-work",
  "visual-media",
  "economy",
  "music",
  "life-science",
  "life-health",
  "thought",
  "space",
  "environment",
  "art",
  "math",
  "revolution",
  "fallback-work",
  "fallback-science",
  "fallback-education",
  "fallback-computer",
  "fallback-culture",
  "fallback-society",
]);

const RIGHTS_SUPPRESS_IDS = new Set([
  "1518-atlantic-slave-trade-licenses",
  "1672-royal-african-company",
  "1685-revocation-edict-nantes",
  "1858-ansei-purge",
  "1915-armenian-genocide",
  "1925-peace-preservation-law",
  "1945-core75-09",
  "1937-nanjing-massacre",
  "1948-apartheid-state-policy",
  "1961-berlin-wall-construction",
  "1965-indonesia-mass-killings-suharto",
  "1968-prague-spring-invasion",
  "1973-chile-coup-pinochet",
  "1975-khmer-rouge-rule",
  "1989-tiananmen-crackdown",
  "1992-bosnian-war-srebrenica",
  "1994-rwanda-genocide",
  "2011-syria-war-displacement-assad-fall",
  "2021-taliban-kabul-takeover",
]);

const MATTER_MATERIAL_IDS = new Set([
  "1556-agricola-de-re-metallica",
  "1774-priestley-oxygen",
  "1789-lavoisier-elementary-chemistry",
  "1800-voltaic-pile",
  "1808-gay-lussac-combining-volumes",
  "1811-avogadro-hypothesis",
  "1828-wohler-urea-synthesis",
  "1856-bessemer-steel-process",
  "1869-mendeleev-periodic-system",
  "1886-hall-heroult-aluminum",
  "1898-curie-polonium-radium",
  "1904-fleming-valve",
  "1907-bakelite",
  "1911-onnes-superconductivity",
  "1913-core75-01",
  "1939-pauling-chemical-bond",
  "1947-core75-12",
  "1958-core75-17",
  "1960-mosfet-demonstration",
  "1965-moores-law",
  "1966-low-loss-optical-fiber",
  "1980-noyori-binap",
  "1985-buckminsterfullerene-c60",
  "1986-high-tc-superconductivity",
  "1987-nand-flash",
  "2004-graphene-isolation",
  "2019-euv-high-volume",
]);

const LIFE_HEALTH_IDS = new Set([
  "1796-jenner-smallpox-vaccination",
  "1846-ether-anesthesia-demonstration",
  "1847-semmelweis-handwashing",
  "1854-john-snow-cholera",
  "1882-1eoddmg",
  "1908-water-chlorination",
  "1918-core75-04",
  "1922-first-insulin-patient",
  "1928-v3n6qx",
  "1954-lucky-dragon-no5",
  "1956-minamata-official-recognition",
  "1960-core75-18",
  "1961-universal-health-pension",
  "1978-first-ivf-birth",
  "1980-core75-28",
  "1981-first-aids-report",
  "1986-163vwou",
  "1999-17pr3hn",
  "2000-long-term-care-insurance",
  "2011-au3xzt",
  "2020-13ara66",
  "2020-mrna-vaccine-first-approval",
]);

function eventSubs(event) {
  if (Array.isArray(event?.subs)) {
    return event.subs;
  }

  if (typeof event?.subs === "string") {
    return event.subs
      .split("|")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

function fallbackIcon(primary) {
  const name = `fallback-${primary}`;

  return PUBLIC_EVENT_ICON_NAMES.has(name)
    ? name
    : "fallback-work";
}

function hasJapan(event) {
  return String(event?.region ?? "").includes("日本");
}

export function resolvePublicEventIcon(event) {
  const subs = eventSubs(event);
  const selectedSub = SUB_ICON_PRIORITY.find(
    (sub) => subs.includes(sub)
  );

  if (!selectedSub) {
    return fallbackIcon(event?.primary);
  }

  switch (selectedSub) {
    case "politics":
      return hasJapan(event)
        ? "politics-japan"
        : "politics-world";

    case "literature":
      return hasJapan(event)
        ? "literature-japan"
        : "literature-world";

    case "rights":
      return RIGHTS_SUPPRESS_IDS.has(event?.id)
        ? "rights-suppress"
        : "rights-expand";

    case "technology":
      return event?.primary === "science"
        ? "technology-innovation"
        : "technology-implementation";

    case "matter":
      return MATTER_MATERIAL_IDS.has(event?.id)
        ? "matter-material"
        : "matter-physics";

    case "visual":
      return event?.primary === "computer"
        ? "visual-media"
        : "visual-work";

    case "life":
      return LIFE_HEALTH_IDS.has(event?.id)
        ? "life-health"
        : "life-science";

    default:
      return selectedSub;
  }
}
