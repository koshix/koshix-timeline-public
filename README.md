# Layering History（自分史プロジェクション）

公開された歴史的出来事と、任意の個人史を、利用者の年齢・学齢期・人生段階に重ねて表示するインタラクティブ年表です。

このリポジトリは、React / Vite のソースコードを含む開発・改変可能な**公開ソース版**です。MIT Licenseの条件に従って、ソースコードを修正・再配布できます。

この公開ソース版は、Koshixのprivate開発リポジトリから専用の配布スクリプトにより生成されたものです。実個人史、管理者の人生設定、本番固有の認証・アクセス統計データ、内部運用文書を含めません。安定版のversion・tag・公開イベント件数は同梱の `release-manifest.json` を参照してください。

この説明書は特定の配布版番号を固定して示すものではありません。版番号と公開イベント件数は同梱の `release-manifest.json` を正本とします。

簡単に設置して使いたい場合は、Layering History Web版の「ダウンロード版」から `koshix-timeline-starter.zip` を利用してください。このZIPはNode.jsやビルド作業を必要としない静的配布版です。

## クイックスタート

必要な環境:

- Node.js 22以降
- npm
- Webブラウザ

リポジトリをcloneして依存関係をインストールします。

```bash
git clone https://github.com/koshix/koshix-timeline-public.git
cd koshix-timeline-public
npm ci
npm run check
npm run dev
```

`npm run check` でコード・データ・unit testを確認してから開発サーバーを起動します。

開発サーバーはローカルでの開発・確認用です。インターネットへ直接公開しないでください。

本番用ファイルを作成する場合:

```bash
npm run build
```

成果物は `dist/` に作成されます。

## 自分用に変更する

### 表示設定

`public/config.json` を編集します。公開用ソースでは `examples/config.json` の**汎用設定**が初期値として使われ、利用者固有の配置先やサーバー機能を要求しません。

| 設定 | 意味 |
|---|---|
| `title` / `hashtag` | 表示名と共有タグ |
| `shareUrl` | 自分の公開先URL（共有リンク用） |
| `defaults` | 生年・生月・教育歴の初期設定 |
| `downloadUrl` / `publicSourceUrl` | 自分で配布する場合のリンク先 |
| `publicDistributionEnabled` | 一般向けの配布リンクを表示するか |
| `accessStats.endpoint` / `pageUrl` | 任意のサーバー側統計機能の接続先 |

`shareUrl` は自分の公開先へ変更してください。配布リンクやアクセス統計サーバーを用意しない場合は、空欄・無効のまま使用します。教育歴は `defaults.education` の各行に `start`、`years`、`type` を指定します。

### 公開年表

`public/events.tsv` が公開イベントの正本です。

公開イベントと個人史は共通の**13列TSV**形式です。公開イベントの正本は `public/events.tsv` であり、列順は `src/event-schema.js` の `EVENT_TSV_HEADER` が正本です。編集時はタブ区切りUTF-8の形式を維持してください。

公開年表の大分野は `society`、`science`、`education`、`computer`、`culture`、`work` の6種です。`cats` は所属分野（複数可）、`primary` は主分野（1種）、`subs` は内容上の副分類です。`sf` は主分野には使わないSF補助カテゴリです。

`subs` の実タグは25種類、画面の横断フィルターは22種類です。「動乱」は `war` または `revolution`、「生活」は `life`、「意匠」は `design` または `architecture`、「映像」は `visual` または `game` に一致します。`architecture` と `game` は独立した実タグです。**`unrest` と `lifestyle` は画面専用キーであり、TSVの `subs` に記入しないでください。**

日付、重要度、重複、出典、タグの選び方などの編集規約は同梱の `DATA-GUIDE.md`、キーとフィルターの実装は `src/event-schema.js` を参照してください。公開TSVの変更は元の公式サイトに自動反映されません。

### 個人史

実際の個人史データは、このリポジトリには含まれません。

個人史を使う場合は、空テンプレートから作成します。

```bash
cp examples/personal-events-template.tsv private-data/personal-events.tsv
```

`private-data/personal-events.tsv` は `.gitignore` 対象です。個人史は `cats` に `me` を含め、`primary` は `me`、重要度は1〜3とします。`me` は公開イベントの6大分野には含めません。

利用者はブラウザ内で個人史を編集・保存でき、公開年表を変更せずに独自の項目追加・表示変更・非表示などの差分を管理することもできます。ブラウザ保存データと公開 `events.tsv` の編集を混同しないでください。

## 個人史の保護

個人史をWeb上で使用する場合、画面上で非表示にするだけでは保護されません。**実データを配置する前に**Webサーバー側で `personal/` ディレクトリをBasic認証などで保護し、個人史・人生設定の双方が未認証HTTP 401、認証ありHTTP 200となることを確認してください。

スターターZIP内の個人史TSVはヘッダーのみの空テンプレートであり、実個人史を含みません。認証設定を確立する前にこのテンプレートを実データへ置き換えてはいけません。パスワードファイルはWeb公開ルート外で管理してください。

実個人史を置く `private-data/` はproduction buildの入力には含まれません。
サーバーへ配置する場合も、公開ファイルとは別に管理してください。

## 主なコマンド

```bash
npm run dev
npm run build
npm run preview
npm run build:events
npm run validate:personal
npm test
npm run add:event:interactive
npm run build:starter
```

`npm run build:starter` は、Node.js不要で設置できる静的配布ZIPを作成します。この公開ソース版には内部リリース専用の `release-publish` 等のコマンドは含まれません。`npm run test:e2e` でsyntheticデータを使ったブラウザE2Eも実行できます。

## 主なファイル

```text
src/                        Reactアプリ本体
public/events.tsv           公開年表
public/config.json          表示設定
public/icons.svg            SVGアイコン
src/event-schema.js         13列スキーマ・副分類語彙・表示フィルター
examples/config.json        公開・スターター用の汎用設定
release-manifest.json       安定版のversion・tag・公開件数
examples/personal-events-template.tsv 個人史の空テンプレート
scripts/                    検査・build・配布用スクリプト
DATA-GUIDE.md               イベント登録・編集規約
LICENSE                     ライセンス
THIRD-PARTY-NOTICES.md      原作品・第三者ソフトウェア表示
```

## 公開データと個人データ

公開年表と非公開の個人史は明確に分離してください。

この公開リポジトリには実際の個人史を含めないでください。
`private-data/personal-events.tsv` はGit管理対象外です。

## 原型と変更

このプロジェクトは、松尾公也氏の「SF・コンピューター技術ライフライン」を原型としています。

元プロジェクト:

https://github.com/matsuo-koya/sf-tech-lifeline

本派生版では、公開データと個人データのTSV化、ランタイム設定、個人領域の分離、重要度表示、25副分類タグと22横断フィルター、共通年表の利用者別カスタマイズ、SVG sprite、相対パスビルド、テーマ機能などを追加・変更しています。

## ライセンス

MIT Licenseです。

- 原作品: Copyright (c) 2026 Koya Matsuo
- 本派生版で新たに作成・改変した部分: Copyright (c) 2026 Kunio Koshigiri

詳細は `LICENSE` を参照してください。
React、React DOM、Viteなどの第三者ソフトウェアと元プロジェクトの帰属表示は `THIRD-PARTY-NOTICES.md` に記載しています。
