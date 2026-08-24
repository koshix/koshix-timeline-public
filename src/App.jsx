import { useState, useMemo, useEffect, useRef } from "react";
import { loadEvents } from "./events-source";
import { loadConfig } from "./config-source";
import { loadPrivateEvents } from "./private-events-source";
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

// ---- 年表の規模(見出しに表示する) ----
const STATS = EVENTS.reduce(
  (a, e) => ({
    count: a.count + 1,
    chars: a.chars + [...(e.n || "")].length,
  }),
  { count: 0, chars: 0 }
);

// ---- 共有 ----
const APP_TITLE = CONFIG.title || "自分史プロジェクション";
const HASHTAG = CONFIG.hashtag ?? "#自分史プロジェクション";

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

function ShareBar({ text, url = SHARE_URL, compact = false, small = false, color = "#37414f", note }) {
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
    borderRadius: 999, padding: compact || small ? "3px 10px" : "4px 12px",
    border: `1px solid ${color}44`, background: "#ffffffaa", color,
    cursor: "pointer", lineHeight: 1.6, fontFamily: "inherit",
  };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
        {note && <span style={{ fontSize: 10.5, color: "#9aa0a8", flexShrink: 0 }}>タイトルのみ</span>}
        {targets.map(([label, href]) => (
          <a key={label} href={href} target="_blank" rel="noopener noreferrer" style={base}>
            {label}で共有
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
            ✕ 閉じる
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
  const [myEvents, setMyEvents] = useState([]); // 認証後に private/events.tsv から読み込む
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

  const toggleMyEvents = async () => {
    // ON → OFF は認証不要
    if (showMe) {
      setShowMe(false);
      return;
    }

    // 個人史TSVそのものを取得する。
    // localhostではそのまま取得でき、
    // 公開環境では private/ のBasic認証を通過した場合だけ取得できる。
    try {
      const events = await loadPrivateEvents();

      if (events === null) {
        return;
      }

      setMyEvents(events);
      setShowMe(true);
    } catch (err) {
      console.error("Personal events could not be loaded:", err);
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
      ...EVENTS
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
  }, [birth, month, higherEdY, higherEdType, graduateY, graduateType, adultY, retirementY, myEvents, catOff, importanceMin, showMe, subOff, searchText]);

  const font =
    '"Hiragino Kaku Gothic ProN", "Hiragino Sans", "Yu Gothic Medium", "Noto Sans JP", sans-serif';
  const mono = 'ui-monospace, "SF Mono", Menlo, Consolas, monospace';

  return (
    <div style={{ minHeight: "100vh", background: "#fafaf8", fontFamily: font, color: "#22272e" }}>
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "28px 16px 64px" }}>
        {/* ヘッダー */}
        <header style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, letterSpacing: "0.25em", color: "#8a8f98", marginBottom: 6 }}>
            6つのテーマでたどる、自分の時代
          </div>
          <h1 style={{ fontSize: 29, fontWeight: 800, margin: 0, lineHeight: 1.35 }}>
            {APP_TITLE}
          </h1>
          <div style={{ fontSize: 11.5, color: "#8a8f98", marginTop: 8, fontFamily: mono }}>
            全{STATS.count}項目・解説{STATS.chars.toLocaleString()}字
          </div>
          <div
            style={{
              display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap",
              marginTop: 9,
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
            <button
              onClick={() => {
                setSetupOpen(true);
                setTimeout(() => {
                  document.getElementById("timeline-settings")?.scrollIntoView({
                    behavior: "smooth",
                    block: "start",
                  });
                }, 0);
              }}
              style={{
                fontFamily: font,
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
                padding: "5px 10px",
                borderRadius: 8,
                border: "1px solid #7a6a55",
                background: "#fff",
                color: "#5f5142",
                marginLeft: 5,
                marginRight: 5,
              }}
            >
              あなたの設定
            </button>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                padding: "4px 6px",
                borderRadius: 10,
                background: "#f1f3f5",
                border: "1px solid #e0e4e8",
              }}
            >
              <ShareBar
                small
                text={`${APP_TITLE}——6つのテーマで時代を自分の年齢から読む(${EVENTS.length}項目) ${HASHTAG}`}
              />
            </div>
            {grouped.myShown > 0 && (
              <span style={{ fontSize: 11, color: "#6b7280" }}>
                公開{grouped.shown}件＋個人史{grouped.myShown}件
              </span>
            )}
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

        {/* テーマの糸 */}
        <div
          style={{
            background: "#e5e7eb", border: "1px solid #c7cbd1", borderRadius: 12,
            padding: "12px 16px", marginBottom: 14, color: "#374151",
          }}
        >
          <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
            <span style={{ fontSize: 13, fontWeight: 700 }}>テーマの糸をたどる</span>
            <span style={{ fontSize: 11, color: "#6b7280" }}>
              関連する項目が自動で流れます(読み上げつき・{THREAD_LIST.length}本)
            </span>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 9 }}>
            {THREAD_LIST.map((th) => (
              <button
                key={th.key}
                onClick={() => setThread(th)}
                style={{
                  fontSize: 11.5, fontWeight: 700, cursor: "pointer", fontFamily: font,
                  padding: "5px 12px", borderRadius: 999,
                  border: "1px solid #cbd5e1", background: "#ffffff", color: "#4B56A6",
                }}
              >
                ▶ {th.title}
                <span style={{ color: "#6b7280", fontFamily: mono, fontSize: 10.5, marginLeft: 6 }}>
                  {th.events.length}
                </span>
              </button>
            ))}
          </div>
        </div>

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

        {/* フィルタ・全開閉 */}
        <div style={{ display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap", alignItems: "center" }}>
          <div
            style={{
              display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap",
              width: "100%", marginBottom: 4,
            }}
          >
            <label htmlFor="timeline-search" style={{ fontSize: 13, fontWeight: 700 }}>
              項目を検索
            </label>
            <input
              id="timeline-search"
              type="search"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="例: AI && 教育 / (DNA || RNA) && 研究"
              autoComplete="off"
              style={{
                flex: "1 1 260px", minWidth: 180, maxWidth: 520,
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
                flexBasis: "100%", fontSize: 10.5,
                color: grouped.searchError ? "#b33b2e" : "#8a8f98",
              }}
              role={grouped.searchError ? "alert" : undefined}
            >
              {grouped.searchError || "&& = AND、|| = OR、( ) = 優先指定。空白・読点・カンマもANDです。"}
            </span>
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

          {/* 一括操作と個別選択を分離 */}
          <span
            aria-hidden="true"
            style={{ flexBasis: "100%", height: 2 }}
          />

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
                          <ShareBar
                            compact
                            color={CAT[ev.cat].bg}
                            text={shareText}
                            note={ev.n}
                            url={`${SHARE_URL}?e=${encodeURIComponent(id)}`}
                          />
                        </div>
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

        <div id="timeline-settings" style={{ scrollMarginTop: 16 }}>
        {/* 入力欄(畳めるようにしている) */}
        <button
          onClick={() => setSetupOpen((v) => !v)}
          aria-expanded={setupOpen}
          style={{
            display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", width: "100%",
            background: "#fff", border: "1px solid #e2e4e8", borderRadius: 12,
            padding: "10px 16px", marginBottom: setupOpen ? 14 : 14,
            cursor: "pointer", textAlign: "left", fontFamily: font, color: "#22272e",
          }}
        >
          <span style={{ fontSize: 13, fontWeight: 700 }}>あなたの設定</span>
          <span style={{ fontFamily: mono, fontSize: 12, color: "#6b7280" }}>
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
            background: "#fff", border: "1px solid #e2e4e8", borderRadius: 12,
            padding: "14px 16px", marginBottom: 14,
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
            background: "#fff", border: "1px solid #e2e4e8", borderRadius: 12,
            padding: "12px 16px", marginBottom: 14,
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

        <footer style={{ fontSize: 11, color: "#8a8f98", marginTop: 28, lineHeight: 1.8 }}>
          学齢は誕生年と誕生月から概算します。1〜3月生まれは早生まれとして学年を補正します。
          大学等・大学院・社会人になった年を指定すると、その境界年に応じて人生段階を再計算します。定年退職した年を指定すると、その年以後は「自由人」と表示します。
          「自分の出来事」はBasic認証後に非公開の個人史データから読み込み、公開イベントとは別に表示します。
          <div style={{ marginTop: 8 }}>
            このアプリは松尾公也氏の{" "}
            <a
              href="https://github.com/matsuo-koya/sf-tech-lifeline"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "#6b7280" }}
            >
              sf-tech-lifeline
            </a>
            {" "}を基にKunio Koshigiriが改変しています。
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
