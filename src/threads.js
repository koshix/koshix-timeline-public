// テーマの「糸」。
// 年表に散らばった出来事を、一本の歴史的な変化として順に見せる。
// 各項目は public/events.tsv の永久IDで参照する。

export const THREADS = [
  {
    key: "measure-unseen",
    title: "見えない世界を測る",
    lead: "共通の物差しを作るところから、原子・量子・時空、そして重力波を測るところまで。",
    items: [
      { id: "1875-1emr89y" },
      { id: "1895-1dz87bi" },
      { id: "1896-r903zn" },
      { id: "1897-1pvngmt" },
      { id: "1900-1h5v9ox" },
      { id: "1905-4q8a7a" },
      { id: "1915-core75-03" },
      { id: "1938-1mux58c" },
      { id: "1964-o4vac2" },
      { id: "2015-1r2m61a" },
    ],
  },

  {
    key: "connected-world",
    title: "世界がつながるまで",
    lead: "電話と放送から、ネットワーク、Web、無線接続、共同知、動画・SNS、そして手のひらのインターネットへ。",
    items: [
      { id: "1876-v3gxyd" },
      { id: "1920-core75-06" },
      { id: "1969-10mh8gt" },
      { id: "1974-core75-23" },
      { id: "1983-1mnbnok" },
      { id: "1991-1p5jigw" },
      { id: "1997-ieee-80211" },
      { id: "2001-wikipedia-launch" },
      { id: "2005-youtube-first-video" },
      { id: "2006-twitter-public-launch" },
      { id: "2007-1ebqvu6" },
    ],
  },

  {
    key: "computing-to-ai",
    title: "計算する機械から考える機械へ",
    lead: "計算可能性という抽象的な問いが、半導体と情報技術を経て、対話する生成AIへ到達する。",
    items: [
      { id: "1936-core75-07" },
      { id: "1947-core75-12" },
      { id: "1948-core75-14" },
      { id: "1958-core75-17" },
      { id: "1971-core75-22" },
      { id: "1984-tf6625" },
      { id: "2022-v90lz3" },
    ],
  },

  {
    key: "software-world",
    title: "ソフトウェアが世界を動かすまで",
    lead: "科学技術計算の高級言語から、AI、教育、OS、システム記述、オープンソース、Webプログラミングへ。",
    items: [
      { id: "1957-fortran-commercial-release" },
      { id: "1958-lisp-start" },
      { id: "1964-dartmouth-basic" },
      { id: "1969-unix-development" },
      { id: "1972-c-language" },
      { id: "1991-python-public-release" },
      { id: "1991-linux-kernel-001" },
      { id: "1995-java-public-demo" },
      { id: "1995-javascript-browser" },
    ],
  },

  {
    key: "personal-computing",
    title: "コンピューターが個人の手に届くまで",
    lead: "マイクロプロセッサからパソコン、標準的な操作環境と接続規格を経て、スマートフォンへ。",
    items: [
      { id: "1971-core75-22" },
      { id: "1977-apple-ii" },
      { id: "1982-nec-pc-9801" },
      { id: "1984-tf6625" },
      { id: "1995-windows-95" },
      { id: "1996-usb-1-0" },
      { id: "2007-1ebqvu6" },
      { id: "2007-android-announcement" },
    ],
  },

  {
    key: "war-and-order",
    title: "二つの世界大戦と国際秩序",
    lead: "総力戦と経済危機を経験した世界が、国際制度を作り直し、冷戦後もなお秩序を問い続ける。",
    items: [
      { id: "1914-bl40c0" },
      { id: "1919-core75-05" },
      { id: "1929-1nhk121" },
      { id: "1939-czrwgj" },
      { id: "1944-core75-08" },
      { id: "1945-core75-09" },
      { id: "1945-nylgh7" },
      { id: "1945-19n2xd7" },
      { id: "1946-core75-10" },
      { id: "1989-1xu3tpe" },
      { id: "1991-mtwz31" },
      { id: "1993-core75-30" },
      { id: "2022-4eyh0w" },
    ],
  },

  {
    key: "rights",
    title: "権利は誰にまで広がったか",
    lead: "憲法、人権宣言、独立、公民権、女性差別撤廃を通じて、権利を持つ主体が広がっていく。",
    items: [
      { id: "1947-rf93db" },
      { id: "1947-core75-11" },
      { id: "1948-core75-15" },
      { id: "1964-core75-21" },
      { id: "1979-core75-27" },
      { id: "1994-core75-31" },
    ],
  },

  {
    key: "life-and-disease",
    title: "感染症と生命を理解する",
    lead: "パンデミック、抗生物質、DNA、天然痘根絶、ゲノム解析を経て、生命と感染症への理解が変わった。",
    items: [
      { id: "1918-core75-04" },
      { id: "1928-v3n6qx" },
      { id: "1953-core75-16" },
      { id: "1960-core75-18" },
      { id: "1980-core75-28" },
      { id: "2003-core75-32" },
      { id: "2020-13ara66" },
    ],
  },

  {
    key: "energy-and-earth",
    title: "エネルギーが社会を変え、地球を変える",
    lead: "化学工業、核エネルギー、石油、原発事故、気候変動を通して、エネルギーと社会の関係をたどる。",
    items: [
      { id: "1913-core75-01" },
      { id: "1938-1mux58c" },
      { id: "1945-nylgh7" },
      { id: "1973-4wgbkc" },
      { id: "1986-163vwou" },
      { id: "1988-core75-29" },
      { id: "2011-au3xzt" },
    ],
  },

  {
    key: "japan-institutions",
    title: "日本の制度の中で生きる",
    lead: "憲法、教育、安全保障、沖縄復帰、入試制度、学校週5日制を、自分の年齢と重ねて読む。",
    items: [
      { id: "1889-d2wuta" },
      { id: "1947-b8zdub" },
      { id: "1947-rf93db" },
      { id: "1960-17fego0" },
      { id: "1972-rle9ex" },
      { id: "1979-wfq5gq" },
      { id: "2002-1wi6yqe" },
    ],
  },
];
