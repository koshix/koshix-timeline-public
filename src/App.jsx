import { useState, useMemo, useEffect, useRef } from "react";
import { loadEvents } from "./events-source";
import { loadConfig } from "./config-source";
import { loadPrivateEvents } from "./private-events-source";
import {
  parsePersonalEventsTsv,
  serializePersonalEventsTsv,
} from "./personal-events-tsv";
import {
  loadBrowserPersonalEvents,
  saveBrowserPersonalEvents,
  clearBrowserPersonalEvents,
} from "./personal-events-store";
import { applyEventCustomizations } from "./event-customizations";
import {
  parseEventCustomizationsTsv,
  serializeEventCustomizationsTsv,
} from "./event-customizations-tsv";
import {
  EMPTY_EVENT_CUSTOMIZATIONS,
  loadBrowserEventCustomizations,
  saveBrowserEventCustomizations,
  clearBrowserEventCustomizations,
} from "./event-customizations-store";
import { THREADS } from "./threads";
import {
  GRADUATE_TYPES,
  HIGHER_ED_TYPES,
  buildLifeModel,
  migrateEducationSettings,
} from "./life-stages";

const CONFIG = loadConfig();
const PROFILE_DEFAULTS = CONFIG.defaults || {};
const EVENTS = loadEvents();

// ---- ラインアイコン(全て自作SVG・権利フリー) ----
const ICON_NAMES = new Set([
  "book", "tv", "film", "robot", "watch",
  "comm", "computer", "chip", "globe", "satellite",
  "rocket", "hmd", "gamepad", "phone", "video",
  "ai", "ghost", "music", "wifi", "flag",
]);

function Icon({ name, color, size = 18 }) {
  const iconName = ICON_NAMES.has(name) ? name : "book";

  return (
    <svg
      viewBox="0 0 24 24" width={size} height={size}
      fill="none" stroke={color} strokeWidth="1.7"
      strokeLinecap="round" strokeLinejoin="round"
      style={{ flexShrink: 0, marginTop: 2 }}
      aria-hidden="true"
    >
      <use href={`${import.meta.env.BASE_URL}icons.svg#icon-${iconName}`} />
    </svg>
  );
}


function ImportanceBadge({ level }) {
  const value = Math.max(1, Math.min(3, Number(level) || 2));

  return (
    <span
      role="img"
      aria-label={`重要度 L${value}`}
      title={`重要度 L${value}`}
      style={{
        display: "inline-flex",
        alignItems: "flex-end",
        gap: 2,
        width: 14,
        height: 13,
        flexShrink: 0,
        marginTop: 3,
      }}
    >
      {[1, 2, 3].map((bar) => (
        <span
          key={bar}
          aria-hidden="true"
          style={{
            display: "block",
            width: 3,
            height: 10,
            borderRadius: 1,
            background: bar <= value ? "#59616c" : "#d8dce2",
          }}
        />
      ))}
    </span>
  );
}


// ---- 分野(興味に応じてオン・オフできるフィルタの単位) ----
// PC・ワークステーション・ミニコン・メインフレームは「コンピューター」にまとめている
const SUBS = {
  pc: { label: "コンピューター", c: "tech" },
  ai: { label: "AI", c: "tech" },
  net: { label: "ネット・インフラ", c: "tech" },
  sns: { label: "SNS・ネット文化", c: "tech" },
  mobile: { label: "モバイル・通信", c: "tech" },
  game: { label: "ゲーム", c: "tech" },
  inst: { label: "楽器・DTM", c: "tech" },
  audio: { label: "オーディオ", c: "tech" },
  video: { label: "映像・カメラ・CG", c: "tech" },
  wear: { label: "ウェアラブル", c: "tech" },
  tablet: { label: "タブレット・電子書籍", c: "tech" },
  xr: { label: "VR・AR", c: "tech" },
  robot: { label: "ロボット", c: "tech" },
  space: { label: "宇宙・測位", c: "tech" },
  quantum: { label: "量子", c: "tech" },
  boom: { label: "ブーム・社会現象", c: "tech" },
  other: { label: "その他", c: "tech" },
  artist_w: { label: "洋楽アーティスト", c: "music" },
  artist_j: { label: "邦楽アーティスト", c: "music" },
};

// 旧データ用のフォールバック(sを持たない項目はアイコンから分野を推定する)
const SUB_BY_IC = {
  computer: "pc", chip: "pc", ai: "ai", globe: "net", wifi: "net", phone: "mobile",
  gamepad: "game", music: "inst", video: "video", film: "video", tv: "video",
  watch: "wear", comm: "wear", hmd: "xr", robot: "robot", satellite: "space",
  rocket: "space", ghost: "other", book: "other",
};
const subOf = (e) => e.s || SUB_BY_IC[e.ic] || "other";

const ADULT_STAGE = { key: "adult", label: "社会人", color: "#37414f", bg: "#eef1f5" };

// ---- 社会人の年齢ラベル色 ----
// 30代は従来色を保ち、10歳ごとに少しずつ無彩色・明色側へ移す。
// 70代以降は背景が明るくなるため、文字色を濃いグレーに切り替えて可読性を保つ。
const ADULT_AGE_BADGE = [
  { from: 90, bg: "#e2e4e6", fg: "#4d535a" }, // 90代以降: 淡いシルバー
  { from: 80, bg: "#d0d3d6", fg: "#454b52" }, // 80代: 明るいシルバー
  { from: 70, bg: "#bcc0c4", fg: "#343a40" }, // 70代: シルバー
  { from: 60, bg: "#9ca2a9", fg: "#ffffff" }, // 60代: グレー
  { from: 50, bg: "#7a828c", fg: "#ffffff" }, // 50代: さらに薄い灰青
  { from: 40, bg: "#56606c", fg: "#ffffff" }, // 40代: 少し薄い灰青
  { from: 0,  bg: "#37414f", fg: "#ffffff" }, // 30代まで: 従来色
];

const gradeBadgeStyle = (stage, age) => {
  if (stage?.key !== "adult" && stage?.key !== "retired") {
    return { background: stage?.color || ADULT_STAGE.color, color: "#ffffff" };
  }
  const tone = ADULT_AGE_BADGE.find((x) => age >= x.from) || ADULT_AGE_BADGE.at(-1);
  return { background: tone.bg, color: tone.fg };
};

// ---- 社会人と生まれる前は長くなりすぎるので、技術史の時代でさらに区切る ----
const ERAS = [
  { key: "recovery",   label: "戦後復興期",                         to: 1954 },
  { key: "growth",     label: "高度経済成長期",                     to: 1973 },
  { key: "stable",     label: "安定成長・情報化前夜",               to: 1988 },
  { key: "postcold",   label: "冷戦終結・ネット黎明",     to: 2000 },
  { key: "broadband",  label: "ブロードバンド・Web時代",            to: 2007 },
  { key: "smartphone", label: "スマートフォン・SNS時代",            to: 2019 },
  { key: "pandemic",   label: "パンデミック期",                     to: 2021 },
  { key: "genai",      label: "生成AI時代",                         to: Infinity },
];
const eraOf = (y) => ERAS.find((e) => y <= e.to);
const SPLIT_STAGES = new Set(["pre", "adult", "retired"]);

function formatEventDate(value) {
  const [year, month, day] = String(value ?? "").split("-");
  if (!year) return "";
  return `${Number(year)}年${month ? `${Number(month)}月` : ""}${day ? `${Number(day)}日` : ""}`;
}

// ---- 最近の追加(aフィールドの日付が新しいものを拾う) ----
const RECENT = (() => {
  const dated = EVENTS.filter((e) => e.a);
  if (!dated.length) return null;
  const latest = dated.reduce((m, e) => (e.a > m ? e.a : m), "");
  const items = dated.filter((e) => e.a === latest).sort((x, y) => x.y - y.y);
  // 年代が偏らないよう、範囲全体から等間隔に抜き出して見出しに出す
  const N = Math.min(6, items.length);
  const picks = Array.from({ length: N }, (_, i) =>
    items[Math.round((i * (items.length - 1)) / Math.max(1, N - 1))]
  );
  return { date: latest, items, picks };
})();

// ---- 最近の新機能(手で追記する) ----
const FEATURES = [];

// ---- 共有 ----
const APP_TITLE = CONFIG.title || "自分史プロジェクション";
const HASHTAG = CONFIG.hashtag ?? "#自分史プロジェクション";
const DOWNLOAD_URL = String(CONFIG.downloadUrl || "").trim();

const SHARE_URL = (() => {
  const configured = String(CONFIG.shareUrl || "").trim();

  if (configured) {
    return configured;
  }

  if (typeof window === "undefined") {
    return "";
  }

  const { origin, pathname } = window.location;
  return origin + pathname;
})();

// 項目の識別子。共有URLに載るのでASCIIのみ(全角カッコや空白が入ると、
// 貼り付け先の自動リンク化で末尾が欠けてリンクが壊れる)
// TSVに保存された id を永久IDとして使う。
// idを持たない一時的な個人イベント等だけ従来方式でIDを生成する。
const legacyEid = (e) => {
  const s = `${e.y}-${e.t}`;
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h * 33) ^ s.charCodeAt(i)) >>> 0;
  return `${e.y}-${h.toString(36)}`;
};

const eid = (e) => e.id || legacyEid(e);

// ?e= の値から項目を探す。旧形式(年-タイトル)のリンクも救済する。
// 旧形式は括弧や空白を含むため、貼り付け先で末尾が欠けたり全角に変換されることがあるので、
// NFKC正規化して空白を落としたうえで前方一致も見る
const norm = (s) => s.normalize("NFKC").replace(/\s+/g, "").toLowerCase();
const findByShareParam = (raw) => {
  if (!raw) return null;
  let dec = raw;
  try { dec = decodeURIComponent(raw); } catch {}
  const key = norm(dec);
  return (
    EVENTS.find((e) => eid(e) === dec) ||
    EVENTS.find((e) => norm(`${e.y}-${e.t}`) === key) ||
    EVENTS.find((e) => key.length > 6 && norm(`${e.y}-${e.t}`).startsWith(key)) ||
    null
  );
};

// Xの文字数計算に合わせた重み(全角2・半角1)。URLは長さに関わらず23として扱われる
const weigh = (s) => [...s].reduce((n, c) => n + (/[\x00-\x7e]/.test(c) ? 1 : 2), 0);
const clipTo = (s, budget) => {
  if (weigh(s) <= budget) return s;
  let out = "", w = 0;
  for (const c of [...s]) {
    const cw = /[\x00-\x7e]/.test(c) ? 1 : 2;
    if (w + cw > budget - 2) break; // 末尾の「…」の分を残す
    out += c;
    w += cw;
  }
  return out.replace(/[、。]$/, "") + "…";
};

function ShareBar({ text, url = SHARE_URL, compact = false, small = false, color = "#37414f", note, labelOnly = false }) {
  const [copiedAll, setCopiedAll] = useState(false);
  const t = encodeURIComponent(text);
  const u = encodeURIComponent(url);
  const targets = [
    ["X", `https://x.com/intent/post?text=${t}&url=${u}`],
    ["Bluesky", `https://bsky.app/intent/compose?text=${encodeURIComponent(`${text} ${url}`)}`],
    ...(compact
      ? []
      : [
          ["Facebook", `https://www.facebook.com/sharer/sharer.php?u=${u}`],
          ["LINE", `https://social-plugins.line.me/lineit/share?url=${u}&text=${t}`],
        ]),
  ];
  // 解説つきの投稿文。280(Xの上限)からURL分23と本文を引いた残りに解説を収める
  const head = text.replace(` ${HASHTAG}`, "");
  const room = 280 - 23 - weigh(head) - weigh(HASHTAG) - 5; // 改行3つ分と余裕
  const noteText = note ? `${head}\n\n${clipTo(note, Math.max(40, room))}\n${HASHTAG}` : "";
  const fullText = note ? `${head}\n\n${note}\n${HASHTAG}` : "";
  const copyTo = async (s, setter) => {
    try {
      await navigator.clipboard.writeText(s);
      setter(true);
      setTimeout(() => setter(false), 1600);
    } catch {}
  };
  const base = {
    fontSize: compact || small ? 11 : 11.5, fontWeight: 700, textDecoration: "none",
    borderRadius: labelOnly ? 0 : 999,
    padding: labelOnly ? "2px 3px" : (compact || small ? "3px 10px" : "4px 12px"),
    border: labelOnly ? "none" : `1px solid ${color}44`,
    background: labelOnly ? "transparent" : "#ffffffaa",
    color,
    cursor: "pointer", lineHeight: 1.6, fontFamily: "inherit",
  };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
        {note && <span style={{ fontSize: 10.5, color: "#9aa0a8", flexShrink: 0 }}>タイトルのみ</span>}
        {targets.map(([label, href]) => (
          <a key={label} href={href} target="_blank" rel="noopener noreferrer" style={base}>
            {labelOnly ? (label === "LINE" ? "Line" : label) : `${label}で共有`}
          </a>
        ))}
      </div>
      {note && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
          <span style={{ fontSize: 10.5, color: "#9aa0a8", flexShrink: 0 }}>解説つき</span>
          <a
            href={`https://x.com/intent/post?text=${encodeURIComponent(noteText)}&url=${u}`}
            target="_blank" rel="noopener noreferrer" style={base}
          >
            Xに投稿
          </a>
          <a
            href={`https://bsky.app/intent/compose?text=${encodeURIComponent(`${noteText}\n${url}`)}`}
            target="_blank" rel="noopener noreferrer" style={base}
          >
            Blueskyに投稿
          </a>
          <button onClick={() => copyTo(`${fullText}\n${url}`, setCopiedAll)} style={base}>
            {copiedAll ? "コピーしました" : "解説を全文コピー"}
          </button>
        </div>
      )}
    </div>
  );
}

