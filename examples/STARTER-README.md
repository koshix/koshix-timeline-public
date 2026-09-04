# 自分史プロジェクション — 静的スターター

このZIPは、Webサーバーへ配置するだけで動作する静的配布版です。Node.jsやビルド作業は不要です。


## このスターターについて

これはMacやWindowsへインストールする形式のアプリではありません。
ZIPを展開し、その中のファイル一式をWebサーバーへ配置して使う静的Webアプリです。

このスターターでは、主に次の内容を自分用に変更できます。

- `config.json`：タイトル、ハッシュタグ、共有先URL、プロフィール初期値
- `events.tsv`：公開年表の追加・削除・修正
- `personal/personal-events.tsv`：個人史の追加・削除・修正

`personal/personal-events.tsv` を使用する場合は、公開前に必ずWebサーバー側で認証保護してください。

この静的スターターには、React/Viteの開発用ソースコードやNode.jsの開発環境は含まれていません。
`assets/` 内のJavaScriptはビルド済み成果物であり、直接編集することは想定していません。
画面構成や機能そのものを変更して再ビルドする用途は、この静的スターターの対象外です。

## 最短手順

1. 自分史プロジェクションのWeb版にある「ダウンロード版」から `koshix-timeline-starter.zip` を取得する
2. ZIPを展開する
3. `config.json` を自分の公開先に合わせて変更する
4. `events.tsv` を自分の年表として編集する
5. 必要な場合だけ、認証保護した `personal/personal-events.tsv` に個人史を追加する
6. 展開したフォルダーの内容をWebサーバーへ配置し、ブラウザで確認する


## 最初に変更するファイル

### `config.json`

タイトル、ハッシュタグ、共有先URL、プロフィール初期値を設定します。

特に `shareUrl` を実際の公開先へ変更してください。

```json
"shareUrl": "https://example.com/timeline/"
```

### `events.tsv`

公開年表の正本です。タブ区切りのUTF-8テキストとして編集します。

```text
id\tdate\tend_date\ttitle\tcats\tprimary\tsubs\tregion\timportance\ticon\tsummary\tsources\tsearch\tnote\tcore
```

`core` は旧選定状態を残すメタデータです。旧選定対象は `1`、それ以外は `0` とし、現在は固定件数を維持する必要はありません。

詳しい登録規約は `DATA-GUIDE.md` を参照してください。

## 個人イベント

`personal/personal-events.tsv` は、ヘッダーだけの空テンプレートです。個人史を使わない場合は、そのままで構いません。

個人史を追加する場合は、各行で次を満たしてください。

```text
cats に me を含める
primary を me にする
importance を 1、2、3 のいずれかにする
```

同じ空テンプレートを `examples/personal-events-template.tsv` にも収録しています。

## 重要：個人史の保護

実データを書き込む前に、Webサーバー側で `personal/` ディレクトリを認証保護してください。画面上で非表示にするだけでは、TSVファイルは保護されません。

ApacheのBasic認証を使う場合の概略は次です。

```apache
AuthType Basic
AuthName "Personal Timeline"
AuthUserFile /absolute/path/outside/webroot/.htpasswd
Require valid-user
```

パスワードファイルはWeb公開領域の外に置きます。実個人史の公開前に、認証なしでは `401`、認証ありでは `200` になることを確認してください。

```bash
curl -I https://example.com/timeline/personal/personal-events.tsv
curl -I -u USER https://example.com/timeline/personal/personal-events.tsv
```

## 配置

このフォルダーの内容を、そのままWebサーバーへ置きます。相対パスを使っているため、ドメイン直下でも任意のサブディレクトリでも動作します。

```text
index.html
assets/
config.json
events.tsv
icons.svg
favicon.svg
personal/
```

サーバー側で作成した `personal/.htaccess` などを、再アップロード時に削除・上書きしないよう注意してください。

## 原型とライセンス

このアプリは、松尾公也氏の「SF・コンピューター技術ライフライン」を原型としています。

- https://github.com/matsuo-koya/sf-tech-lifeline

ソフトウェアのライセンスは `LICENSE`、第三者ソフトウェアの表示は `THIRD-PARTY-NOTICES.md` を参照してください。
