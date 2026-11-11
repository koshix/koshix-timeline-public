# Layering History（自分史プロジェクション）— 静的スターター

このZIPは、公開された歴史的出来事と任意の個人史を、年齢・学齢期・人生段階に重ねて表示する**静的Webアプリ**です。ZIPを展開し、設定・データを必要に応じて編集してWebサーバーに設置します。Node.jsやReact/Viteの開発環境は不要です。

これはmacOS・Windowsにインストールするデスクトップアプリではありません。ZIPの `assets/` はビルド済みで、画面のプログラム自体を変更する場合は別途公開ソース版とビルド環境が必要です。

この配布には公開年表、汎用設定、空の個人史テンプレート、編集規約と権利表示を含みます。**実際の個人史、管理者の人生設定、認証用パスワード、アクセス統計データは含みません。**

## 1. 設置の最短手順

1. Web版の「ダウンロード版」から `koshix-timeline-starter.zip` を取得し、展開します。
2. 展開した `koshix-timeline-starter/` の `config.json` を開き、自分のサイトの `shareUrl` などを設定します。
3. 必要に応じて `events.tsv` を編集し、自分の公開年表を作ります。
4. **個人史をまだ公開サーバーへ置かず**、まず公開ファイルだけを設置して年表の表示・検索・絞込みを確認します。
5. 個人史を使う場合は、サーバーの `personal/` を認証保護し、未認証でHTTP 401になることを確かめてから実データを配置します。

展開したフォルダーをWebサーバーの公開ディレクトリ直下またはサブディレクトリに設置できます。ローカルで `index.html` をダブルクリックする方法（`file://`）は、ブラウザのファイル読込制限のため動作保証の対象外です。HTTP(S)経由で確認してください。

## 2. 変更できるファイル

| ファイル | 内容 | 注意 |
|---|---|---|
| `config.json` | サイト名、共有URL、生年・教育歴等の初期値 | 汎用設定を自分の設置先に合わせる |
| `events.tsv` | 一般公開する歴史イベント | 編集後は13列・タブ区切りを維持する |
| `personal/personal-events.tsv` | 個人史の空テンプレート | **認証保護が完了するまで実個人史を入れない** |
| `assets/` | ビルド済みJavaScript・CSS等 | 通常は直接変更しない |
| `DATA-GUIDE.md` | 出来事の登録・分類・出典等の規約 | 編集時に参照する |
| `LICENSE` / `THIRD-PARTY-NOTICES.md` | 著作権・ライセンス表示 | 再配布時も保持する |

### `config.json` の基本

スターターには `examples/config.json` 由来の汎用設定が含まれます。公開元サイトの運用設定を引き継ぐものではありません。

主なキーは次のとおりです。

- `title` / `hashtag`：年表の表示名、共有用タグ
- `shareUrl`：共有リンクに使うURL。実際の設置先に変更する
- `defaults.birthYear` / `birthMonth` / `education`：初期プロフィール。教育歴の各行は `start`、`years`、`type` を持つ
- `downloadUrl` / `publicSourceUrl`：自分で配布先を用意した場合のURL。用意しなければ空欄
- `publicDistributionEnabled`：配布リンクの表示可否。汎用版は `false`
- `accessStats.endpoint` / `pageUrl`：任意のサーバー側アクセス統計。汎用版は空欄

たとえば、`shareUrl` は次のように設定します（JSON全体ではなく該当フィールドの例）。

```json
"shareUrl": "https://example.com/timeline/"
```

配布リンク・アクセス統計のサーバー処理がなければ、無効のままにしてください。アプリの基本的な年表表示にはそれらの機能は不要です。

### `events.tsv` と分類

公開年表のデータはUTF-8の**タブ区切り13列**です。ヘッダーの列順は次のとおりです。

```text
id	date	end_date	title	cats	primary	subs	region	importance	summary	sources	search	note
```

列の追加・削除や並び替えはしないでください。タブと改行を保って編集します。