const CAT = {
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
const CAT_ALIAS = {
  tech: "computer",
  music: "culture",
};

const normalizeCatKey = (k) => CAT_ALIAS[k] || k;

// 1つの出来事は複数カテゴリーに所属できる。
// 旧形式の cat にも当面対応する。
const catsOf = (e) => {
  const raw =
    Array.isArray(e.cats) && e.cats.length
      ? e.cats
      : (e.cat ? [e.cat] : []);

  return [...new Set(raw.map(normalizeCatKey))];
};

// アイコン色などに使う主分類
const primaryCatOf = (e) =>
  normalizeCatKey(
    e.primary ||
    e.cat ||
    catsOf(e)[0] ||
    "society"
  );

const catKey = (e) => primaryCatOf(e);

// ---- 年表内検索 ----
// NFKCで全角・半角差を吸収し、英字は大文字小文字を区別しない。
const normalizeSearchText = (value) =>
  String(value ?? "").normalize("NFKC").toLowerCase();

// &&、||、丸括弧を使う論理検索。空白・読点・カンマは従来どおりANDとして扱う。
// 優先順位は && > ||。丸括弧で明示的にまとまりを指定できる。
const tokenizeSearchQuery = (value) => {
  const input = normalizeSearchText(value)
    .replace(/[、,]+/g, " ")
    .replace(/&&/g, " && ")
    .replace(/\|\|/g, " || ")
    .replace(/\(/g, " ( ")
    .replace(/\)/g, " ) ")
    .trim();

  if (!input) return [];

  const raw = input.split(/\s+/).filter(Boolean);
  const tokens = [];
  const isOperandEnd = (token) =>
    token && token !== "&&" && token !== "||" && token !== "(";
  const isOperandStart = (token) =>
    token && token !== "&&" && token !== "||" && token !== ")";

  for (const token of raw) {
    const prev = tokens.at(-1);
    if (isOperandEnd(prev) && isOperandStart(token)) {
      tokens.push("&&");
    }
    tokens.push(token);
  }
  return tokens;
};

const parseSearchExpression = (value) => {
  const tokens = tokenizeSearchQuery(value);
  if (!tokens.length) return { root: null, error: null };

  let pos = 0;

  const parsePrimary = () => {
    const token = tokens[pos];
    if (token === "(") {
      pos += 1;
      const node = parseOr();
      if (tokens[pos] !== ")") throw new Error("missing )");
      pos += 1;
      return node;
    }
    if (!token || token === ")" || token === "&&" || token === "||") {
      throw new Error("term expected");
    }
    pos += 1;
    return { type: "term", value: token };
  };

  const parseAnd = () => {
    let node = parsePrimary();
    while (tokens[pos] === "&&") {
      pos += 1;
      node = { type: "and", left: node, right: parsePrimary() };
    }
    return node;
  };

  const parseOr = () => {
    let node = parseAnd();
    while (tokens[pos] === "||") {
      pos += 1;
      node = { type: "or", left: node, right: parseAnd() };
    }
    return node;
  };

  try {
    const root = parseOr();
    if (pos !== tokens.length) throw new Error("unexpected token");
    return { root, error: null };
  } catch {
    return { root: null, error: "検索式を確認してください" };
  }
};

const matchesSearchExpression = (node, haystack) => {
  if (!node) return true;
  if (node.type === "term") return haystack.includes(node.value);
  if (node.type === "and") {
    return matchesSearchExpression(node.left, haystack) &&
      matchesSearchExpression(node.right, haystack);
  }
  return matchesSearchExpression(node.left, haystack) ||
    matchesSearchExpression(node.right, haystack);
};

// ---- テーマの糸(年表に散らばった項目を、一本の流れとして自動再生する) ----
// 新しい定義は永久ID { id } で参照する。
// 旧 threads.js の { y, m } 形式も移行中は読み込めるようにしておく。
const resolveThreadItem = ({ id, y, m }) => {
  if (id) {
    return EVENTS.find((e) => e.id === id);
  }
  return EVENTS.find((e) => e.y === y && e.t.includes(m));
};

const THREAD_LIST = THREADS.map((th) => ({
  ...th,
  events: th.items.map(resolveThreadItem).filter(Boolean),
})).filter((th) => th.events.length > 1);

const findThread = (key) => THREAD_LIST.find((t) => t.key === key) || null;

// 読み上げに使う日本語の声(環境になければ既定の声のまま)
const jpVoice = () => {
  try {
    return window.speechSynthesis.getVoices().find((v) => /ja[-_]JP/i.test(v.lang)) || null;
  } catch {
    return null;
  }
};

// 読み上げ用のテキスト。
// 型番のハイフン(PC-8801など)は音声合成が「の」と読んでしまうので、前後が英数字なら詰めて、
// それ以外のダッシュ類は空白にして読ませない(長音符「ー」は残す)
const DASH = /[-‐‑‒–—―]/;
// 文中のダッシュ(——)は、読み上げでは半拍おく合図として扱う
export const PAUSE = "\u241f";
const deDash = (s) =>
  s
    .replace(new RegExp(`([A-Za-z0-9])${DASH.source}([A-Za-z0-9])`, "g"), "$1$2")
    .replace(new RegExp(`${DASH.source}{2,}`, "g"), PAUSE)
    .replace(new RegExp(DASH.source, "g"), " ");
// 音声合成が読み違える語は、読みを当てておく(気づいたものを足していく)
const READINGS = {
  年表: "ネンピョウ",
  Copilot: "コパイロット",
  "Mac OS X": "マックオーエス テン",
  VOCALOID: "ボーカロイド",
  MEIKO: "メイコ",
  KAITO: "カイト",
  VISOR: "バイザー",
  Visor: "バイザー",
  MessagePad: "メッセージパッド",
  PalmPilot: "パームパイロット",
  小穴: "コアナ",
  MIDI: "ミディ",
  原型: "ゲンケイ",
  ILM: "アイエルエム",
  自撮り: "ジドリ",
  生成物: "セイセイブツ",
  SynthID: "シンスアイディー",
  河口洋一郎: "カワグチヨウイチロウ",
  松尾公也: "マツオコウヤ",
  年振り: "ねんぶり",
  人造物: "ジンゾウブツ",
  読唇: "ドクシン",
  三原則: "サンゲンソク",
  ChatGPT: "チャットジーピーティー",
  脱け: "ヌケ",
  富田倫生: "トミタミチオ",
  "Raspberry Pi": "ラズベリーパイ",
  "DOS/V": "ドスブイ",
  鴻海: "ホンハイ",
  Altair: "アルテア",
  の上で: "ノウエデ",
  的な: "テキナ",
  経験値: "ケイケンチ",
  系統樹: "ケイトウジュ",
  "The Elder Scrolls": "ジ・エルダー・スクロールズ",
  NVIDIA: "エヌビディア",
  eスポーツ: "イースポーツ",
  eコマース: "イーコマース",
  伺か: "ウカガカ",
  "US Robotics": "ユーエス・ロボティクス",
  Courier: "クーリエ",
  "3Com": "スリーコム",
  バベル魚: "バベルフィッシュ",
  文化女中器: "ブンカジョチュウキ",
  伊集院光: "イジュウインヒカル",
  伊達杏子: "ダテキョウコ",
  VTuber: "ブイチューバー",
  // 「数〜」は「かず」と読まれがちなので、本文に出てくる形をまとめて指定する
  数万人: "スウマンニン",
  数千人: "スウセンニン",
  数百万人: "スウヒャクマンニン",
  数億人: "スウオクニン",
  数千機: "スウセンキ",
  数小節: "スウショウセツ",
  数十万: "スウジュウマン",
  数千万: "スウセンマン",
  数百万: "スウヒャクマン",
  数百億: "スウヒャクオク",
  数万年: "スウマンネン",
  数千年: "スウセンネン",
  数十年: "スウジュウネン",
  数十秒: "スウジュウビョウ",
  数時間: "スウジカン",
  数社: "スウシャ",
  数人: "スウニン",
  数年: "スウネン",
  数秒: "スウビョウ",
  数分: "スウフン",
  数万: "スウマン",
  数千: "スウセン",
  数ミリ: "スウミリ",
  数十センチ: "スウジュッセンチ",
  弾けなくても: "ヒケナクテモ",
  DAW: "ディーエーダブリュー",
  この年: "コノトシ",
  Splendor: "スプレンダー",
  splendor: "スプレンダー",
  PARC: "パーク",
  "Synthesizer V": "シンセサイザーブイ",
  "I/O": "アイオー",
  "I'm perfect": "アイム・パーフェクト",
  "Z・X・C・V": "ゼット、エックス、シー、ブイ",
  ARPANET: "アーパネット",
  "TCP/IP": "ティーシーピーアイピー",
  JUNET: "ジェイユーネット",
  "NIFTY-Serve": "ニフティーサーブ",
  "バーナーズ=リー": "バーナーズリー",
  "2-Way": "ツーウェイ",
  方だ: "ホウダ",
  一文字: "イチモジ",
  一文で: "イチブンデ",
  Museum: "ミュージアム",
  museum: "ミュージアム",
  Duplex: "デュープレックス",
  Google: "グーグル",
  google: "グーグル",
  映像付き: "エイゾウツキ",
  人間の方: "ニンゲンノホウ",
  macOS: "マックオーエス",
  aibo: "アイボ",
  AIBO: "アイボ",
};
// 単独のローマ数字(MUSIC I、Apple II、ドラゴンクエストIV など)は「アイ」ではなく数として読ませる。
// UNIXやASCIIの中のIやXを拾わないよう、前後に英字がない場合だけ置き換える(DOS/Vなどの「/」直後も除外。
// Xは単独だとJIS XやX端末と紛らわしいので、対象から外してREADINGSで個別に見る)
const ROMAN = {
  I: "ワン", II: "ツー", III: "スリー", IV: "フォー", V: "ファイブ", VI: "シックス",
  VII: "セブン", VIII: "エイト", IX: "ナイン", XI: "イレブン", XII: "トゥエルブ",
  XIII: "サーティーン", XIV: "フォーティーン", XV: "フィフティーン",
};
const ROMAN_RE = new RegExp(
  `(^|[^A-Za-z/_])(${Object.keys(ROMAN).sort((a, b) => b.length - a.length).join("|")})(?![A-Za-z'/])`,
  "g"
);
// 単独の略語も読みを当てる(AIは「アイ」と読まれてしまうため)。OpenAIのように語の一部なら触らない
const ABBR = { AI: "エーアイ", AGI: "エージーアイ", X1: "エックスワン", goo: "グー" };
const ABBR_RE = new RegExp(
  `(^|[^A-Za-z0-9])(${Object.keys(ABBR).sort((a, b) => b.length - a.length).join("|")})(?![A-Za-z0-9])`,
  "g"
);
// 見出し語の読みは元の表記のまま当て(ハイフンを詰める前に実行する)、
// ローマ数字と略語の規則はそのあとで見る
const applyReadings = (s) => Object.entries(READINGS).reduce((t, [k, v]) => t.split(k).join(v), s);
const applyTokens = (s) =>
  s.replace(ROMAN_RE, (_, pre, r) => pre + ROMAN[r]).replace(ABBR_RE, (_, pre, a) => pre + ABBR[a]);
// 括弧の中の補足(年号や原語表記)は読み飛ばす
const dropParens = (s) => s.replace(/[((][^))]*[))]/g, "").replace(/[、,]\s*。/g, "。");
const speakText = (ev) =>
  applyTokens(deDash(applyReadings(dropParens(`${ev.y}年。${ev.t}。${ev.n || ""}`))));

// 読み上げは文の切れ目で小分けにして順に渡す。長い文章を一度に渡すと、
// 途中で打ち切られたり読み終わりの合図が来なくなるブラウザがあるため。
// pause が立っている区切りのあとには一拍おく(本文の「——」の位置)
const SEG_MAX = 110;
const splitSentences = (t) =>
  (t.match(/[^。!?！？]*[。!?！？]?/g) || [])
    .filter(Boolean)
    .flatMap((sn) =>
      [...sn].length > SEG_MAX * 1.6
        ? sn.split("、").map((x, i, a) => (i < a.length - 1 ? x + "、" : x)).filter(Boolean)
        : sn
    );
const speakSegments = (text) => {
  const out = [];
  const chunks = text.split(PAUSE);
  chunks.forEach((chunk, ci) => {
    const t = chunk.trim();
    if (t) {
      let buf = "";
      for (const sn of splitSentences(t)) {
        if (buf && [...(buf + sn)].length > SEG_MAX) {
          out.push({ t: buf, pause: false });
          buf = sn;
        } else buf += sn;
      }
      if (buf) out.push({ t: buf, pause: false });
    }
    if (ci < chunks.length - 1 && out.length) out[out.length - 1].pause = true;
  });
  return out;
};

// 背景に流す同時代の項目の色(暗い画面で読めるよう、カテゴリー色を明るくしたもの)
const BG_COLOR = {
  sf: "#EE8F97",
  science: "#F0A35D",
  education: "#E5C74F",
  computer: "#7DBF91",
  culture: "#80AFE0",
  society: "#8D97D8",
  me: "#B18AD0",
  tech: "#7DBF91",
  music: "#80AFE0",
};
const BG_ROWS = 7;

// 文単位に分けて順に読み上げる。戻り値を呼ぶと止まる
const speakChunks = (text, { rate = 1, onEnd } = {}) => {
  const synth = typeof window !== "undefined" && window.speechSynthesis;
  if (!synth) return () => {};
  const segs = speakSegments(text);
  const voice = jpVoice();
  let stopped = false, timer = null, watchdog = null;
  // 長い読み上げが勝手に止まるブラウザ対策(定期的に再開をつつく)
  const keepAlive = setInterval(() => {
    try { synth.resume(); } catch {}
  }, 8000);
  const stop = () => {
    stopped = true;
    clearTimeout(timer);
    clearTimeout(watchdog);
    clearInterval(keepAlive);
    synth.cancel();
  };
  const speakFrom = (i) => {
    if (stopped) return;
    if (i >= segs.length) {
      clearInterval(keepAlive);
      onEnd?.();
      return;
    }
    const seg = segs[i];
    const u = new SpeechSynthesisUtterance(seg.t);
    u.lang = "ja-JP";
    u.rate = rate;
    if (voice) u.voice = voice;
    let settled = false;
    const done = () => {
      if (settled || stopped) return;
      settled = true;
      clearTimeout(watchdog);
      timer = setTimeout(() => speakFrom(i + 1), seg.pause ? 500 / rate : 0);
    };
    u.onend = done;
    u.onerror = done;
    synth.speak(u);
    // 読み終わりの合図が来ない場合でも止まらないよう、長さから見積もって打ち切る
    watchdog = setTimeout(done, ([...seg.t].length * 260 + 5000) / rate);
  };
  synth.cancel();
  speakFrom(0);
  return stop;
};

// 同時に喋るのは一つだけにする。割り込まれた側にはonCancelで知らせる
let active = null;
const stopSpeaking = () => {
  const a = active;
  active = null;
  if (!a) return;
  a.cancel();
  a.onCancel?.();
};
const startSpeaking = (text, { rate = 1, onEnd, onCancel } = {}) => {
  stopSpeaking();
  const entry = { onCancel };
  entry.cancel = speakChunks(text, {
    rate,
    onEnd: () => {
      if (active === entry) active = null;
      onEnd?.();
    },
  });
  active = entry;
  // 呼び出し側から止めるときは、割り込み扱いにしない
  return () => {
    if (active === entry) active = null;
    entry.cancel();
  };
};

// 項目ごとの読み上げボタン(記事を書くときの読み合わせにも使える)
function SpeakButton({ ev, rate, color }) {
  const [on, setOn] = useState(false);
  const stopRef = useRef(null);
  useEffect(() => () => stopRef.current?.(), []);
  const toggle = () => {
    if (on) {
      stopRef.current?.();
      stopRef.current = null;
      setOn(false);
      return;
    }
    const off = () => {
      stopRef.current = null;
      setOn(false);
    };
    stopRef.current = startSpeaking(speakText(ev), { rate, onEnd: off, onCancel: off });
    setOn(true);
  };
  return (
    <button
      onClick={toggle}
      style={{
        fontSize: 11.5, fontWeight: 700, cursor: "pointer", padding: "3px 12px",
        borderRadius: 999, border: `1px solid ${color}44`,
        background: on ? color : "#ffffffaa", color: on ? "#fff" : color,
      }}
    >
      {on ? "■ 停止" : "🔊 読み上げ"}
    </button>
  );
}

function Theater({ thread, gradeLabel, birth, tts, setTts, speed, setSpeed, onClose }) {
  const evs = thread.events;
  const [idx, setIdx] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [done, setDone] = useState(false);
  const listRef = useRef(null);

  const font =
    '"Hiragino Kaku Gothic ProN", "Hiragino Sans", "Yu Gothic Medium", "Noto Sans JP", sans-serif';
  const mono = 'ui-monospace, "SF Mono", Menlo, Consolas, monospace';

  const go = (i) => {
    setDone(false);
    setIdx(Math.max(0, Math.min(evs.length - 1, i)));
  };

  // 自動送り。読み上げが有効なら読み終わりで、無効なら文字数に応じた時間で次へ
  useEffect(() => {
    if (!playing || done) return;
    const next = () => {
      if (idx + 1 < evs.length) setIdx(idx + 1);
      else {
        setDone(true);
        setPlaying(false);
      }
    };
    const text = speakText(evs[idx]);
    if (tts && typeof window !== "undefined" && window.speechSynthesis) {
      return startSpeaking(text, { rate: speed, onEnd: next });
    }
    const ms = Math.min(16000, 1800 + [...text.split(PAUSE).join("")].length * 70) / speed;
    const timer = setTimeout(next, ms);
    return () => clearTimeout(timer);
  }, [idx, playing, done, tts, speed, evs]);

  // 現在の項目を画面の中央へ送る(これが「自動スクロール」の見え方になる)
  useEffect(() => {
    listRef.current?.querySelector(`[data-i="${idx}"]`)?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  }, [idx]);

  // 開いている間は背後の年表を動かさない
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
      else if (e.key === " ") {
        e.preventDefault();
        setPlaying((p) => !p);
      } else if (e.key === "ArrowRight" || e.key === "ArrowDown") go(idx + 1);
      else if (e.key === "ArrowLeft" || e.key === "ArrowUp") go(idx - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [idx, onClose]);

  const gradeOf = (ev) =>
    ev.y < birth ? "生まれる前" : gradeLabel(ev.y);

  // 背景の左右に流す、同じころの別カテゴリーの項目(その糸に入っているものは除く)。
  // 何が同時に起きていた時代なのかを、読まなくても感じられるようにするための層
  const bgRows = useMemo(() => {
    const inThread = new Set(evs.map(eid));
    const year = evs[idx].y;
    let near = [];
    for (let win = 3; win <= 40 && near.length < 21; win += 3) {
      near = EVENTS.filter((e) => Math.abs(e.y - year) <= win && !inThread.has(eid(e)));
    }
    const rows = Array.from({ length: BG_ROWS }, () => []);
    near.forEach((e, i) => rows[i % BG_ROWS].push(e));
    return rows.filter((r) => r.length);
  }, [evs, idx]);

  const ctlBtn = (on = false) => ({
    fontSize: 12, fontWeight: 700, cursor: "pointer", padding: "6px 12px",
    borderRadius: 999, fontFamily: font, lineHeight: 1.2,
    border: `1px solid ${on ? "#b0771e" : "#9aa3ad"}`,
    background: on ? "#f3dfb5" : "#ffffff",
    color: on ? "#6b4610" : "#374151",
  });

  return (
    <div
      role="dialog"
      aria-label={`テーマ再生:${thread.title}`}
      style={{
        position: "fixed", inset: 0, zIndex: 60, display: "flex", flexDirection: "column",
        background: "#f7f7f5", color: "#22272e", fontFamily: font,
      }}
    >
      {/* 見出し */}
      <div style={{ padding: "14px 16px 10px", borderBottom: "1px solid #d7dce2", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 10.5, letterSpacing: "0.2em", color: "#8a93a3" }}>テーマの糸</div>
            <div style={{ fontSize: 17, fontWeight: 800, marginTop: 3 }}>{thread.title}</div>
            <div style={{ fontSize: 11.5, color: "#4b5563", marginTop: 4, lineHeight: 1.6 }}>
              {thread.lead}
            </div>
          </div>
          <button onClick={onClose} aria-label="閉じる" style={{ ...ctlBtn(), padding: "6px 10px" }}>
            ×閉じる
          </button>
        </div>
        <div style={{ marginTop: 8, height: 3, background: "#d7dce2", borderRadius: 2 }}>
          <div
            style={{
              width: `${((idx + 1) / evs.length) * 100}%`, height: "100%",
              background: "#b0771e", borderRadius: 2, transition: "width 0.3s",
            }}
          />
        </div>
      </div>

      {/* 本体(現在の項目が中央に来るよう自動でスクロールする) */}
      <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
        <style>{`
          @keyframes lifelineDriftA { from { transform: translateX(0) } to { transform: translateX(-50%) } }
          @keyframes lifelineDriftB { from { transform: translateX(-50%) } to { transform: translateX(0) } }
        `}</style>
        {/* 同じころに起きていた別カテゴリーの出来事を、左右の背景に薄く流す */}
        <div style={{ position: "absolute", inset: 0, overflow: "hidden" }} aria-hidden="true">
          {bgRows.map((row, i) => (
            <div
              key={i}
              style={{
                position: "absolute", top: `${((i + 0.5) * 100) / bgRows.length}%`,
                left: 0, width: "max-content", display: "flex", gap: 46,
                whiteSpace: "nowrap", lineHeight: 1,
                animation: `lifelineDrift${i % 2 ? "B" : "A"} ${110 + i * 23}s linear infinite`,
              }}
            >
              {[...row, ...row].map((e, j) => (
                <span
                  key={j}
                  style={{
                    fontSize: 13 + ((i * 5) % 9), color: BG_COLOR[catKey(e)] || "#8a93a3",
                    opacity: 0.34, fontWeight: 600,
                  }}
                >
                  <span style={{ fontFamily: mono, marginRight: 8, opacity: 0.65 }}>{e.y}</span>
                  {e.t.replace(/[((].*$/, "")}
                </span>
              ))}
            </div>
          ))}
        </div>
        {/* 中央は読ませたいので、背景の層を覆い隠す */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute", inset: 0, pointerEvents: "none",
            background:
              "linear-gradient(90deg, rgba(247,247,245,0) 0%, rgba(247,247,245,0.97) 20%, rgba(247,247,245,0.97) 80%, rgba(247,247,245,0) 100%)",
          }}
        />
        <div ref={listRef} style={{ position: "absolute", inset: 0, overflowY: "auto", padding: "40vh 16px" }}>
        <div style={{ maxWidth: 640, margin: "0 auto" }}>
          {evs.map((ev, i) => {
            const active = i === idx;
            const color = CAT[catKey(ev)]?.bg || "#6b7280";
            return (
              <div
                key={eid(ev)}
                data-i={i}
                onClick={() => go(i)}
                style={{
                  padding: active ? "16px 0" : "9px 0", cursor: "pointer",
                  opacity: active ? 1 : 0.52, transition: "opacity 0.35s",
                }}
              >
                <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                  <span
                    style={{
                      fontFamily: mono, fontSize: active ? 15 : 13, fontWeight: 700,
                      color: "#8a93a3", width: 48, flexShrink: 0,
                    }}
                  >
                    {ev.y}
                  </span>
                  <span
                    style={{
                      flexShrink: 0, fontSize: 11, fontWeight: 800, color: "#12151b",
                      background: "#c9ced8", borderRadius: 5, padding: "2px 7px", marginTop: 1,
                    }}
                  >
                    {gradeOf(ev)}
                  </span>
                  <Icon name={ev.ic} color={color} size={active ? 20 : 16} />
                  <span
                    style={{
                      fontSize: active ? 19 : 14, fontWeight: active ? 800 : 500,
                      lineHeight: 1.5, flex: 1,
                    }}
                  >
                    {ev.t}
                  </span>
                </div>
                {active && ev.n && (
                  <div
                    style={{
                      marginTop: 10, marginLeft: 58, paddingLeft: 12,
                      borderLeft: `3px solid ${color}`,
                      fontSize: 13.5, lineHeight: 1.85, color: "#4b5563",
                    }}
                  >
                    {ev.n}
                  </div>
                )}
              </div>
            );
          })}
          {done && (
            <div style={{ textAlign: "center", marginTop: 24, fontSize: 12.5, color: "#9aa3b2" }}>
              この糸はここまで。
              <button onClick={() => go(0)} style={{ ...ctlBtn(), marginLeft: 10 }}>
                最初から
              </button>
            </div>
          )}
        </div>
        </div>
      </div>

      {/* 操作 */}
      <div
        style={{
          flexShrink: 0, borderTop: "1px solid #d7dce2", padding: "10px 16px",
          display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap",
          justifyContent: "center", background: "#eef0f3",
        }}
      >
        <button onClick={() => go(idx - 1)} style={ctlBtn()} aria-label="前へ">◀</button>
        <button
          onClick={() => {
            if (done) go(0);
            setPlaying((p) => (done ? true : !p));
          }}
          style={{ ...ctlBtn(playing), minWidth: 76 }}
        >
          {playing ? "❙❙ 一時停止" : "▶ 再生"}
        </button>
        <button onClick={() => go(idx + 1)} style={ctlBtn()} aria-label="次へ">▶</button>
        <button onClick={() => setTts(!tts)} style={ctlBtn(tts)}>
          {tts ? "🔊 読み上げ中" : "🔇 読み上げ"}
        </button>
        <button
          onClick={() => setSpeed(speed === 1 ? 1.5 : speed === 1.5 ? 2 : 1)}
          style={ctlBtn(speed !== 1)}
        >
          {speed}倍速
        </button>
        <span style={{ fontFamily: mono, fontSize: 11.5, color: "#8a93a3" }}>
          {idx + 1} / {evs.length}
        </span>
        <a
          href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(
            `「${thread.title}」——${thread.lead} ${HASHTAG}`
          )}&url=${encodeURIComponent(`${SHARE_URL}?t=${thread.key}`)}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{ ...ctlBtn(), textDecoration: "none" }}
        >
          この糸をXで共有
        </a>
      </div>
    </div>
  );
}

