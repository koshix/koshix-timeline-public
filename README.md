# Koshix Timeline（自分史プロジェクション）

公開された歴史的出来事と、任意の個人史を、利用者の年齢・学齢期・人生段階に重ねて表示するインタラクティブ年表です。

このリポジトリは、React / Vite のソースコードを含む開発・改変可能な版です。
MIT Licenseの条件に従って、ソースコードを修正・再配布できます。

簡単に設置して使いたい場合は、自分史プロジェクションWeb版の「ダウンロード版」から `koshix-timeline-starter.zip` を利用してください。このZIPはNode.jsやビルド作業を必要としない静的配布版です。

## クイックスタート

必要な環境:

- Node.js 22以降
- npm
- Webブラウザ

リポジトリをcloneして依存関係をインストールします。

```bash
git clone https://github.com/koshix/koshix-timeline-public.git
cd koshix-timeline-public
npm install
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

`public/config.json` を編集します。

主な項目:

- `title`: 年表のタイトル
- `hashtag`: 共有用ハッシュタグ
- `shareUrl`: 自分が設置する公開URL
- `defaults`: 生年、幼保歴、大学等、大学院などの初期値

公開用ソースでは `shareUrl` は例示URLになっています。自分の設置先へ変更してください。

### 公開年表

`public/events.tsv` が公開イベントの正本です。

イベントの列、日付、重要度、分類、出典などの規約は `DATA-GUIDE.md` を参照してください。

### 個人史

実際の個人史データは、このリポジトリには含まれません。

個人史を使う場合は、空テンプレートから作成します。

```bash
cp examples/personal-events-template.tsv private-data/personal-events.tsv
```

`private-data/personal-events.tsv` は `.gitignore` 対象です。

## 個人史の保護

個人史をWeb上で使用する場合、画面上で非表示にするだけでは保護されません。
Webサーバー側で `personal/` ディレクトリをBasic認証などで保護してください。

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

`npm run build:starter` は、Node.js不要で設置できる静的配布ZIPを作成します。

## 主なファイル

```text
src/                        Reactアプリ本体
public/events.tsv           公開年表
public/config.json          表示設定
public/icons.svg            SVGアイコン
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

本派生版では、公開データと個人データのTSV化、ランタイム設定、個人領域の分離、重要度表示、SVG sprite、相対パスビルド、テーマの糸などを追加・変更しています。

## ライセンス

MIT Licenseです。

- 原作品: Copyright (c) 2026 Koya Matsuo
- 本派生版で新たに作成・改変した部分: Copyright (c) 2026 Kunio Koshigiri

詳細は `LICENSE` を参照してください。
React、React DOM、Viteなどの第三者ソフトウェアと元プロジェクトの帰属表示は `THIRD-PARTY-NOTICES.md` に記載しています。