大分野は `society`（社会）、`science`（科学）、`education`（教育）、`computer`（情報）、`culture`（文化）、`work`（作品）の6つです。`cats` は表示に含めたい分野（複数可）、`primary` は主分野1つ、`subs` は出来事の副分類タグです。`sf` はSFを表す補助カテゴリで、`primary` には使用しません。

`subs` の有効な実タグは25種類、画面上の横断フィルターは22種類です。「動乱」は `war` または `revolution`、「生活」は `life`、「意匠」は `design` または `architecture`、「映像」は `visual` または `game` に一致します。`architecture` と `game` は独立した実タグです。**`unrest` と `lifestyle` はTSVに記録するタグではありません。**

分類の使い分け、日付精度、重要度、出典、重複、IDの規約は同梱の `DATA-GUIDE.md` を参照してください。スターターZIPにはイベント検証コマンドは含まれないため、大量編集や厳密な形式検証には公開ソース版の `npm run build:events` を利用してください。

## 3. 個人史を利用する場合

同梱の `personal/personal-events.tsv` は、13列のヘッダーだけを含む**空テンプレート**です。同じテンプレートが `examples/personal-events-template.tsv` にもあります。個人史を利用しなければ編集する必要はありません。

個人史の各行では、`cats` に `me` を含め、`primary` は `me`、`importance` は `1`、`2`、`3` のいずれかとします。`me` は公開年表の大分野には含めません。

個人史を画面で非表示にしても、Webサーバーへ置いたファイルへの直接アクセスは防げません。実データを配置する**前**に、個人史や管理者用の人生設定ファイルを認証で保護してください。

Apache Basic認証を使用する場合の設定例（実際のパス・パスワードファイルはサーバー環境に合わせる）：

```apache
AuthType Basic
AuthName "Personal Timeline"
AuthUserFile /absolute/path/outside/webroot/.htpasswd
Require valid-user
```

パスワードファイルはWeb公開領域の外で管理します。実際のサーバーに対して、認証なしでは **HTTP 401**、正しい認証付きでは **HTTP 200** になることを確認します。アクセス制御が確かめられない場合は、実個人史を公開サーバーへアップロードしないでください。

ブラウザ内に保存する利用者固有の個人史・共通年表のカスタマイズと、Webサーバー上の公開TSV・管理者用個人史とは別のデータです。必要に応じてブラウザからエクスポートしてバックアップしてください。

## 4. 配置・更新時の注意

スターターの代表的な内容は次のとおりです。

```text
koshix-timeline-starter/
├── index.html
├── assets/
├── config.json
├── events.tsv
├── icons.svg
├── favicon.svg
├── personal/
│   └── personal-events.tsv
├── examples/
│   └── personal-events-template.tsv
├── DATA-GUIDE.md
├── LICENSE
└── THIRD-PARTY-NOTICES.md
```

`index.html` と `assets/` は必ず**同じビルド世代**のセットとして更新してください。新しい版を上書きするときは、サーバー固有の `.htaccess` や個人史・人生設定、バックアップを誤って消さないでください。`rsync --delete` 等で公開ディレクトリを無条件に同期するのは避けてください。

正常動作の確認では、公開Webページと `events.tsv` がHTTP 200で取得でき、年表の表示・検索・分野・副分類フィルターが動作することを確かめてください。個人史を置いた場合は、未認証HTTP 401を必ず再確認してください。

## 5. 原型・著作権・ライセンス

このアプリは、松尾公也氏の「SF・コンピューター技術ライフライン」を原型とする派生作品です。

- 元プロジェクト: https://github.com/matsuo-koya/sf-tech-lifeline
- 原作品: Copyright (c) 2026 Koya Matsuo
- 本派生版で新たに作成・改変した部分: Copyright (c) 2026 Kunio Koshigiri

ソフトウェアはMIT Licenseで提供します。詳細は `LICENSE` を参照してください。原作品および第三者ソフトウェアの表示は `THIRD-PARTY-NOTICES.md` に記載しています。改変・再配布時も必要な著作権表示と許諾条件を維持してください。