// ---- 保存(ブラウザのみ。使えない環境では黙ってメモリ動作) ----
const store = {
  load() {
    try { return JSON.parse(window.localStorage.getItem("sf-lifeline") || "null"); } catch { return null; }
  },
  save(data) {
    try { window.localStorage.setItem("sf-lifeline", JSON.stringify(data)); } catch {}
  },
};
const SAVED = (typeof window !== "undefined" && store.load()) || {};
const INITIAL_BIRTH = SAVED.birth ?? PROFILE_DEFAULTS.birthYear ?? 1965;
const INITIAL_MONTH = SAVED.month ?? PROFILE_DEFAULTS.birthMonth ?? 0;
const INITIAL_EDUCATION = migrateEducationSettings(
  SAVED,
  PROFILE_DEFAULTS,
  INITIAL_BIRTH,
  INITIAL_MONTH
);

export default function App() {
  const [birth, setBirth] = useState(INITIAL_BIRTH);
  const [month, setMonth] = useState(INITIAL_MONTH); // 0=未設定(任意入力)
  const [higherEdY, setHigherEdY] = useState(
    INITIAL_EDUCATION.higherEdYear
  );
  const [higherEdType, setHigherEdType] = useState(
    INITIAL_EDUCATION.higherEdType
  );
  const [graduateY, setGraduateY] = useState(
    INITIAL_EDUCATION.graduateYear
  );
  const [graduateType, setGraduateType] = useState(
    INITIAL_EDUCATION.graduateType
  );
  const [adultY, setAdultY] = useState(INITIAL_EDUCATION.adultYear);
  const [retirementY, setRetirementY] = useState(
    INITIAL_EDUCATION.retirementYear
  );
  const [myEvents, setMyEvents] = useState([]);

  const [eventCustomizations, setEventCustomizations] = useState(
    EMPTY_EVENT_CUSTOMIZATIONS
  );
  const [eventCustomizationStatus, setEventCustomizationStatus] =
    useState("");
  const [eventCustomizationEditorOpen, setEventCustomizationEditorOpen] =
    useState(false);
  const [editingEventId, setEditingEventId] = useState(null);
  const [eventEditDraft, setEventEditDraft] = useState({
    title: "",
    summary: "",
    importance: 2,
  });
  const [eventAddOpen, setEventAddOpen] = useState(false);
  const [eventAddDraft, setEventAddDraft] = useState({
    date: "",
    title: "",
    category: "society",
    importance: 2,
    summary: "",
  });
  const [personalEventsSource, setPersonalEventsSource] = useState("");
  const [personalFileStatus, setPersonalFileStatus] = useState("");
  const [personalAddOpen, setPersonalAddOpen] = useState(false);
  const [personalEditorOpen, setPersonalEditorOpen] = useState(false);
  const [editingPersonalId, setEditingPersonalId] = useState(null);
  const [personalDraft, setPersonalDraft] = useState({
    date: "",
    title: "",
    importance: 2,
    summary: "",
  });
  const eventCustomizationFileInputRef = useRef(null);
  const personalFileInputRef = useRef(null);
  // 大分類フィルタ。true が入っているカテゴリーだけを非表示にする
  const [catOff, setCatOff] = useState(SAVED.catOff ?? {});
  // 公開イベントの表示量。3=重要、2=標準、1=全部
  const [importanceMin, setImportanceMin] = useState(SAVED.importanceMin ?? 2);
  const [showMe, setShowMe] = useState(false);
  // 分野フィルタ。falseが入っている分野だけを非表示にする(未知の分野は既定でオン)
  const [subOff, setSubOff] = useState(SAVED.subOff ?? {});
  // 畳んでいる期間(帯)のキー
  const [closedStages, setClosedStages] = useState(() => new Set(SAVED.closed ?? []));
  // 生年や進学・就職年の入力欄。一度入れたら畳んでおける(初回訪問時だけ開いた状態)
  const [setupOpen, setSetupOpen] = useState(SAVED.setupOpen ?? !SAVED.birth);
  const [open, setOpen] = useState(() => new Set());
  // 再生中のテーマ(nullなら年表を表示)と、読み上げのオン・オフ
  const [thread, setThread] = useState(null);
  const [tts, setTts] = useState(SAVED.tts ?? false);
  // 再生速度はテーマをまたいでも覚えておく
  const [speed, setSpeed] = useState(SAVED.speed ?? 1);
  // 年表内検索は一時的な表示条件として扱い、ブラウザ保存はしない。
  const [searchText, setSearchText] = useState("");

  useEffect(() => {
    store.save({
      birth,
      month,
      higherEdYear: higherEdY,
      higherEdType,
      graduateYear: graduateY,
      graduateType,
      adultYear: adultY,
      retirementYear: retirementY,
      catOff,
      importanceMin,
      subOff,
      closed: [...closedStages],
      setupOpen,
      tts,
      speed,
    });
  }, [birth, month, higherEdY, higherEdType, graduateY, graduateType, adultY, retirementY, catOff, importanceMin, subOff, closedStages, setupOpen, tts, speed]);

  useEffect(() => {
    let cancelled = false;

    loadBrowserPersonalEvents()
      .then((events) => {
        if (!cancelled) {
          setMyEvents(events);
          if (events.length > 0) {
            setPersonalEventsSource("browser");
          }
        }
      })
      .catch((err) => {
        console.error("Browser personal history could not be loaded:", err);
        if (!cancelled) {
          setPersonalFileStatus(
            err?.message || "ブラウザ内の自分史を読み込めませんでした"
          );
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    loadBrowserEventCustomizations()
      .then((customizations) => {
        if (!cancelled) {
          setEventCustomizations(customizations);
        }
      })
      .catch((err) => {
        console.error(
          "Browser event customizations could not be loaded:",
          err
        );
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const toggleStage = (key) =>
    setClosedStages((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });

  const MAIN_CATS = [
    "work",
    "science",
    "education",
    "computer",
    "culture",
    "society",
  ];

  const catOn = (k) => catOff[k] !== true;

  const toggleCat = (k) =>
    setCatOff((prev) => ({ ...prev, [k]: !prev[k] }));

  const setAllCats = (on) => {
    setCatOff(
      on
        ? {}
        : Object.fromEntries(MAIN_CATS.map((k) => [k, true]))
    );
  };

  const startEditingEvent = (event) => {
    setEditingEventId(event.id);
    setEventEditDraft({
      title: event.t ?? "",
      summary: event.n ?? "",
      importance: event.importance ?? 2,
    });
    setEventCustomizationStatus(
      `「${event.t}」を修正中です`
    );
  };

  const cancelEditingEvent = () => {
    setEditingEventId(null);
    setEventEditDraft({
      title: "",
      summary: "",
      importance: 2,
    });
    setEventCustomizationStatus("");
  };

  const saveEditedEvent = async (event) => {
    const base = EVENTS.find((item) => item.id === event.id);

    if (!base) {
      setEventCustomizationStatus(
        "正本に対応する項目が見つかりません"
      );
      return;
    }

    const title = eventEditDraft.title.trim();
    const summary = eventEditDraft.summary.trim();
    const importance = Number(eventEditDraft.importance);

    if (!title || !summary) {
      setEventCustomizationStatus(
        "タイトルと概要は空にできません"
      );
      return;
    }

    if (![1, 2, 3].includes(importance)) {
      setEventCustomizationStatus(
        "重要度は1、2、3のいずれかにしてください"
      );
      return;
    }

    const changes = {};

    if (title !== base.t) changes.t = title;
    if (summary !== base.n) changes.n = summary;
    if (importance !== base.importance) {
      changes.importance = importance;
    }

    const nextOverrides = {
      ...(eventCustomizations.overrides ?? {}),
    };

    const previous = nextOverrides[event.id] ?? {};

    const preserved = Object.fromEntries(
      Object.entries(previous).filter(
        ([key]) => !["t", "n", "importance"].includes(key)
      )
    );

    const merged = {
      ...preserved,
      ...changes,
    };

    if (Object.keys(merged).length === 0) {
      delete nextOverrides[event.id];
    } else {
      nextOverrides[event.id] = merged;
    }

    const next = {
      overrides: nextOverrides,
      hidden: [...(eventCustomizations.hidden ?? [])],
      additions: [...(eventCustomizations.additions ?? [])],
    };

    try {
      await saveBrowserEventCustomizations(next);
      setEventCustomizations(next);

      setEditingEventId(null);
      setEventEditDraft({
        title: "",
        summary: "",
        importance: 2,
      });

      setEventCustomizationStatus(
        Object.keys(merged).length === 0
          ? `「${base.t}」を正本の内容に戻しました`
          : `「${title}」の修正をこのブラウザに保存しました`
      );
    } catch (err) {
      console.error(
        "Event customization could not be saved:",
        err
      );
      setEventCustomizationStatus(
        `保存失敗: ${err?.message || String(err)}`
      );
    }
  };

  const importEventCustomizationsFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";

    if (!file) return;

    try {
      const text = await file.text();
      const parsed = parseEventCustomizationsTsv(text);

      // 正本とのID衝突なども、保存前に検査する。
      const preview = applyEventCustomizations(
        EVENTS,
        parsed
      );

      const overrideCount = Object.keys(
        parsed.overrides ?? {}
      ).length;
      const hiddenCount = parsed.hidden?.length ?? 0;
      const additionCount =
        parsed.additions?.length ?? 0;

      const ok = window.confirm(
        `「${file.name}」を読み込み、` +
        `現在の年表カスタマイズを置き換えますか？\n\n` +
        `修正 ${overrideCount}件 / ` +
        `非表示 ${hiddenCount}件 / ` +
        `追加 ${additionCount}件`
      );

      if (!ok) return;

      await saveBrowserEventCustomizations(parsed);
      setEventCustomizations(parsed);

      setEditingEventId(null);
      setEventEditDraft({
        title: "",
        summary: "",
        importance: 2,
      });
      setEventAddOpen(false);
      resetEventAddDraft();
      setOpen(new Set());

      const orphanCount = preview.orphaned.length;

      setEventCustomizationStatus(
        `${file.name} から年表カスタマイズを読み込み、` +
        `このブラウザに保存しました` +
        `（修正 ${overrideCount}件 / ` +
        `非表示 ${hiddenCount}件 / ` +
        `追加 ${additionCount}件` +
        (
          orphanCount > 0
            ? ` / 正本にないID ${orphanCount}件`
            : ""
        ) +
        `）`
      );
    } catch (err) {
      console.error(
        "Event customizations could not be imported:",
        err
      );
      setEventCustomizationStatus(
        `TSV読み込み失敗: ${err?.message || String(err)}`
      );
    }
  };

  const exportEventCustomizationsFile = () => {
    try {
      const text = serializeEventCustomizationsTsv(
        eventCustomizations
      );

      const blob = new Blob(
        [text],
        {
          type: "text/tab-separated-values;charset=utf-8",
        }
      );

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download = "koshix-timeline-customizations.tsv";

      document.body.appendChild(link);
      link.click();
      link.remove();

      setTimeout(() => URL.revokeObjectURL(url), 0);

      const overrideCount = Object.keys(
        eventCustomizations.overrides ?? {}
      ).length;
      const hiddenCount =
        eventCustomizations.hidden?.length ?? 0;
      const additionCount =
        eventCustomizations.additions?.length ?? 0;

      setEventCustomizationStatus(
        `年表カスタマイズをTSVへ書き出しました` +
        `（修正 ${overrideCount}件 / ` +
        `非表示 ${hiddenCount}件 / ` +
        `追加 ${additionCount}件）`
      );
    } catch (err) {
      console.error(
        "Event customizations could not be exported:",
        err
      );
      setEventCustomizationStatus(
        `TSV書き出し失敗: ${err?.message || String(err)}`
      );
    }
  };

  const resetEventAddDraft = () => {
    setEventAddDraft({
      date: "",
      title: "",
      category: "society",
      importance: 2,
      summary: "",
    });
  };

  const openNewEventForm = () => {
    resetEventAddDraft();
    setEventCustomizationEditorOpen(true);
    setEventAddOpen(true);
    setEventCustomizationStatus("");
  };

  const cancelAddingEvent = () => {
    setEventAddOpen(false);
    resetEventAddDraft();
    setEventCustomizationStatus("");
  };

  const saveAddedEvent = async () => {
    const date = eventAddDraft.date.trim();
    const title = eventAddDraft.title.trim();
    const summary = eventAddDraft.summary.trim();
    const category = eventAddDraft.category;
    const importance = Number(eventAddDraft.importance);

    const dateMatch = date.match(
      /^(\d{4})(?:-(\d{2})(?:-(\d{2}))?)?$/
    );

    if (!dateMatch) {
      setEventCustomizationStatus(
        "日付は YYYY、YYYY-MM、YYYY-MM-DD の形式で入力してください"
      );
      return;
    }

    const month = dateMatch[2] ? Number(dateMatch[2]) : null;
    const day = dateMatch[3] ? Number(dateMatch[3]) : null;

    if (month !== null && (month < 1 || month > 12)) {
      setEventCustomizationStatus("月は01〜12で入力してください");
      return;
    }

    if (day !== null && (day < 1 || day > 31)) {
      setEventCustomizationStatus("日は01〜31で入力してください");
      return;
    }

    if (!title || !summary) {
      setEventCustomizationStatus(
        "タイトルと概要は空にできません"
      );
      return;
    }

    if (!MAIN_CATS.includes(category)) {
      setEventCustomizationStatus("分野の指定が不正です");
      return;
    }

    if (![1, 2, 3].includes(importance)) {
      setEventCustomizationStatus(
        "重要度は1、2、3のいずれかにしてください"
      );
      return;
    }

    const iconByCategory = {
      work: "video",
      science: "chip",
      education: "book",
      computer: "computer",
      culture: "music",
      society: "flag",
    };

    const additions = [
      ...(eventCustomizations.additions ?? []),
    ];

    const usedIds = new Set([
      ...EVENTS.map((event) => event.id),
      ...additions.map((event) => event.id),
    ]);

    let id;
    do {
      id =
        `custom-${Date.now().toString(36)}-` +
        Math.random().toString(36).slice(2, 8);
    } while (usedIds.has(id));

    const addition = {
      id,
      date,
      y: Number(date.slice(0, 4)),
      t: title,
      cats: [category],
      primary: category,
      cat: category,
      importance,
      core: false,
      ic: iconByCategory[category],
      n: summary,
    };

    const next = {
      overrides: {
        ...(eventCustomizations.overrides ?? {}),
      },
      hidden: [
        ...(eventCustomizations.hidden ?? []),
      ],
      additions: [...additions, addition],
    };

    try {
      await saveBrowserEventCustomizations(next);
      setEventCustomizations(next);
      setEventAddOpen(false);
      resetEventAddDraft();
      setEventCustomizationStatus(
        `「${title}」をこのブラウザの年表に追加しました`
      );
    } catch (err) {
      console.error(
        "Custom event could not be added:",
        err
      );
      setEventCustomizationStatus(
        `追加失敗: ${err?.message || String(err)}`
      );
    }
  };

  const deleteAddedEvent = async (event) => {
    const addition = (eventCustomizations.additions ?? []).find(
      (item) => item.id === event.id
    );

    if (!addition) {
      setEventCustomizationStatus(
        "追加項目として保存されているデータが見つかりません"
      );
      return;
    }

    const ok = window.confirm(
      `追加項目「${addition.t}」をこのブラウザから削除しますか？`
    );

    if (!ok) return;

    const next = {
      overrides: {
        ...(eventCustomizations.overrides ?? {}),
      },
      hidden: [
        ...(eventCustomizations.hidden ?? []),
      ],
      additions: (eventCustomizations.additions ?? []).filter(
        (item) => item.id !== event.id
      ),
    };

    try {
      await saveBrowserEventCustomizations(next);
      setEventCustomizations(next);

      setOpen((prev) => {
        const nextOpen = new Set(prev);
        nextOpen.delete(event.id);
        return nextOpen;
      });

      setEventCustomizationStatus(
        `「${addition.t}」を削除しました`
      );
    } catch (err) {
      console.error(
        "Custom event could not be deleted:",
        err
      );
      setEventCustomizationStatus(
        `削除失敗: ${err?.message || String(err)}`
      );
    }
  };

  const hideEvent = async (event) => {
    const ok = window.confirm(
      `年表項目「${event.t}」をこのブラウザで非表示にしますか？`
    );

    if (!ok) return;

    const hidden = [
      ...new Set([
        ...(eventCustomizations.hidden ?? []),
        event.id,
      ]),
    ];

    const next = {
      overrides: {
        ...(eventCustomizations.overrides ?? {}),
      },
      hidden,
      additions: [
        ...(eventCustomizations.additions ?? []),
      ],
    };

    try {
      await saveBrowserEventCustomizations(next);
      setEventCustomizations(next);

      if (editingEventId === event.id) {
        setEditingEventId(null);
        setEventEditDraft({
          title: "",
          summary: "",
          importance: 2,
        });
      }

      setOpen((prev) => {
        const nextOpen = new Set(prev);
        nextOpen.delete(event.id);
        return nextOpen;
      });

      setEventCustomizationStatus(
        `「${event.t}」を非表示にしました`
      );
    } catch (err) {
      console.error(
        "Event could not be hidden:",
        err
      );
      setEventCustomizationStatus(
        `非表示失敗: ${err?.message || String(err)}`
      );
    }
  };

  const restoreHiddenEvent = async (id) => {
    const base = EVENTS.find((event) => event.id === id);

    const next = {
      overrides: {
        ...(eventCustomizations.overrides ?? {}),
      },
      hidden: (eventCustomizations.hidden ?? []).filter(
        (itemId) => itemId !== id
      ),
      additions: [
        ...(eventCustomizations.additions ?? []),
      ],
    };

    try {
      await saveBrowserEventCustomizations(next);
      setEventCustomizations(next);
      setEventCustomizationStatus(
        base
          ? `「${base.t}」を表示に戻しました`
          : `項目 ${id} の非表示指定を解除しました`
      );
    } catch (err) {
      console.error(
        "Hidden event could not be restored:",
        err
      );
      setEventCustomizationStatus(
        `復帰失敗: ${err?.message || String(err)}`
      );
    }
  };

  const clearEventCustomizations = async () => {
    const overrideCount = Object.keys(
      eventCustomizations.overrides ?? {}
    ).length;
    const hiddenCount = eventCustomizations.hidden?.length ?? 0;
    const additionCount = eventCustomizations.additions?.length ?? 0;
    const total = overrideCount + hiddenCount + additionCount;

    if (total === 0) {
      setEventCustomizationStatus(
        "保存されている年表カスタマイズはありません"
      );
      return;
    }

    const ok = window.confirm(
      `年表カスタマイズ ${total}件をこのブラウザから消去しますか？`
    );

    if (!ok) return;

    try {
      await clearBrowserEventCustomizations();
      setEventCustomizations({
        overrides: {},
        hidden: [],
        additions: [],
      });
      setEditingEventId(null);
      setEventEditDraft({
        title: "",
        summary: "",
        importance: 2,
      });
      setEventCustomizationStatus(
        "年表カスタマイズを消去し、正本の年表に戻しました"
      );
    } catch (err) {
      console.error(
        "Browser event customizations could not be cleared:",
        err
      );
      setEventCustomizationStatus(
        `消去失敗: ${err?.message || String(err)}`
      );
    }
  };

  const importPersonalEventsFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";

    if (!file) return;

    try {
      const text = await file.text();
      const events = parsePersonalEventsTsv(text);

      await saveBrowserPersonalEvents(events);
      setMyEvents(events);
      setPersonalEventsSource("browser");
      setEditingPersonalId(null);
      setPersonalAddOpen(false);
      setPersonalFileStatus(
        `${file.name} から ${events.length}件を読み込み、このブラウザに保存しました`
      );
    } catch (err) {
      console.error("Personal history file could not be imported:", err);
      setPersonalFileStatus(
        `読み込み失敗: ${err?.message || String(err)}`
      );
    }
  };

  const exportPersonalEventsFile = () => {
    try {
      const text = serializePersonalEventsTsv(myEvents);
      const blob = new Blob(
        [text],
        { type: "text/tab-separated-values;charset=utf-8" }
      );
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download = "koshix-timeline-personal-history.tsv";
      document.body.appendChild(link);
      link.click();
      link.remove();

      setTimeout(() => URL.revokeObjectURL(url), 0);

      setPersonalFileStatus(
        `${myEvents.length}件をTSVファイルへ書き出しました`
      );
    } catch (err) {
      console.error("Personal history file could not be exported:", err);
      setPersonalFileStatus(
        `書き出し失敗: ${err?.message || String(err)}`
      );
    }
  };

  const resetPersonalDraft = () => {
    setPersonalDraft({
      date: "",
      title: "",
      importance: 2,
      summary: "",
    });
  };

  const clearPersonalEventsFile = async () => {
    if (personalEventsSource !== "browser") {
      setPersonalFileStatus(
        "消去できるのは、このブラウザの自分史を使用しているときだけです"
      );
      return;
    }

    const ok = window.confirm(
      `自分史 ${myEvents.length}件をこのブラウザから消去しますか？`
    );

    if (!ok) return;

    try {
      await clearBrowserPersonalEvents();

      setMyEvents([]);
      setPersonalEventsSource("");
      setShowMe(false);
      setEditingPersonalId(null);
      resetPersonalDraft();
      setPersonalAddOpen(false);
      setPersonalEditorOpen(false);
      setPersonalFileStatus(
        "このブラウザの自分史を消去しました"
      );
    } catch (err) {
      console.error("Personal history TSV could not be cleared:", err);
      setPersonalFileStatus(
        `消去失敗: ${err?.message || String(err)}`
      );
    }
  };

  const openNewPersonalEventForm = () => {
    if (personalEventsSource === "server") return;

    setPersonalEditorOpen(true);

    if (personalAddOpen && editingPersonalId === null) {
      setPersonalAddOpen(false);
      return;
    }

    setEditingPersonalId(null);
    resetPersonalDraft();
    setPersonalAddOpen(true);
  };

  const closePersonalEventForm = () => {
    setEditingPersonalId(null);
    resetPersonalDraft();
    setPersonalAddOpen(false);
  };

  const startEditingPersonalEvent = (event) => {
    if (personalEventsSource !== "browser") {
      setPersonalFileStatus(
        "編集できるのは、このブラウザに保存した自分史だけです"
      );
      return;
    }

    setPersonalEditorOpen(true);
    setEditingPersonalId(event.id);
    setPersonalDraft({
      date: event.date ?? "",
      title: event.t ?? "",
      importance: event.importance ?? 2,
      summary: event.n ?? "",
    });
    setPersonalAddOpen(true);
    setPersonalFileStatus(
      `自分史「${event.t}」を編集中です`
    );

    setTimeout(() => {
      document
        .getElementById("personal-history-editor")
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 0);
  };

  const savePersonalEvent = async () => {
    if (personalEventsSource === "server") {
      setPersonalFileStatus(
        "管理者データを表示中はブラウザ自分史を追加・編集できません"
      );
      return;
    }

    const date = String(personalDraft.date ?? "").trim();
    const title = String(personalDraft.title ?? "").trim();
    const summary = String(personalDraft.summary ?? "").trim();

    const existing = editingPersonalId
      ? myEvents.find((event) => event.id === editingPersonalId)
      : null;

    if (editingPersonalId && !existing) {
      setPersonalFileStatus(
        "編集対象の自分史が見つかりません"
      );
      return;
    }

    const event = existing
      ? {
          ...existing,
          date,
          y: Number(date.slice(0, 4)),
          t: title,
          importance: Number(personalDraft.importance),
          n: summary,
        }
      : {
          id: `me-${Date.now().toString(36)}`,
          date,
          y: Number(date.slice(0, 4)),
          t: title,
          cats: ["me"],
          primary: "me",
          importance: Number(personalDraft.importance),
          ic: "flag",
          n: summary,
        };

    const rawEvents = existing
      ? myEvents.map((item) =>
          item.id === editingPersonalId ? event : item
        )
      : [...myEvents, event];

    try {
      // 既存TSV仕様で検証してからIndexedDBへ保存する。
      const events = parsePersonalEventsTsv(
        serializePersonalEventsTsv(rawEvents)
      );

      await saveBrowserPersonalEvents(events);

      setMyEvents(events);
      setPersonalEventsSource("browser");
      setEditingPersonalId(null);
      resetPersonalDraft();
      setPersonalAddOpen(false);
      setPersonalFileStatus(
        existing
          ? `自分史「${title}」を更新し、このブラウザに保存しました`
          : `自分史「${title}」を追加し、このブラウザに保存しました`
      );
    } catch (err) {
      console.error("Personal history event could not be saved:", err);
      setPersonalFileStatus(
        `${existing ? "更新" : "追加"}失敗: ${err?.message || String(err)}`
      );
    }
  };

  const deletePersonalEvent = async (event) => {
    if (personalEventsSource !== "browser") {
      setPersonalFileStatus(
        "削除できるのは、このブラウザに保存した自分史だけです"
      );
      return;
    }

    const ok = window.confirm(
      `自分史「${event.t}」を削除しますか？`
    );

    if (!ok) return;

    try {
      const remaining = myEvents.filter(
        (item) => item.id !== event.id
      );

      // 削除後もTSVとして読み戻せることを確認してから保存する。
      const events = parsePersonalEventsTsv(
        serializePersonalEventsTsv(remaining)
      );

      await saveBrowserPersonalEvents(events);

      setMyEvents(events);

      if (editingPersonalId === event.id) {
        setEditingPersonalId(null);
        resetPersonalDraft();
        setPersonalAddOpen(false);
      }

      setOpen((prev) => {
        const next = new Set(prev);
        next.delete(eid(event));
        return next;
      });

      setPersonalFileStatus(
        `自分史「${event.t}」を削除し、このブラウザに保存しました`
      );
    } catch (err) {
      console.error("Personal history event could not be deleted:", err);
      setPersonalFileStatus(
        `削除失敗: ${err?.message || String(err)}`
      );
    }
  };

  const toggleMyEvents = () => {
    setShowMe((value) => !value);
  };

  const loadServerPersonalEvents = async () => {
    // 管理者向け。localhostではそのまま取得でき、
    // 公開環境では private/ のBasic認証を通過した場合だけ取得できる。
    try {
      const events = await loadPrivateEvents();

      if (events === null) {
        setPersonalFileStatus(
          "管理者データを読み込めませんでした"
        );
        return;
      }

      setMyEvents(events);
      setPersonalEventsSource("server");
      setEditingPersonalId(null);
      setPersonalAddOpen(false);
      setPersonalEditorOpen(false);
      setPersonalFileStatus(
        `管理者データ ${events.length}件を読み込みました`
      );
    } catch (err) {
      console.error("Personal events could not be loaded:", err);
      setPersonalFileStatus(
        `管理者データの読み込み失敗: ${err?.message || String(err)}`
      );
    }
  };

  const subOn = (k) => subOff[k] !== true;
  const toggleSub = (k) => setSubOff((prev) => ({ ...prev, [k]: !prev[k] }));
  const setAllSubs = (on) =>
    setSubOff(on ? {} : Object.fromEntries(Object.keys(SUBS).map((k) => [k, true])));

  const toggle = (id) => {
    setOpen((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // ?e=<項目ID> で共有されたリンクは、その項目を開いた状態で表示する
  // ?t=<テーマのキー> ならそのテーマの再生を開いた状態で始める
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const th = findThread(q.get("t"));
    if (th) setThread(th);
    const ev = findByShareParam(q.get("e"));
    if (!ev) return;
    const id = eid(ev);
    setOpen((prev) => new Set(prev).add(id));
    setClosedStages(new Set()); // 共有リンクで来たときは帯を畳んだままにしない
    const timer = setTimeout(() => {
      document.getElementById(`ev-${id}`)?.scrollIntoView({ block: "center" });
    }, 150);
    return () => clearTimeout(timer);
  }, []);

  const effectiveEvents = useMemo(
    () =>
      applyEventCustomizations(
        EVENTS,
        eventCustomizations
      ).events,
    [eventCustomizations]
  );

  const effectiveStats = useMemo(
    () =>
      effectiveEvents.reduce(
        (a, e) => ({
          count: a.count + 1,
          chars: a.chars + [...(e.n || "")].length,
        }),
        { count: 0, chars: 0 }
      ),
    [effectiveEvents]
  );

  const grouped = useMemo(() => {
    const searchExpression = parseSearchExpression(searchText);
    const matchesSearch = (e) => {
      if (!searchText.trim()) return true;
      if (searchExpression.error) return false;
      const haystack = normalizeSearchText(
        [e.date, e.end_date, e.t, e.n, e.q, e.note, e.region]
          .filter(Boolean)
          .join(" ")
      );
      return matchesSearchExpression(searchExpression.root, haystack);
    };

    const life = buildLifeModel({
      birth,
      month,
      higherEdYear: higherEdY,
      higherEdType,
      graduateYear: graduateY,
      graduateType,
      adultYear: adultY,
      retirementYear: retirementY,
    });
    const RANK = {
      me: 0,
      sf: 1,
      science: 2,
      education: 3,
      computer: 4,
      culture: 5,
      society: 6,
    };
    const list = [
      // v0.1: 旧 tech → computer、旧 music → culture として暫定表示
      ...effectiveEvents
        // 大分類フィルタは主分類で判定する。
        // sf などの副分類はタグ・色ドットとして保持する。
        .filter(
          (e) =>
            catOn(primaryCatOf(e)) &&
            (e.importance ?? 2) >= importanceMin &&
            matchesSearch(e)
        )
        // 既存表示コードとの互換のため cat に主分類を入れる
        .map((e) => ({
          ...e,
          cats: catsOf(e),
          cat: primaryCatOf(e),
        })),
      ...(showMe
        ? myEvents.filter(matchesSearch).map((m) => ({
            ...m,
            cat: "me",
            cats: m.cats ?? ["me"],
            primary: "me",
            ic: m.ic ?? "flag",
          }))
        : []),
    ]
      .map((e) => ({ ...e, age: e.y - birth }))
      .sort((a, b) => a.y - b.y || RANK[a.cat] - RANK[b.cat]);
    const groups = [];
    for (const ev of list) {
      const st = life.stageOf(ev.y);
      const era = SPLIT_STAGES.has(st.key) ? eraOf(ev.y) : null;
      const key = era ? `${st.key}:${era.key}` : st.key;
      const last = groups[groups.length - 1];
      if (last && last.key === key) last.items.push(ev);
      else groups.push({ key, stage: st, era, items: [ev] });
    }
    // 学齢期の帯は分割しないが、またいでいる時代の名前は見出しに併記する
    for (const g of groups) {
      if (g.era) continue;
      const names = [...new Set(g.items.map((e) => eraOf(e.y).label))];
      g.eraSpan = names.join(" → ");
    }
    return {
      groups,
      gradeLabel: life.gradeLabel,
      adultYear: life.adultYear,
      warnings: life.warnings,
      shown: list.filter((e) => e.cat !== "me").length,
      myShown: list.filter((e) => e.cat === "me").length,
      searchError: searchExpression.error,
    };
  }, [birth, month, higherEdY, higherEdType, graduateY, graduateType, adultY, retirementY, myEvents, effectiveEvents, catOff, importanceMin, showMe, subOff, searchText]);

  const font =
    '"Hiragino Kaku Gothic ProN", "Hiragino Sans", "Yu Gothic Medium", "Noto Sans JP", sans-serif';
  const mono = 'ui-monospace, "SF Mono", Menlo, Consolas, monospace';

  const threadWindowMode =
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).get("threads") === "1";

  const openThreadWindow = () => {
    const url = new URL(window.location.href);
    url.search = "";
    url.hash = "";
    url.searchParams.set("threads", "1");

    const popup = window.open(
      url.toString(),
      "koshix-timeline-threads",
      "popup=yes,width=760,height=820,resizable=yes,scrollbars=yes"
    );

    popup?.focus();
  };

  if (threadWindowMode) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#fafaf8",
          fontFamily: font,
          color: "#22272e",
        }}
      >
        <div
          style={{
            maxWidth: 680,
            margin: "0 auto",
            padding: "28px 18px 48px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              marginBottom: 18,
            }}
          >
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontSize: 11,
                  letterSpacing: "0.2em",
                  color: "#8a8f98",
                }}
              >
                {APP_TITLE}
              </div>

              <h1
                style={{
                  fontSize: 24,
                  margin: "5px 0 0",
                  color: "#374151",
                }}
              >
                テーマの糸
              </h1>
            </div>

            <button
              type="button"
              onClick={() => window.close()}
              style={miniBtn}
            >
              ×閉じる
            </button>
          </div>

          <div
            style={{
              fontSize: 12.5,
              lineHeight: 1.8,
              color: "#6b7280",
              marginBottom: 16,
            }}
          >
            関連する出来事を一本の流れとしてたどります。
            テーマを選ぶと、読み上げ付きの再生画面が始まります。
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
              gap: 10,
            }}
          >
            {THREAD_LIST.map((th, index) => {
              const threadColors = [
                ["#f7f3ee", "#ddd1c3"],
                ["#f1f5f2", "#cddbd2"],
                ["#f3f4f8", "#d2d5e2"],
                ["#f7f2f5", "#dfd1da"],
                ["#f5f5ef", "#d9d9c8"],
                ["#f1f5f7", "#cbd8de"],
                ["#f7f4ef", "#ddd3c5"],
                ["#f3f2f7", "#d5d0df"],
                ["#f2f6f3", "#cedbd2"],
                ["#f6f2f2", "#ddcfcf"],
              ];
              const [background, border] =
                threadColors[index % threadColors.length];

              return (
              <button
                key={th.key}
                type="button"
                onClick={() => setThread(th)}
                style={{
                  fontFamily: font,
                  textAlign: "left",
                  cursor: "pointer",
                  padding: "12px 14px",
                  borderRadius: 10,
                  border: `1px solid ${border}`,
                  background,
                  color: "#4b5563",
                }}
              >
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 800,
                    color: "#4B56A6",
                  }}
                >
                  ▶ {th.title}
                </div>

                <div
                  style={{
                    marginTop: 5,
                    fontSize: 11,
                    lineHeight: 1.6,
                    color: "#6b7280",
                  }}
                >
                  {th.events.length}項目
                </div>
              </button>
              );
            })}
          </div>
        </div>

        {thread && (
          <Theater
            thread={thread}
            gradeLabel={grouped.gradeLabel}
            birth={birth}
            tts={tts}
            setTts={setTts}
            speed={speed}
            setSpeed={setSpeed}
            onClose={() => setThread(null)}
          />
        )}
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#fafaf8", fontFamily: font, color: "#22272e" }}>
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "28px 16px 64px" }}>
        {/* ヘッダー */}
        <header style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, letterSpacing: "0.25em", color: "#8a8f98", marginBottom: 6 }}>
            6つのテーマでたどる、自分の時代
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              flexWrap: "wrap",
            }}
          >
            <h1
              style={{
                fontSize: 29,
                fontWeight: 800,
                margin: 0,
                lineHeight: 1.35,
                flex: "1 1 300px",
              }}
            >
              {APP_TITLE}
            </h1>

            <div
              role="group"
              aria-label="共有"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 7,
                flexWrap: "wrap",
                padding: "4px 7px",
                border: "1px solid #e2e4e8",
                borderRadius: 10,
                background: "#f7f8f9",
              }}
            >
              <span style={{ fontSize: 11.5, fontWeight: 700, color: "#6b7280" }}>
                共有：
              </span>
              <ShareBar
                small
                labelOnly
                text={`${APP_TITLE}——6つのテーマで時代を自分の年齢から読む(${EVENTS.length}項目) ${HASHTAG}`}
              />
            </div>
          </div>
          <div style={{ fontSize: 11.5, color: "#8a8f98", marginTop: 8, fontFamily: mono }}>
            全{effectiveStats.count}項目・解説{effectiveStats.chars.toLocaleString()}字
          </div>
          {RECENT && (
            <div
              style={{
                marginTop: 8, fontSize: 11.5, lineHeight: 1.7, color: "#6b7280",
                background: "#fdf3e0", border: "1px solid #efe0c0",
                borderRadius: 8, padding: "7px 12px",
              }}
            >
              <span style={{ fontWeight: 700, color: "#8a5a12" }}>
                最近の追加({RECENT.date}・{RECENT.items.length}項目)
              </span>{" "}
              {RECENT.picks.map((e, i) => (
                <span key={eid(e)}>
                  {i > 0 && " / "}
                  <a
                    href={`?e=${eid(e)}`}
                    style={{ color: "#6b7280", textDecoration: "none", borderBottom: "1px dotted #b0771e" }}
                  >
                    {e.y} {e.t.replace(/[((].*$/, "")}
                  </a>
                </span>
              ))}
              {RECENT.items.length > RECENT.picks.length &&
                ` ほか${RECENT.items.length - RECENT.picks.length}件`}
            </div>
          )}
          {FEATURES.length > 0 && (
            <div
              style={{
                marginTop: 6, fontSize: 11.5, lineHeight: 1.7, color: "#6b7280",
                background: "#eef1f5", border: "1px solid #dde2e8",
                borderRadius: 8, padding: "7px 12px",
              }}
            >
              <span style={{ fontWeight: 700, color: "#37414f" }}>最近の新機能</span>{" "}
              {FEATURES.slice(0, 2).map((f, i) => (
                <span key={i}>
                  {i > 0 && " / "}
                  <span style={{ fontFamily: mono, fontSize: 10.5 }}>{f.d}</span> {f.t}
                </span>
              ))}
            </div>
          )}
        </header>

        <section
          aria-label="はじめて使う方へ"
          style={{
            background: "#fffdf8",
            border: "1px solid #eadfce",
            borderRadius: 12,
            padding: "12px 14px",
            marginBottom: 14,
          }}
        >
          <div
            style={{
              fontSize: 14,
              fontWeight: 800,
              color: "#5f5142",
            }}
          >
            はじめて使う方へ
          </div>

          <div
            style={{
              fontSize: 11.5,
              lineHeight: 1.7,
              color: "#6b7280",
              marginTop: 3,
            }}
          >
            生年を合わせるだけで、出来事を「そのとき何歳だったか」で読めます。
            自分史や年表の変更は、ブラウザ内に保存できます。
          </div>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 8,
              marginTop: 10,
            }}
          >
            <button
              type="button"
              onClick={() => {
                setSetupOpen(true);
                setTimeout(() => {
                  document
                    .getElementById("timeline-settings")
                    ?.scrollIntoView({
                      behavior: "smooth",
                      block: "start",
                    });
                }, 0);
              }}
              style={{
                flex: "1 1 190px",
                fontFamily: font,
                fontSize: 12,
                fontWeight: 800,
                lineHeight: 1.5,
                textAlign: "left",
                cursor: "pointer",
                padding: "9px 12px",
                borderRadius: 9,
                border: "1px solid #c9b999",
                background: "#ffffff",
                color: "#5f5142",
              }}
            >
              ①あなたの設定
            </button>

            <button
              type="button"
              onClick={() => {
                if (personalEventsSource !== "server") {
                  setPersonalEditorOpen(true);
                  setPersonalAddOpen(true);
                  setEditingPersonalId(null);
                  resetPersonalDraft();
                }
                setTimeout(() => {
                  document
                    .getElementById("personal-history")
                    ?.scrollIntoView({
                      behavior: "smooth",
                      block: "start",
                    });
                }, 0);
              }}
              style={{
                flex: "1 1 190px",
                fontFamily: font,
                fontSize: 12,
                fontWeight: 800,
                lineHeight: 1.5,
                textAlign: "left",
                cursor: "pointer",
                padding: "9px 12px",
                borderRadius: 9,
                border: "1px solid #cfbfdf",
                background: "#ffffff",
                color: "#5f4a72",
              }}
            >
              ②自分史の編集
            </button>

            <button
              type="button"
              onClick={() => {
                setEventCustomizationEditorOpen(true);
                setEventAddOpen(false);
                resetEventAddDraft();
                setTimeout(() => {
                  document
                    .getElementById("timeline-customization")
                    ?.scrollIntoView({
                      behavior: "smooth",
                      block: "start",
                    });
                }, 0);
              }}
              style={{
                flex: "1 1 190px",
                fontFamily: font,
                fontSize: 12,
                fontWeight: 800,
                lineHeight: 1.5,
                textAlign: "left",
                cursor: "pointer",
                padding: "9px 12px",
                borderRadius: 9,
                border: "1px solid #bdd0e5",
                background: "#ffffff",
                color: "#365f7d",
              }}
            >
              ③共通年表の編集
            </button>
          </div>
        </section>

        {/* 旧小分類：あなた版では現在使用しない */}
        <div
          style={{
            display: "none",
            background: "#fff", border: "1px solid #e2e4e8", borderRadius: 12,
            padding: "12px 16px", marginBottom: 14,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8, flexWrap: "wrap" }}>
            <span style={{ fontSize: 13, fontWeight: 700 }}>興味のある分野</span>
            <span style={{ fontSize: 11, color: "#8a8f98" }}>チェックを外した分野は年表から消えます</span>
            <span style={{ flex: 1 }} />
            <button onClick={() => setAllSubs(true)} style={miniBtn}>全部オン</button>
            <button onClick={() => setAllSubs(false)} style={miniBtn}>全部オフ</button>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {Object.entries(SUBS).map(([k, v]) => {
              const on = subOn(k);
              const c = CAT[v.c].bg;
              return (
                <label
                  key={k}
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 5, cursor: "pointer",
                    fontSize: 12, fontWeight: 700, padding: "4px 10px", borderRadius: 999,
                    border: `1.5px solid ${on ? c : "#d5d8dd"}`,
                    background: on ? `${c}12` : "transparent",
                    color: on ? c : "#a0a4ab",
                  }}
                >
                  <input
                    type="checkbox" checked={on} onChange={() => toggleSub(k)}
                    style={{ accentColor: c, margin: 0, cursor: "pointer" }}
                  />
                  {v.label}
                </label>
              );
            })}
          </div>
        </div>

        {/* 共通年表の表示設定 */}
        <div
          role="group"
          aria-label="共通年表の表示設定"
          style={{
            display: "flex",
            gap: 8,
            marginBottom: 24,
            flexWrap: "wrap",
            alignItems: "center",
            background: "#fff",
            border: "1px solid #e2e4e8",
            borderRadius: 12,
            padding: "12px 14px",
          }}
        >
          <div
            style={{
              flexBasis: "100%",
              fontSize: 14,
              fontWeight: 800,
              color: "#4b5563",
              marginBottom: 3,
            }}
          >
            共通年表の表示設定
          </div>
          <div
            style={{
              display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap",
              width: "100%",
              marginBottom: 2,
            }}
          >
            <span
              style={{
                display: "inline-flex", alignItems: "baseline", gap: 5,
                padding: "5px 10px", borderRadius: 8,
                background: "#eef1f5", border: "1px solid #d7dce2",
                color: "#37414f", fontSize: 12, fontWeight: 700,
              }}
            >
              現在表示
              <strong style={{ fontFamily: mono, fontSize: 20, lineHeight: 1 }}>
                {grouped.shown + grouped.myShown}
              </strong>
              件
            </span>
            {grouped.myShown > 0 && (
              <span style={{ fontSize: 11, color: "#6b7280" }}>
                公開{grouped.shown}件＋個人史{grouped.myShown}件
              </span>
            )}
          {MAIN_CATS.map((k) => {
            const on = catOn(k);
            return (
              <button
                key={k}
                onClick={() => toggleCat(k)}
                style={{
                  fontFamily: font, fontSize: 12, fontWeight: 700, cursor: "pointer",
                  padding: "6px 14px", borderRadius: 999,
                  border: `1.5px solid ${CAT[k].border}`,
                  background: on ? CAT[k].bg : CAT[k].soft,
                  color: on ? CAT[k].fg : CAT[k].border,
                }}
              >
                {CAT[k].label}
              </button>
            );
          })}
          <button
            onClick={toggleMyEvents}
            style={{
              fontFamily: font, fontSize: 12, fontWeight: 700, cursor: "pointer",
              padding: "6px 14px", borderRadius: 999,
              border: `1.5px solid ${CAT.me.border}`,
              background: showMe ? CAT.me.bg : CAT.me.soft,
              color: showMe ? CAT.me.fg : CAT.me.border,
            }}
          >
            {CAT.me.label}
          </button>

          <button
            type="button"
            onClick={openThreadWindow}
            style={{
              fontFamily: font,
              fontSize: 12,
              fontWeight: 800,
              cursor: "pointer",
              padding: "6px 14px",
              borderRadius: 999,
              marginLeft: 0,
              marginRight: 20,
              border: "1.5px solid #d1d5db",
              background: "#f3f4f6",
              color: "#6b7280",
            }}
          >
            テーマの糸
          </button>

          </div>
          <div
            role="group"
            aria-label="分類の一括表示切替"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              padding: 4,
              borderRadius: 10,
              background: "#edf7f0",
              border: "1px solid #d9eadf",
              marginRight: 6,
            }}
          >
            <span
              style={{
                fontSize: 11.5,
                fontWeight: 800,
                color: "#4f765d",
                padding: "0 4px",
              }}
            >
              分類
            </span>

            <button
              onClick={() => setAllCats(true)}
              style={{
                ...miniBtn,
                fontSize: 12,
                fontWeight: 800,
                border: "1.5px solid #4f765d",
                background: "#ffffff",
                color: "#42654f",
              }}
            >
              全てON
            </button>

            <button
              onClick={() => setAllCats(false)}
              style={{
                ...miniBtn,
                fontSize: 12,
                border: "1px dashed #8da394",
                background: "#e4efe7",
                color: "#657a6c",
              }}
            >
              全てOFF
            </button>
          </div>

          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              padding: 4,
              borderRadius: 10,
              background: "#f5f1e8",
              border: "1px solid #e7dfcf",
              marginRight: 6,
            }}
          >
            <span
              style={{
                fontSize: 12,
                color: "#776d5c",
                marginLeft: 3,
                marginRight: 3,
              }}
            >
              表示量
            </span>

            <button
              onClick={() => setImportanceMin(3)}
              aria-pressed={importanceMin === 3}
              style={
                importanceMin === 3
                  ? {
                      ...miniBtn,
                      fontSize: 12,
                      background: "#e6e9ee",
                      borderColor: "#8a93a3",
                      fontWeight: 800,
                    }
                  : { ...miniBtn, fontSize: 12 }
              }
            >
              重要
            </button>

            <button
              onClick={() => setImportanceMin(2)}
              aria-pressed={importanceMin === 2}
              style={
                importanceMin === 2
                  ? {
                      ...miniBtn,
                      fontSize: 12,
                      background: "#e6e9ee",
                      borderColor: "#8a93a3",
                      fontWeight: 800,
                    }
                  : { ...miniBtn, fontSize: 12 }
              }
            >
              標準
            </button>

            <button
              onClick={() => setImportanceMin(1)}
              aria-pressed={importanceMin === 1}
              style={
                importanceMin === 1
                  ? {
                      ...miniBtn,
                      fontSize: 12,
                      background: "#e6e9ee",
                      borderColor: "#8a93a3",
                      fontWeight: 800,
                    }
                  : { ...miniBtn, fontSize: 12 }
              }
            >
              全部
            </button>
          </div>

          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              flexWrap: "wrap",
            }}
          >
            <div
              role="group"
              aria-label="期間の一括開閉"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                padding: 4,
                borderRadius: 10,
                background: "#f7f2ea",
                border: "1px solid #eadfce",
              }}
            >
              <span
                style={{
                  fontSize: 11.5,
                  fontWeight: 800,
                  color: "#7a6a55",
                  padding: "0 4px",
                }}
              >
                期間
              </span>

              <button
                onClick={() => setClosedStages(new Set())}
                style={{
                  ...miniBtn,
                  fontSize: 12,
                  fontWeight: 800,
                  border: "1.5px solid #7a6a55",
                  background: "#ffffff",
                  color: "#6b5a45",
                }}
              >
                開
              </button>

              <button
                onClick={() =>
                  setClosedStages(new Set(grouped.groups.map((g) => g.key)))
                }
                style={{
                  ...miniBtn,
                  fontSize: 12,
                  border: "1px dashed #a99b88",
                  background: "#eee8dd",
                  color: "#7d7468",
                }}
              >
                閉
              </button>
            </div>

            <div
              role="group"
              aria-label="解説の一括開閉"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                padding: 4,
                borderRadius: 10,
                background: "#eef4f8",
                border: "1px solid #dce6ee",
              }}
            >
              <span
                style={{
                  fontSize: 11.5,
                  fontWeight: 800,
                  color: "#4f7089",
                  padding: "0 4px",
                }}
              >
                解説
              </span>

              <button
                onClick={() =>
                  setOpen(new Set(grouped.groups.flatMap((g) => g.items.map(eid))))
                }
                style={{
                  ...miniBtn,
                  fontSize: 12,
                  fontWeight: 800,
                  border: "1.5px solid #4f7089",
                  background: "#ffffff",
                  color: "#405f76",
                }}
              >
                開
              </button>

              <button
                onClick={() => setOpen(new Set())}
                style={{
                  ...miniBtn,
                  fontSize: 12,
                  border: "1px dashed #90a2b0",
                  background: "#e3edf4",
                  color: "#647785",
                }}
              >
                閉
              </button>
            </div>
          </div>

          <div
            style={{
              display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap",
              width: "100%", marginTop: 6,
            }}
          >
            <label
              htmlFor="timeline-search"
              style={{ fontSize: 13, fontWeight: 700, color: "#6b7280" }}
            >
              検索
            </label>
            <input
              id="timeline-search"
              type="search"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="例: AI && 教育 / (DNA || RNA) && 研究"
              autoComplete="off"
              style={{
                flex: "0 1 300px", minWidth: 180, maxWidth: 300,
                fontFamily: font, fontSize: 13, padding: "7px 10px",
                borderRadius: 8,
                border: `1px solid ${grouped.searchError ? "#c2452d" : "#d5d8dd"}`,
                background: "#fff", color: "#22272e",
              }}
            />
            {searchText && (
              <button onClick={() => setSearchText("")} style={miniBtn}>
                検索をクリア
              </button>
            )}
            <span
              style={{
                flex: "1 1 230px",
                minWidth: 210,
                fontSize: 10.5,
                lineHeight: 1.45,
                color: grouped.searchError ? "#b33b2e" : "#8a8f98",
              }}
              role={grouped.searchError ? "alert" : undefined}
            >
              {grouped.searchError || (
                <>
                  {"&& = AND、|| = OR、( ) = 優先指定。"}
                  <br />
                  {"空白・読点・カンマもANDです。"}
                </>
              )}
            </span>
          </div>

          <div
            style={{
              flexBasis: "100%",
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              gap: 10,
              fontSize: 10.5,
              color: "#8a8f98",
              marginTop: 2,
            }}
          >
            <span>アイコン色＝主分類、色ドット＝副分類</span>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
              }}
            >
              重要度:
              <ImportanceBadge level={3} /> L3 重要
              <ImportanceBadge level={2} /> L2 標準
              <ImportanceBadge level={1} /> L1 補足
            </span>
          </div>

        </div>

        {/* 学齢期グループ */}
        {grouped.groups.map((g, gi) => {
        const stageClosed = searchText.trim() ? false : closedStages.has(g.key);
        return (
          <section key={gi} style={{ marginBottom: 22 }}>
            <button
              onClick={() => toggleStage(g.key)}
              aria-expanded={!stageClosed}
              style={{
                display: "flex", alignItems: "baseline", gap: 10, width: "100%",
                borderTop: "none", borderRight: "none", borderBottom: "none",
                borderLeftWidth: 6, borderLeftStyle: "solid", borderLeftColor: g.stage.color,
                background: g.stage.bg, borderRadius: 8,
                padding: "8px 14px", marginBottom: 8,
                cursor: "pointer", textAlign: "left", fontFamily: font,
              }}
            >
              <h2 style={{ fontSize: 16, fontWeight: 800, margin: 0, color: g.stage.color }}>
                {g.stage.label}
                {(g.era || g.eraSpan) && (
                  <span style={{ fontSize: 13, fontWeight: 700, opacity: 0.75 }}>
                    {" / "}{g.era ? g.era.label : g.eraSpan}
                  </span>
                )}
              </h2>
              <span style={{ fontFamily: mono, fontSize: 12, color: "#6b7280" }}>
                {g.items[0].y}–{g.items[g.items.length - 1].y}
              </span>
              <span style={{ flex: 1 }} />
              <span style={{ fontFamily: mono, fontSize: 11.5, color: "#8a8f98" }}>
                {g.items.length}件
              </span>
              <span style={{ fontSize: 11, color: g.stage.color }} aria-hidden="true">
                {stageClosed ? "▶" : "▼"}
              </span>
            </button>
            {!stageClosed && (
            <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
              {g.items.map((ev, i) => {
                if (ev.cat === "me") {
                  const id = eid(ev);
                  const isOpen = open.has(id);
                  return (
                    <li
                      key={ev.id}
                      id={`ev-${id}`}
                      style={{ borderBottom: "1px solid #ececea", background: "#f2faf6" }}
                    >
                      <button
                        onClick={() => toggle(id)}
                        aria-expanded={isOpen}
                        style={{
                          display: "flex", alignItems: "flex-start", gap: 10,
                          padding: "8px 4px", width: "100%", textAlign: "left",
                          background: "none", border: "none", cursor: "pointer",
                          fontFamily: font,
                        }}
                      >
                        <span style={{ fontFamily: mono, fontSize: 13, color: "#8a8f98", width: 44, flexShrink: 0, paddingTop: 3 }}>
                          {ev.y}
                        </span>
                        <span
                          style={{
                            flexShrink: 0, minWidth: 44, textAlign: "center",
                            fontSize: 13, fontWeight: 800,
                            ...gradeBadgeStyle(g.stage, ev.age),
                            borderRadius: 6, padding: "3px 8px",
                          }}
                        >
                          {grouped.gradeLabel(ev.y)}
                        </span>
                        <Icon name={ev.ic ?? "flag"} color={CAT.me.bg} />
                        <span style={{ fontSize: 14, lineHeight: 1.55, flex: 1, fontWeight: 700, color: CAT.me.bg }}>
                          {ev.t}
                        </span>
                        <span
                          style={{
                            fontSize: 11, color: "#b0b4bb", paddingTop: 4, flexShrink: 0,
                            transform: isOpen ? "rotate(90deg)" : "none",
                            transition: "transform 0.15s",
                          }}
                          aria-hidden="true"
                        >
                          ▶
                        </span>
                      </button>

                      {isOpen && personalEventsSource === "browser" && (
                        <div
                          style={{
                            display: "flex",
                            gap: 8,
                            margin: "0 4px 8px 108px",
                          }}
                        >
                          <button
                            type="button"
                            onClick={() => startEditingPersonalEvent(ev)}
                            style={miniBtn}
                          >
                            修正
                          </button>

                          <button
                            type="button"
                            onClick={() => deletePersonalEvent(ev)}
                            style={{
                              ...miniBtn,
                              color: "#9b2c2c",
                              border: "1px solid #d8a4a4",
                              background: "#fff7f7",
                            }}
                          >
                            削除
                          </button>
                        </div>
                      )}

                      {isOpen && ev.n && (
                        <div
                          style={{
                            margin: "0 4px 10px 108px",
                            padding: "10px 14px",
                            fontSize: 13, lineHeight: 1.75, color: "#3d4450",
                            background: g.stage.bg,
                            borderLeft: `3px solid ${CAT.me.bg}`,
                            borderRadius: "0 8px 8px 0",
                          }}
                        >
                          <div
                            style={{
                              marginBottom: 6, fontSize: 11.5, fontWeight: 700,
                              color: "#6b7280",
                            }}
                          >
                            日付：{formatEventDate(ev.date)}
                          </div>
                          {ev.n}

                          {ev.note && (
                            <div
                              style={{
                                marginTop: 9, padding: "7px 10px",
                                border: "1px solid #d8dce2", borderRadius: 7,
                                background: "#ffffff88", color: "#626974",
                                fontSize: 11.5, lineHeight: 1.65,
                              }}
                            >
                              <span style={{ fontWeight: 800 }}>補足：</span>
                              {ev.note}
                            </div>
                          )}
                        </div>
                      )}
                    </li>
                  );
                }
                const id = eid(ev);
                const isOpen = open.has(id);
                const grade = grouped.gradeLabel(ev.y);
                const shareText =
                  (ev.age < 0
                    ? `${ev.y}年(生まれる前)`
                    : `${ev.y}年・${grade}のとき`) + `:${ev.t} ${HASHTAG}`;
                const secondaryCats = (ev.cats ?? []).filter(
                  (category) => category !== ev.cat
                );
                return (
                  <li key={i} id={`ev-${id}`} style={{ borderBottom: "1px solid #ececea" }}>
                    <button
                      onClick={() => toggle(id)}
                      aria-expanded={isOpen}
                      style={{
                        display: "flex", alignItems: "flex-start", gap: 10,
                        padding: "8px 4px", width: "100%", textAlign: "left",
                        background: "none", border: "none", cursor: "pointer",
                        fontFamily: font, color: "#22272e",
                      }}
                    >
                      <span
                        style={{
                          fontFamily: mono, fontSize: 13, color: "#8a8f98",
                          width: 44, flexShrink: 0, paddingTop: 3,
                        }}
                      >
                        {ev.y}
                      </span>
                      <span
                        style={{
                          flexShrink: 0, minWidth: 44, textAlign: "center",
                          fontSize: 13, fontWeight: 800,
                          ...gradeBadgeStyle(g.stage, ev.age),
                          borderRadius: 6, padding: "3px 8px",
                        }}
                      >
                        {grade}
                      </span>
                      <ImportanceBadge level={ev.importance} />
                      <Icon name={ev.ic} color={CAT[ev.cat].bg} />

                      <span style={{ fontSize: 14, lineHeight: 1.55, flex: 1 }}>
                        {ev.cats?.includes("sf") && (
                          <span
                            title="SF作品"
                            aria-label="SF作品"
                            style={{
                              display: "inline-block",
                              marginRight: 6,
                              padding: "1px 5px",
                              borderRadius: 5,
                              fontSize: 10.5,
                              lineHeight: 1.4,
                              fontWeight: 800,
                              letterSpacing: 0.2,
                              color: CAT.sf.fg,
                              background: CAT.sf.bg,
                              verticalAlign: 1,
                            }}
                          >
                            ＊SF
                          </span>
                        )}
                        {ev.t}
                      </span>

                      {secondaryCats.length > 0 && (
                        <span
                          style={{
                            display: "inline-flex",
                            gap: 3,
                            alignItems: "center",
                            flexShrink: 0,
                            paddingTop: 7,
                          }}
                          aria-label={`副分類: ${secondaryCats
                            .map((k) => CAT[k]?.label)
                            .filter(Boolean)
                            .join("・")}`}
                        >
                          {secondaryCats.map((k) => (
                            <span
                              key={k}
                              title={CAT[k]?.label || k}
                              style={{
                                display: "inline-block",
                                width: 7,
                                height: 7,
                                borderRadius: "50%",
                                background: CAT[k]?.bg || "#999",
                              }}
                            />
                          ))}
                        </span>
                      )}

                      <span
                        style={{
                          fontSize: 11, color: "#b0b4bb", paddingTop: 4, flexShrink: 0,
                          transform: isOpen ? "rotate(90deg)" : "none",
                          transition: "transform 0.15s",
                        }}
                        aria-hidden="true"
                      >
                        ▶
                      </span>
                    </button>
                    {isOpen && ev.n && (
                      <div
                        style={{
                          margin: "0 4px 10px 108px",
                          padding: "10px 14px",
                          fontSize: 13, lineHeight: 1.75, color: "#3d4450",
                          background: g.stage.bg,
                          borderLeft: `3px solid ${CAT[ev.cat].bg}`,
                          borderRadius: "0 8px 8px 0",
                        }}
                      >
                        <div
                          style={{
                            marginBottom: 6, fontSize: 11.5, fontWeight: 700,
                            color: "#6b7280",
                          }}
                        >
                          日付：{formatEventDate(ev.date)}
                        </div>
                        {ev.n}
                        {ev.q && (
                          <div style={{ marginTop: 8, display: "flex", flexWrap: "wrap", gap: 6 }}>
                            <a
                              href={`https://www.amazon.co.jp/s?k=${encodeURIComponent(ev.q)}`}
                              target="_blank" rel="noopener noreferrer"
                              style={{
                                fontSize: 11.5, fontWeight: 700, color: "#fff",
                                textDecoration: "none", borderRadius: 999,
                                padding: "3px 12px", background: "#b0771e",
                              }}
                            >
                              Amazonで探す
                            </a>
                            <a
                              href={`https://www.youtube.com/results?search_query=${encodeURIComponent(ev.q)}`}
                              target="_blank" rel="noopener noreferrer"
                              style={{
                                fontSize: 11.5, fontWeight: 700, color: "#fff",
                                textDecoration: "none", borderRadius: 999,
                                padding: "3px 12px", background: "#c2452d",
                              }}
                            >
                              YouTubeで探す
                            </a>
                          </div>
                        )}
                        {ev.l && (
                          <div style={{ marginTop: 8, display: "flex", flexWrap: "wrap", gap: 6 }}>
                            {ev.l.map((t) => {
                              // TSVでは "|" をソース間の区切りに使うので、
                              // 1ソース内の「対象::表示名」は "::" で分ける。
                              // 外部URLは "https://…::表示名"、Wikipediaは "記事名::表示名"。
                              const [rawTarget, rawLabel] = t.split("::");
                              const ext = rawTarget.startsWith("http");
                              const en = rawTarget.startsWith("en:");
                              const article = en ? rawTarget.slice(3) : rawTarget;
                              const title = rawLabel || (ext ? rawTarget : article);
                              const url = ext
                                ? rawTarget
                                : (en
                                    ? "https://en.wikipedia.org/wiki/"
                                    : "https://ja.wikipedia.org/wiki/") +
                                  encodeURIComponent(article.replace(/ /g, "_"));
                              return (
                                <a
                                  key={t}
                                  href={url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={{
                                    fontSize: 11.5, fontWeight: 700,
                                    color: CAT[ev.cat].bg, textDecoration: "none",
                                    border: `1px solid ${CAT[ev.cat].bg}44`,
                                    borderRadius: 999, padding: "2px 10px",
                                    background: "#ffffffaa",
                                  }}
                                >
                                  {ext ? "▶ " : "W: "}{title}{en ? " (en)" : ""}
                                </a>
                              );
                            })}
                          </div>
                        )}
                        {ev.note && (
                          <div
                            style={{
                              marginTop: 9, padding: "7px 10px",
                              border: "1px solid #d8dce2", borderRadius: 7,
                              background: "#ffffff88", color: "#626974",
                              fontSize: 11.5, lineHeight: 1.65,
                            }}
                          >
                            <span style={{ fontWeight: 800 }}>補足：</span>
                            {ev.note}
                          </div>
                        )}
                        <div
                          style={{
                            marginTop: 10, paddingTop: 8, borderTop: "1px dashed #d5d8dd",
                            display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap",
                          }}
                        >
                          <SpeakButton ev={ev} rate={speed} color={CAT[ev.cat].bg} />

                          {(eventCustomizations.additions ?? []).some(
                            (item) => item.id === id
                          ) ? (
                            <button
                              type="button"
                              onClick={() => deleteAddedEvent(ev)}
                              style={{
                                ...miniBtn,
                                color: "#8b4a35",
                                border: "1px solid #d6b3a5",
                                background: "#fff8f5",
                              }}
                            >
                              削除
                            </button>
                          ) : (
                            <>
                              <button
                                type="button"
                                onClick={() => startEditingEvent(ev)}
                                style={{
                                  ...miniBtn,
                                  ...(editingEventId === id
                                    ? {
                                        background: "#e8f1ff",
                                        border: "1px solid #6f98d5",
                                        color: "#28568f",
                                      }
                                    : {}),
                                }}
                              >
                                修正
                              </button>

                              <button
                                type="button"
                                onClick={() => hideEvent(ev)}
                                style={{
                                  ...miniBtn,
                                  color: "#8b4a35",
                                  border: "1px solid #d6b3a5",
                                  background: "#fff8f5",
                                }}
                              >
                                非表示
                              </button>
                            </>
                          )}

                          <ShareBar
                            compact
                            color={CAT[ev.cat].bg}
                            text={shareText}
                            note={ev.n}
                            url={`${SHARE_URL}?e=${encodeURIComponent(id)}`}
                          />
                        </div>

                        {editingEventId === id && (
                          <form
                            onSubmit={(e) => {
                              e.preventDefault();
                              saveEditedEvent(ev);
                            }}
                            style={{
                              marginTop: 10,
                              padding: 10,
                              border: "1px solid #cfdce8",
                              borderRadius: 8,
                              background: "#ffffffaa",
                            }}
                          >
                            <div
                              style={{
                                fontSize: 11.5,
                                fontWeight: 800,
                                color: "#365f7d",
                                marginBottom: 7,
                              }}
                            >
                              この年表項目を修正
                            </div>

                            <input
                              type="text"
                              required
                              value={eventEditDraft.title}
                              onChange={(e) =>
                                setEventEditDraft((prev) => ({
                                  ...prev,
                                  title: e.target.value,
                                }))
                              }
                              placeholder="タイトル"
                              aria-label="年表項目タイトル"
                              style={{
                                boxSizing: "border-box",
                                width: "100%",
                                fontFamily: font,
                                fontSize: 12,
                                padding: "7px 9px",
                                border: "1px solid #cfd3d8",
                                borderRadius: 7,
                              }}
                            />

                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 8,
                                marginTop: 8,
                              }}
                            >
                              <label
                                style={{
                                  fontSize: 11.5,
                                  fontWeight: 700,
                                  color: "#365f7d",
                                }}
                              >
                                重要度
                              </label>

                              <select
                                value={eventEditDraft.importance}
                                onChange={(e) =>
                                  setEventEditDraft((prev) => ({
                                    ...prev,
                                    importance: Number(e.target.value),
                                  }))
                                }
                                style={{
                                  fontFamily: font,
                                  fontSize: 12,
                                  padding: "6px 8px",
                                  border: "1px solid #cfd3d8",
                                  borderRadius: 7,
                                }}
                              >
                                <option value={3}>L3 重要</option>
                                <option value={2}>L2 標準</option>
                                <option value={1}>L1 補足</option>
                              </select>
                            </div>

                            <textarea
                              required
                              value={eventEditDraft.summary}
                              onChange={(e) =>
                                setEventEditDraft((prev) => ({
                                  ...prev,
                                  summary: e.target.value,
                                }))
                              }
                              placeholder="概要"
                              aria-label="年表項目概要"
                              rows={4}
                              style={{
                                display: "block",
                                boxSizing: "border-box",
                                width: "100%",
                                marginTop: 8,
                                fontFamily: font,
                                fontSize: 12,
                                lineHeight: 1.6,
                                padding: "7px 9px",
                                border: "1px solid #cfd3d8",
                                borderRadius: 7,
                                resize: "vertical",
                              }}
                            />

                            <div
                              style={{
                                display: "flex",
                                gap: 8,
                                marginTop: 9,
                              }}
                            >
                              <button type="submit" style={miniBtn}>
                                変更を保存
                              </button>

                              <button
                                type="button"
                                onClick={cancelEditingEvent}
                                style={miniBtn}
                              >
                                キャンセル
                              </button>
                            </div>
                          </form>
                        )}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
            )}
          </section>
        );
        })}

        <div
          style={{
            display: "none", alignItems: "center", gap: 10, flexWrap: "wrap",
            background: "#fff", border: "1px solid #e2e4e8", borderRadius: 12,
            padding: "12px 16px", marginTop: 8,
          }}
        >
          <span style={{ fontSize: 13, fontWeight: 700 }}>この年表を共有</span>
          <a
            href="https://www.techno-edge.net/article/2026/08/05/5365.html"
            target="_blank" rel="noopener noreferrer"
            style={{
              fontSize: 11.5, fontWeight: 700, textDecoration: "none",
              borderRadius: 999, padding: "4px 12px",
              border: "1px solid #b0771e", background: "#b0771e", color: "#fff",
            }}
          >
            この年表の解説記事(CloseBox)
          </a>
          <a
            href="https://www.techno-edge.net/article/2026/08/04/5360.html"
            target="_blank" rel="noopener noreferrer"
            style={{
              fontSize: 11.5, fontWeight: 700, textDecoration: "none",
              borderRadius: 999, padding: "4px 12px",
              border: "1px solid #b0771e44", background: "#fdf3e0", color: "#8a5a12",
            }}
          >
            公開時の記事
          </a>
          <a
            href="https://www.techno-edge.net/special/388/recent/CloseBox"
            target="_blank" rel="noopener noreferrer"
            style={{
              fontSize: 11.5, fontWeight: 700, textDecoration: "none",
              borderRadius: 999, padding: "4px 12px",
              border: "1px solid #b0771e44", background: "#fdf3e0", color: "#8a5a12",
            }}
          >
            連載「CloseBox」を読む
          </a>
          <ShareBar
            text={`${APP_TITLE}——6つのテーマで時代を自分の年齢から読む(${EVENTS.length}項目) ${HASHTAG}`}
          />
        </div>

        <div
          id="timeline-customization"
          style={{
            scrollMarginTop: 16,
            background: "#f3f7fb",
            border: "1px solid #cfdce8",
            borderRadius: 12,
            padding: "12px 16px",
            marginTop: 16,
            marginBottom: 14,
          }}
        >
          <div
            style={{
              fontSize: 14,
              fontWeight: 800,
              color: "#365f7d",
            }}
          >
            ③共通年表の編集
          </div>

          <div
            style={{
              fontSize: 11.5,
              lineHeight: 1.7,
              color: "#6b7280",
              marginTop: 4,
            }}
          >
            元の年表は変更せず、あなたの変更内容だけをこのブラウザに保存します。必要ならTSVファイルでバックアップできます。
          </div>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              gap: 8,
              marginTop: 10,
            }}
          >
            <span
              style={{
                fontSize: 12,
                fontWeight: 800,
                color: "#365f7d",
              }}
            >
              ●現在の年表：
              修正 {Object.keys(eventCustomizations.overrides ?? {}).length}件
              {" / "}
              非表示 {eventCustomizations.hidden?.length ?? 0}件
              {" / "}
              追加 {eventCustomizations.additions?.length ?? 0}件
            </span>

            <button
              type="button"
              onClick={clearEventCustomizations}
              disabled={
                Object.keys(eventCustomizations.overrides ?? {}).length === 0 &&
                (eventCustomizations.hidden?.length ?? 0) === 0 &&
                (eventCustomizations.additions?.length ?? 0) === 0
              }
              style={{
                ...miniBtn,
                background: "#fff3f3",
                border: "1px solid #e4bcbc",
                color: "#8a4f4f",
                ...(
                  Object.keys(eventCustomizations.overrides ?? {}).length === 0 &&
                  (eventCustomizations.hidden?.length ?? 0) === 0 &&
                  (eventCustomizations.additions?.length ?? 0) === 0
                    ? { opacity: 0.45, cursor: "not-allowed" }
                    : {}
                ),
              }}
            >
              年表の変更を消去
            </button>

            <input
              ref={eventCustomizationFileInputRef}
              type="file"
              accept=".tsv,text/tab-separated-values,text/plain"
              onChange={importEventCustomizationsFile}
              style={{ display: "none" }}
            />

            <button
              type="button"
              onClick={() =>
                eventCustomizationFileInputRef.current?.click()
              }
              style={{
                ...miniBtn,
                background: "#f0f6fd",
                border: "1px solid #bdd0e5",
                color: "#41698f",
              }}
            >
              ファイルから読込
            </button>

            <button
              type="button"
              onClick={() => {
                setEventCustomizationEditorOpen((value) => !value);
                setEventAddOpen(false);
                resetEventAddDraft();
              }}
              style={{
                ...miniBtn,
                fontWeight: 800,
                background: "#f5f0fa",
                border: "1px solid #cfbfdf",
                color: "#68517d",
                ...(eventCustomizationEditorOpen
                  ? {
                      background: "#ece3f5",
                      border: "1px solid #9f82b6",
                      color: "#5f3f76",
                    }
                  : {}),
              }}
            >
              編集
            </button>

            <button
              type="button"
              onClick={exportEventCustomizationsFile}
              style={{
                ...miniBtn,
                background: "#f0f8f2",
                border: "1px solid #bed8c5",
                color: "#4b7356",
              }}
            >
              ファイルに保存
            </button>
          </div>

          {eventCustomizationStatus && (
            <div
              style={{
                marginTop: 8,
                fontSize: 11.5,
                color: "#5f6770",
              }}
            >
              {eventCustomizationStatus}
            </div>
          )}

          {eventCustomizationEditorOpen && (
            <div
              style={{
                marginTop: 12,
                padding: 12,
                border: "1px solid #cfdce8",
                borderRadius: 10,
                background: "#fff",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <strong style={{ fontSize: 12, color: "#365f7d" }}>
                  年表の変更内容を編集
                </strong>

                <span style={{ flex: 1 }} />

                <button
                  type="button"
                  onClick={openNewEventForm}
                  style={{
                    ...miniBtn,
                    background: "#e7f1fb",
                    border: "1px solid #91b3d2",
                    color: "#315f87",
                    fontWeight: 800,
                  }}
                >
                  ＋追加
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setEventCustomizationEditorOpen(false);
                    setEventAddOpen(false);
                    resetEventAddDraft();
                  }}
                  style={{
                    ...miniBtn,
                    marginLeft: 6,
                  }}
                >
                  ×閉じる
                </button>
              </div>
            </div>
          )}

          {eventCustomizationEditorOpen && eventAddOpen && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                saveAddedEvent();
              }}
              style={{
                marginTop: 10,
                padding: 10,
                border: "1px solid #cfdce8",
                borderRadius: 8,
                background: "#ffffffaa",
              }}
            >
              <div
                style={{
                  fontSize: 11.5,
                  fontWeight: 800,
                  color: "#365f7d",
                  marginBottom: 7,
                }}
              >
                年表項目を追加
              </div>

              <input
                type="text"
                required
                value={eventAddDraft.date}
                onChange={(e) =>
                  setEventAddDraft((prev) => ({
                    ...prev,
                    date: e.target.value,
                  }))
                }
                placeholder="日付（YYYY / YYYY-MM / YYYY-MM-DD）"
                aria-label="追加項目の日付"
                style={{
                  boxSizing: "border-box",
                  width: "100%",
                  fontFamily: font,
                  fontSize: 12,
                  padding: "7px 9px",
                  border: "1px solid #cfd3d8",
                  borderRadius: 7,
                }}
              />

              <input
                type="text"
                required
                value={eventAddDraft.title}
                onChange={(e) =>
                  setEventAddDraft((prev) => ({
                    ...prev,
                    title: e.target.value,
                  }))
                }
                placeholder="タイトル"
                aria-label="追加項目のタイトル"
                style={{
                  boxSizing: "border-box",
                  width: "100%",
                  marginTop: 8,
                  fontFamily: font,
                  fontSize: 12,
                  padding: "7px 9px",
                  border: "1px solid #cfd3d8",
                  borderRadius: 7,
                }}
              />

              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  alignItems: "center",
                  gap: 10,
                  marginTop: 8,
                }}
              >
                <label
                  style={{
                    fontSize: 11.5,
                    fontWeight: 700,
                    color: "#365f7d",
                  }}
                >
                  分野
                </label>

                <select
                  value={eventAddDraft.category}
                  onChange={(e) =>
                    setEventAddDraft((prev) => ({
                      ...prev,
                      category: e.target.value,
                    }))
                  }
                  style={{
                    fontFamily: font,
                    fontSize: 12,
                    padding: "6px 8px",
                    border: "1px solid #cfd3d8",
                    borderRadius: 7,
                  }}
                >
                  {MAIN_CATS.map((key) => (
                    <option key={key} value={key}>
                      {CAT[key].label}
                    </option>
                  ))}
                </select>

                <label
                  style={{
                    fontSize: 11.5,
                    fontWeight: 700,
                    color: "#365f7d",
                  }}
                >
                  重要度
                </label>

                <select
                  value={eventAddDraft.importance}
                  onChange={(e) =>
                    setEventAddDraft((prev) => ({
                      ...prev,
                      importance: Number(e.target.value),
                    }))
                  }
                  style={{
                    fontFamily: font,
                    fontSize: 12,
                    padding: "6px 8px",
                    border: "1px solid #cfd3d8",
                    borderRadius: 7,
                  }}
                >
                  <option value={3}>L3 重要</option>
                  <option value={2}>L2 標準</option>
                  <option value={1}>L1 補足</option>
                </select>
              </div>

              <textarea
                required
                value={eventAddDraft.summary}
                onChange={(e) =>
                  setEventAddDraft((prev) => ({
                    ...prev,
                    summary: e.target.value,
                  }))
                }
                placeholder="概要"
                aria-label="追加項目の概要"
                rows={4}
                style={{
                  display: "block",
                  boxSizing: "border-box",
                  width: "100%",
                  marginTop: 8,
                  fontFamily: font,
                  fontSize: 12,
                  lineHeight: 1.6,
                  padding: "7px 9px",
                  border: "1px solid #cfd3d8",
                  borderRadius: 7,
                  resize: "vertical",
                }}
              />

              <div
                style={{
                  display: "flex",
                  gap: 8,
                  marginTop: 9,
                }}
              >
                <button type="submit" style={miniBtn}>
                  追加して保存
                </button>

                <button
                  type="button"
                  onClick={cancelAddingEvent}
                  style={miniBtn}
                >
                  キャンセル
                </button>
              </div>
            </form>
          )}

          {eventCustomizationEditorOpen &&
            (eventCustomizations.hidden?.length ?? 0) > 0 && (
            <div
              style={{
                marginTop: 10,
                paddingTop: 8,
                borderTop: "1px solid #dbe4ec",
              }}
            >
              <div
                style={{
                  fontSize: 11.5,
                  fontWeight: 800,
                  color: "#365f7d",
                  marginBottom: 5,
                }}
              >
                非表示中の項目
              </div>

              {eventCustomizations.hidden.map((id) => {
                const base = EVENTS.find(
                  (event) => event.id === id
                );

                return (
                  <div
                    key={id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "5px 0",
                    }}
                  >
                    <span
                      style={{
                        flex: 1,
                        minWidth: 0,
                        fontSize: 11.5,
                        color: "#4f5965",
                      }}
                    >
                      {base
                        ? `${base.y} ${base.t}`
                        : id}
                    </span>

                    <button
                      type="button"
                      onClick={() => restoreHiddenEvent(id)}
                      style={miniBtn}
                    >
                      表示に戻す
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div
          id="personal-history"
          style={{
            scrollMarginTop: 16,
            background: "#f7f2fb",
            border: "1px solid #dfd2ea",
            borderRadius: 12,
            padding: "12px 16px",
            marginTop: 16,
            marginBottom: 14,
          }}
        >
          <div style={{ fontSize: 14, fontWeight: 800, color: CAT.me.bg }}>
            ②自分史の編集
          </div>
          <div
            style={{
              fontSize: 11.5,
              lineHeight: 1.7,
              color: "#6b7280",
              marginTop: 4,
            }}
          >
            自分史はこのブラウザ内に保存されます。
            「編集」で追加・編集・削除し、年表表示は上の「自分」で切り替えます。
            必要ならTSVファイルでバックアップできます。
          </div>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              gap: 8,
              marginTop: 10,
            }}
          >
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                fontSize: 12,
                fontWeight: 800,
                color: "#5f4a72",
              }}
            >
              <span
                aria-hidden="true"
                style={{
                  width: 9,
                  height: 9,
                  borderRadius: "50%",
                  background:
                    personalEventsSource === "browser"
                      ? "#4f7fc7"
                      : personalEventsSource === "server"
                        ? "#d69232"
                        : "#a0a5ad",
                }}
              />
              現在の自分史：
              {personalEventsSource === "browser"
                ? `このブラウザ（${myEvents.length}件）`
                : personalEventsSource === "server"
                  ? `管理者データ（${myEvents.length}件）`
                  : "未読み込み"}
            </span>

            <button
              onClick={clearPersonalEventsFile}
              disabled={personalEventsSource !== "browser"}
              style={{
                ...miniBtn,
                background: "#fff3f3",
                border: "1px solid #e4bcbc",
                color: "#8a4f4f",
                ...(personalEventsSource !== "browser"
                  ? { opacity: 0.45, cursor: "not-allowed" }
                  : {}),
              }}
            >
              自分史を消去
            </button>

            <button
              onClick={() => personalFileInputRef.current?.click()}
              style={{
                ...miniBtn,
                background: "#f0f6fd",
                border: "1px solid #bdd0e5",
                color: "#41698f",
                ...(personalEventsSource === "browser"
                  ? {
                      background: "#e5f0fc",
                      border: "1px solid #7fa5d0",
                      color: "#28568f",
                      fontWeight: 800,
                    }
                  : {}),
              }}
            >
              ファイルから読込
            </button>

            <button
              onClick={() => {
                setPersonalEditorOpen((value) => !value);
                setPersonalAddOpen(false);
                setEditingPersonalId(null);
                resetPersonalDraft();
              }}
              disabled={personalEventsSource === "server"}
              style={{
                ...miniBtn,
                fontWeight: 800,
                background: "#f5f0fa",
                border: "1px solid #cfbfdf",
                color: "#68517d",
                ...(personalEventsSource === "server"
                  ? { opacity: 0.45, cursor: "not-allowed" }
                  : {}),
                ...(personalEditorOpen
                  ? {
                      background: "#ece3f5",
                      border: "1px solid #9f82b6",
                      color: "#5f3f76",
                    }
                  : {}),
              }}
            >
              編集
            </button>

            <button
              onClick={exportPersonalEventsFile}
              style={{
                ...miniBtn,
                background: "#f0f8f2",
                border: "1px solid #bed8c5",
                color: "#4b7356",
              }}
            >
              ファイルに保存
            </button>

            <details
              style={{
                marginLeft: 6,
                fontSize: 11,
                color: "#8a8f98",
              }}
            >
              <summary
                style={{
                  cursor: "pointer",
                  userSelect: "none",
                  padding: "4px 6px",
                }}
              >
                管理者向け
              </summary>

              <button
                type="button"
                onClick={loadServerPersonalEvents}
                style={{
                  ...miniBtn,
                  marginTop: 6,
                  ...(personalEventsSource === "server"
                    ? {
                        background: "#fff1dc",
                        border: "1px solid #d79a43",
                        color: "#8a5208",
                        fontWeight: 800,
                      }
                    : {}),
                }}
              >
                管理者データ読込
              </button>
            </details>

            <input
              ref={personalFileInputRef}
              type="file"
              accept=".tsv,text/tab-separated-values,text/plain"
              onChange={importPersonalEventsFile}
              style={{ display: "none" }}
            />
          </div>

          {personalEditorOpen && personalEventsSource !== "server" && (
            <div
              style={{
                marginTop: 12,
                padding: 12,
                border: "1px solid #dfd2ea",
                borderRadius: 10,
                background: "#fff",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  marginBottom: 8,
                }}
              >
                <strong style={{ fontSize: 12, color: "#5f4a72" }}>
                  自分史を編集
                </strong>

                <span style={{ fontSize: 11, color: "#7b818b" }}>
                  {myEvents.length}件
                </span>

                <span style={{ flex: 1 }} />

                <button
                  type="button"
                  onClick={openNewPersonalEventForm}
                  style={{
                    ...miniBtn,
                    background: "#e7f1fb",
                    border: "1px solid #91b3d2",
                    color: "#315f87",
                    fontWeight: 800,
                  }}
                >
                  ＋追加
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setPersonalEditorOpen(false);
                    setPersonalAddOpen(false);
                    setEditingPersonalId(null);
                    resetPersonalDraft();
                  }}
                  style={{
                    ...miniBtn,
                    marginLeft: 6,
                  }}
                >
                  ×閉じる
                </button>
              </div>

              {myEvents.length === 0 ? (
                <div
                  style={{
                    fontSize: 11.5,
                    color: "#7b818b",
                    padding: "8px 0",
                  }}
                >
                  自分史はまだありません。
                </div>
              ) : (
                <div
                  style={{
                    maxHeight: 320,
                    overflowY: "auto",
                    borderTop: "1px solid #ece7f0",
                  }}
                >
                  {myEvents.map((event) => (
                    <div
                      key={event.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        padding: "7px 2px",
                        borderBottom: "1px solid #ece7f0",
                      }}
                    >
                      <span
                        style={{
                          width: 88,
                          flexShrink: 0,
                          fontSize: 11,
                          color: "#747b86",
                        }}
                      >
                        {event.date}
                      </span>

                      <span
                        style={{
                          flex: 1,
                          minWidth: 0,
                          fontSize: 12,
                          color: "#333a44",
                        }}
                      >
                        {event.t}
                      </span>

                      <button
                        type="button"
                        onClick={() => startEditingPersonalEvent(event)}
                        style={miniBtn}
                      >
                        編集
                      </button>

                      <button
                        type="button"
                        onClick={() => deletePersonalEvent(event)}
                        style={{
                          ...miniBtn,
                          color: "#9b2c2c",
                          border: "1px solid #d8a4a4",
                          background: "#fff7f7",
                        }}
                      >
                        削除
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {personalAddOpen && personalEventsSource !== "server" && (
            <form
              id="personal-history-editor"
              onSubmit={(e) => {
                e.preventDefault();
                savePersonalEvent();
              }}
              style={{
                marginTop: 12,
                padding: 12,
                border: "1px solid #dfd2ea",
                borderRadius: 10,
                background: "#fff",
              }}
            >
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 800,
                  color: "#5f4a72",
                  marginBottom: 8,
                }}
              >
                {editingPersonalId ? "自分史を編集" : "自分史を追加"}
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "minmax(130px, 0.8fr) minmax(220px, 2fr)",
                  gap: 8,
                }}
              >
                <input
                  type="text"
                  required
                  value={personalDraft.date}
                  onChange={(e) =>
                    setPersonalDraft((prev) => ({
                      ...prev,
                      date: e.target.value,
                    }))
                  }
                  placeholder="日付 YYYY / YYYY-MM / YYYY-MM-DD"
                  aria-label="日付"
                  style={{
                    fontFamily: font,
                    fontSize: 12,
                    padding: "7px 9px",
                    border: "1px solid #cfd3d8",
                    borderRadius: 7,
                  }}
                />

                <input
                  type="text"
                  required
                  value={personalDraft.title}
                  onChange={(e) =>
                    setPersonalDraft((prev) => ({
                      ...prev,
                      title: e.target.value,
                    }))
                  }
                  placeholder="タイトル"
                  aria-label="タイトル"
                  style={{
                    fontFamily: font,
                    fontSize: 12,
                    padding: "7px 9px",
                    border: "1px solid #cfd3d8",
                    borderRadius: 7,
                  }}
                />
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginTop: 8,
                }}
              >
                <label
                  style={{
                    fontSize: 11.5,
                    fontWeight: 700,
                    color: "#5f4a72",
                  }}
                >
                  重要度
                </label>

                <select
                  value={personalDraft.importance}
                  onChange={(e) =>
                    setPersonalDraft((prev) => ({
                      ...prev,
                      importance: Number(e.target.value),
                    }))
                  }
                  style={{
                    fontFamily: font,
                    fontSize: 12,
                    padding: "6px 8px",
                    border: "1px solid #cfd3d8",
                    borderRadius: 7,
                  }}
                >
                  <option value={3}>L3 重要</option>
                  <option value={2}>L2 標準</option>
                  <option value={1}>L1 補足</option>
                </select>
              </div>

              <textarea
                required
                value={personalDraft.summary}
                onChange={(e) =>
                  setPersonalDraft((prev) => ({
                    ...prev,
                    summary: e.target.value,
                  }))
                }
                placeholder="概要"
                aria-label="概要"
                rows={3}
                style={{
                  display: "block",
                  boxSizing: "border-box",
                  width: "100%",
                  marginTop: 8,
                  fontFamily: font,
                  fontSize: 12,
                  lineHeight: 1.6,
                  padding: "7px 9px",
                  border: "1px solid #cfd3d8",
                  borderRadius: 7,
                  resize: "vertical",
                }}
              />

              <div
                style={{
                  display: "flex",
                  gap: 8,
                  marginTop: 9,
                }}
              >
                <button type="submit" style={miniBtn}>
                  {editingPersonalId ? "変更を保存" : "保存"}
                </button>

                <button
                  type="button"
                  onClick={closePersonalEventForm}
                  style={miniBtn}
                >
                  キャンセル
                </button>
              </div>
            </form>
          )}

          {personalEventsSource === "server" && (
            <div
              style={{
                fontSize: 10.5,
                lineHeight: 1.6,
                color: "#8a6a3d",
                marginTop: 8,
              }}
            >
              管理者データを表示中はブラウザ側の追加・編集を行いません。
            </div>
          )}

          {personalFileStatus && (
            <div
              role="status"
              style={{
                fontSize: 11,
                lineHeight: 1.6,
                color: "#6b7280",
                marginTop: 8,
              }}
            >
              {personalFileStatus}
            </div>
          )}
        </div>

        <div
          id="timeline-settings"
          style={{
            scrollMarginTop: 16,
            background: "#fff",
            border: "1px solid #e2e4e8",
            borderRadius: 12,
            marginBottom: 14,
            overflow: "hidden",
          }}
        >
        {/* 入力欄(畳めるようにしている) */}
        <button
          onClick={() => setSetupOpen((v) => !v)}
          aria-expanded={setupOpen}
          style={{
            display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", width: "100%",
            background: "#fff",
            border: "none",
            borderBottom: setupOpen ? "1px solid #e2e4e8" : "none",
            borderRadius: 0,
            padding: "10px 16px",
            cursor: "pointer", textAlign: "left", fontFamily: font, color: "#22272e",
          }}
        >
          <span
            style={{
              flexBasis: "100%",
              fontSize: 14,
              fontWeight: 800,
            }}
          >
            ①あなたの設定
          </span>
          <span
            style={{
              fontSize: 11.5,
              lineHeight: 1.7,
              color: "#6b7280",
            }}
          >
            {birth}年{month ? `${month}月` : ""}生まれ
            {higherEdY
              ? `・${higherEdY}年 ${HIGHER_ED_TYPES[higherEdType]?.label}`
              : ""}
            {graduateY
              ? `・${graduateY}年 大学院（${GRADUATE_TYPES[graduateType]?.label}）`
              : ""}
            {adultY
              ? `・社会人${adultY}年〜`
              : `・社会人${grouped.adultYear}年〜（自動）`}
            {retirementY ? `・自由人${retirementY}年〜` : ""}
          </span>
          <span style={{ flex: 1 }} />
          <span style={{ fontSize: 11, color: "#8a8f98" }}>{setupOpen ? "畳む ▼" : "変更する ▶"}</span>
        </button>

        {setupOpen && (<>
        {/* 生年入力 */}
        <div
          style={{
            display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap",
            padding: "14px 16px",
            borderBottom: "1px solid #eceef1",
          }}
        >
          <label style={{ fontSize: 13, fontWeight: 700 }}>生まれた年</label>
          <button onClick={() => setBirth((b) => Math.max(1930, b - 1))} style={btnStyle} aria-label="1年戻す">−</button>
          <span style={{ fontFamily: mono, fontSize: 24, fontWeight: 700, minWidth: 76, textAlign: "center" }}>
            {birth}
          </span>
          <button onClick={() => setBirth((b) => Math.min(2010, b + 1))} style={btnStyle} aria-label="1年進める">＋</button>
          <select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            style={{
              fontFamily: font, fontSize: 14, fontWeight: 700, cursor: "pointer",
              padding: "7px 8px", borderRadius: 8, border: "1px solid #d5d8dd",
              background: "#fff", color: "#22272e",
            }}
            aria-label="生まれた月"
          >
            <option value={0}>月(任意)</option>
            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
              <option key={m} value={m}>{m}月</option>
            ))}
          </select>
          <input
            type="range" min={1930} max={2010} value={birth}
            onChange={(e) => setBirth(Number(e.target.value))}
            style={{ flex: 1, minWidth: 140, accentColor: "#c2452d" }}
            aria-label="生まれた年スライダー"
          />
        </div>

        {/* 大学等・大学院・社会人・退職の境界年 */}
        <div
          style={{
            display: "flex", alignItems: "center", gap: 18, flexWrap: "wrap",
            padding: "12px 16px 14px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", width: "100%" }}>
            <label style={{ fontSize: 13, fontWeight: 700 }}>大学等に入学した年（西暦）</label>
            <input
              type="number" inputMode="numeric" min="1930" max="2100" placeholder="例: 1972"
              value={higherEdY}
              onChange={(e) => setHigherEdY(e.target.value)}
              style={{
                fontFamily: mono, fontSize: 14, width: 84, padding: "7px 8px",
                borderRadius: 8, border: "1px solid #d5d8dd",
              }}
              aria-label="大学等に入学した年（西暦）"
            />
            {higherEdY !== "" && (
              <button onClick={() => setHigherEdY("")} style={resetBtnStyle}>
                未設定に戻す
              </button>
            )}
            <span aria-hidden="true" style={{ flexBasis: "100%", height: 0 }} />
            <div role="group" aria-label="大学等の種類" style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {Object.entries(HIGHER_ED_TYPES).map(([key, value]) => {
                const selected = higherEdType === key;
                return (
                  <button
                    key={key}
                    onClick={() => setHigherEdType(key)}
                    aria-pressed={selected}
                    style={segmentBtnStyle(selected, "#6b3fa0", "#f1e9fa")}
                  >
                    {value.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", width: "100%" }}>
            <label style={{ fontSize: 13, fontWeight: 700 }}>大学院に入学した年（西暦）</label>
            <input
              type="number" inputMode="numeric" min="1930" max="2100" placeholder="例: 1976"
              value={graduateY}
              onChange={(e) => setGraduateY(e.target.value)}
              style={{
                fontFamily: mono, fontSize: 14, width: 84, padding: "7px 8px",
                borderRadius: 8, border: "1px solid #d5d8dd",
              }}
              aria-label="大学院に入学した年（西暦）"
            />
            {graduateY !== "" && (
              <button onClick={() => setGraduateY("")} style={resetBtnStyle}>
                未設定に戻す
              </button>
            )}
            {graduateY !== "" && (
              <div role="group" aria-label="大学院課程" style={{ display: "flex", gap: 6 }}>
                {Object.entries(GRADUATE_TYPES).map(([key, value]) => {
                  const selected = graduateType === key;
                  return (
                    <button
                      key={key}
                      onClick={() => setGraduateType(key)}
                      aria-pressed={selected}
                      style={segmentBtnStyle(selected, "#4a5fb0", "#eaeefb")}
                    >
                      {value.label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", width: "100%" }}>
            <label style={{ fontSize: 13, fontWeight: 700 }}>社会人になった年（西暦）</label>
            <input
              type="number" inputMode="numeric" min="1930" max="2100" placeholder={`自動: ${grouped.adultYear}`}
              value={adultY}
              onChange={(e) => setAdultY(e.target.value)}
              style={{
                fontFamily: mono, fontSize: 14, width: 84, padding: "7px 8px",
                borderRadius: 8, border: "1px solid #d5d8dd",
              }}
              aria-label="社会人になった年（西暦）"
            />
            {adultY !== "" && (
              <button onClick={() => setAdultY("")} style={resetBtnStyle}>
                未設定に戻す
              </button>
            )}
            {adultY === "" && (
              <span style={{ fontSize: 11, color: "#8a8f98" }}>
                現在の自動計算: {grouped.adultYear}年
              </span>
            )}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", width: "100%" }}>
            <label style={{ fontSize: 13, fontWeight: 700 }}>定年退職した年（西暦）</label>
            <input
              type="number" inputMode="numeric" min="1930" max="2100" placeholder="例: 2019"
              value={retirementY}
              onChange={(e) => setRetirementY(e.target.value)}
              style={{
                fontFamily: mono, fontSize: 14, width: 84, padding: "7px 8px",
                borderRadius: 8, border: "1px solid #d5d8dd",
              }}
              aria-label="定年退職した年（西暦）"
            />
            {retirementY !== "" && (
              <button onClick={() => setRetirementY("")} style={resetBtnStyle}>
                未設定に戻す
              </button>
            )}
          </div>
          <div style={{ fontSize: 11, color: "#8a8f98", width: "100%", marginTop: -6, lineHeight: 1.7 }}>
            入力した境界年を優先します。社会人年が空欄なら、大学等・大学院の標準年数から自動計算します。短大・専門は、次の境界年が入学3年後なら3年、それ以外は2年を標準とします。
          </div>
          {grouped.warnings.length > 0 && (
            <div
              role="alert"
              style={{
                width: "100%", padding: "8px 10px", borderRadius: 8,
                background: "#fff3f1", color: "#a13d31", fontSize: 11.5,
                lineHeight: 1.7,
              }}
            >
              {grouped.warnings.map((warning) => (
                <div key={warning}>{warning}</div>
              ))}
            </div>
          )}
        </div>

        </>)}

        </div>

        <footer
          style={{
            fontSize: 11,
            color: "#8a8f98",
            marginTop: 28,
            lineHeight: 1.8,
            background: "#fff",
            border: "1px solid #e2e4e8",
            borderRadius: 12,
            padding: "12px 14px",
          }}
        >
          <div
            style={{
              color: "#59616c",
              fontWeight: 800,
              fontSize: 13,
            }}
          >
            このサイトについて
          </div>

          <div style={{ marginTop: 8 }}>
            公開された歴史的出来事を、生年・学齢期・人生段階に重ねて表示するインタラクティブ年表です。
            学齢は誕生年と誕生月から概算し、大学等・大学院・社会人・退職年を指定すると人生段階を再計算します。
          </div>

          {DOWNLOAD_URL && (
            <div
              style={{
                marginTop: 10,
                paddingTop: 10,
                borderTop: "1px solid #eceef1",
              }}
            >
              <a
                href={DOWNLOAD_URL}
                download="koshix-timeline-starter.zip"
                style={{ color: "#374151", fontWeight: 700 }}
              >
                ダウンロード版
              </a>
              <span style={{ marginLeft: 8 }}>
                自分の年表としてWebサーバーへ設置できる静的Web版です。
              </span>
            </div>
          )}

          <div
            style={{
              marginTop: 10,
              paddingTop: 10,
              borderTop: "1px solid #eceef1",
            }}
          >
            <div>
              <span style={{ color: "#8a8f98", fontWeight: 700 }}>
                著作権表示：
              </span>
              {" "}
              このアプリは松尾公也氏の{" "}
              <a
                href="https://matsuo-koya.github.io/sf-tech-lifeline/"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "#6b7280" }}
              >
                SF × テクノロジー 自分史年表
              </a>
              {"（"}
              <a
                href="https://github.com/matsuo-koya/sf-tech-lifeline"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "#6b7280" }}
              >
                sf-tech-lifeline
              </a>
              {"）を基にKunio Koshigiriが改変しています。"}
            </div>

            <div>
              原作品 © 2026 Koya Matsuo ／ 改変部分 © 2026 Kunio Koshigiri ／{" "}
              <a
                href={`${import.meta.env.BASE_URL}LICENSE.txt`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "#6b7280" }}
              >
                MIT License
              </a>
              {" ／ "}
              <a
                href={`${import.meta.env.BASE_URL}THIRD-PARTY-NOTICES.md`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "#6b7280" }}
              >
                第三者ソフトウェア表示
              </a>
            </div>
          </div>
        </footer>
      </div>

      {thread && (
        <Theater
          thread={thread}
          gradeLabel={grouped.gradeLabel}
          birth={birth}
          tts={tts}
          setTts={setTts}
          speed={speed}
          setSpeed={setSpeed}
          onClose={() => setThread(null)}
        />
      )}
    </div>
  );
}

const resetBtnStyle = {
  fontFamily: "inherit",
  fontSize: 12,
  fontWeight: 700,
  cursor: "pointer",
  padding: "6px 12px",
  borderRadius: 999,
  border: "1px solid #d5d8dd",
  background: "#fff",
  color: "#6b7280",
};

const segmentBtnStyle = (selected, color, soft) => ({
  fontFamily: "inherit",
  fontSize: 12,
  fontWeight: 700,
  cursor: "pointer",
  padding: "6px 11px",
  borderRadius: 999,
  border: `1.5px solid ${selected ? color : "#d5d8dd"}`,
  background: selected ? soft : "#fff",
  color: selected ? color : "#6b7280",
});

const btnStyle = {
  width: 34, height: 34, borderRadius: 8, border: "1px solid #d5d8dd",
  background: "#fff", fontSize: 18, fontWeight: 700, cursor: "pointer",
  color: "#22272e", lineHeight: 1,
};

// 日本語入力の変換確定のEnterで実行してしまわないようにする
// (変換中はisComposingがtrue。古いSafari等のためkeyCode 229も見る)

const miniBtn = {
  fontSize: 11, fontWeight: 700, cursor: "pointer", padding: "4px 10px",
  borderRadius: 999, border: "1px solid #d5d8dd", background: "#fff", color: "#6b7280",
};
