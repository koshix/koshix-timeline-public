const GENERIC_WORK_PREFIXES = new Set([
  "映画",
  "映画版",
  "アニメ映画",
  "小説",
  "長編小説",
  "短編小説",
  "漫画",
  "テレビアニメ",
  "テレビドラマ",
  "ゲーム",
  "楽曲",
  "シングル",
  "アルバム",
]);

const ACTION_SUFFIX =
  /(?:を|が|の)?(?:劇場公開|一般公開|開発開始|運用開始|サービス開始|販売開始|刊行|発売|公開|発表|制作|設立|発足|開始|完成|公布|採択|承認|受賞|登場)$/;

function cleanText(value) {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .trim();
}

function stripActionSuffix(value) {
  return cleanText(value)
    .replace(ACTION_SUFFIX, "")
    .trim();
}

export function buildWikipediaQuery(
  title,
  fallbackQuery = ""
) {
  const source = cleanText(title);
  const fallback = cleanText(fallbackQuery);

  if (!source) return fallback;

  // 『作品名』を持つ項目では、
  // 人名 + 作品名程度まで検索語を絞る。
  const quoted = source.match(
    /^(.*?)『([^』]+)』/
  );

  if (quoted) {
    const rawPrefix = cleanText(quoted[1]);
    const workTitle = cleanText(quoted[2]);

    const prefix = GENERIC_WORK_PREFIXES.has(rawPrefix)
      ? ""
      : stripActionSuffix(rawPrefix);

    return cleanText(
      [prefix, workTitle].filter(Boolean).join(" ")
    );
  }

  // 説明的な後半節はWikipedia検索には過剰なので落とす。
  const firstClause =
    source.split(/[、，]/, 1)[0];

  const compact = stripActionSuffix(
    firstClause
  )
    .replace(/[「」『』]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return compact || fallback;
}
