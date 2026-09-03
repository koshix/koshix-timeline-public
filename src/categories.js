export const CAT = {
  // 7大分類は虹色順。bg=選択時・年表、soft=通常時、border=枠線、fg=選択時文字。
  work:      { label: "作品", bg: "#C83F49", fg: "#FFFFFF", soft: "#F9E1E4", border: "#A92E37" },
  science:   { label: "科学", bg: "#D8751A", fg: "#FFFFFF", soft: "#FAE6D1", border: "#B65A10" },
  education: { label: "教育", bg: "#D0A000", fg: "#FFFFFF", soft: "#FBF2C9", border: "#A47E00" },
  computer:  { label: "情報", bg: "#34844F", fg: "#FFFFFF", soft: "#E5F4E9", border: "#286D40" },
  culture:   { label: "文化", bg: "#3779BC", fg: "#FFFFFF", soft: "#E5F0FA", border: "#2A6198" },
  society:   { label: "社会", bg: "#4B56A6", fg: "#FFFFFF", soft: "#E4E6F5", border: "#3C478D" },
  me:        { label: "自分", bg: "#7A4FA3", fg: "#FFFFFF", soft: "#EEE4F5", border: "#663D8B" },

  // SFは大分類ではなく、作品を強調するタグとして保持する。
  sf:        { label: "SF", bg: "#8B1E2D", fg: "#FFFFFF", soft: "#F7DDE1", border: "#761825" },

  // 松尾版データとの暫定互換。新カテゴリーと同じ配色に投影する。
  tech:      { label: "実テクノロジー", bg: "#34844F", fg: "#FFFFFF", soft: "#E5F4E9", border: "#286D40" },
  music:     { label: "音楽・カルチャー", bg: "#3779BC", fg: "#FFFFFF", soft: "#E5F0FA", border: "#2A6198" },
};

// v0.1では松尾版の旧カテゴリーを新カテゴリーへ暫定投影する
export const CAT_ALIAS = {
  tech: "computer",
  music: "culture",
};

export const normalizeCatKey = (key) => CAT_ALIAS[key] || key;

// 1つの出来事は複数カテゴリーに所属できる。
// 旧形式の cat にも当面対応する。
export const catsOf = (event) => {
  const raw =
    Array.isArray(event.cats) && event.cats.length
      ? event.cats
      : (event.cat ? [event.cat] : []);

  return [...new Set(raw.map(normalizeCatKey))];
};

// アイコン色などに使う主分類
export const primaryCatOf = (event) =>
  normalizeCatKey(
    event.primary ||
    event.cat ||
    catsOf(event)[0] ||
    "society"
  );

export const catKey = (event) => primaryCatOf(event);
