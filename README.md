# 自分史プロジェクション — 静的スターター

このZIPは、Webサーバーへ配置するだけで動作する静的配布版です。Node.jsやビルド作業は不要です。

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

`core` は基幹75件なら `1`、補足項目なら `0` です。基幹項目は正確に75件を維持してください。

詳しい登録規約は `DATA-GUIDE.md` を参照してください。

## 個人イベント

`private/events.tsv` は、ヘッダーだけの空テンプレートです。個人史を使わない場合は、そのままで構いません。

個人史を追加する場合は、各行で次を満たしてください。

```text
cats に me を含める
primary を me にする
importance を 1、2、3 のいずれかにする
```

同じ空テンプレートを `examples/private-events.tsv` にも収録しています。

## 重要：個人史の保護

実データを書き込む前に、Webサーバー側で `private/` ディレクトリを認証保護してください。画面上で非表示にするだけでは、TSVファイルは保護されません。

ApacheのBasic認証を使う場合の概略は次です。

```apache
AuthType Basic
AuthName "Personal Timeline"
AuthUserFile /absolute/path/outside/webroot/.htpasswd
Require valid-user
```

パスワードファイルはWeb公開領域の外に置きます。実個人史の公開前に、認証なしでは `401`、認証ありでは `200` になることを確認してください。

```bash
curl -I https://example.com/timeline/private/events.tsv
curl -I -u USER https://example.com/timeline/private/events.tsv
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
private/
```

サーバー側で作成した `private/.htaccess` などを、再アップロード時に削除・上書きしないよう注意してください。

## 原型とライセンス

このアプリは、松尾公也氏の「SF・コンピューター技術ライフライン」を原型としています。

- https://github.com/matsuo-koya/sf-tech-lifeline

ソフトウェアのライセンスは `LICENSE`、第三者ソフトウェアの表示は `THIRD-PARTY-NOTICES.md` を参照してください。
