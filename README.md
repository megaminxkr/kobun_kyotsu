# 古文のしるべ

共通テスト古文の学習サイト。チャットのまとめを、16章・70トピックの教材に再構成しています。重要古語、動詞・助動詞の活用表、敬語、和歌、古文常識、文学史、読解手順、設問攻略を収録。

公開先（Pages有効化後）: **https://megaminxkr.github.io/kobun_kyotsu/**

## GitHub Pages で公開

1. このリポジトリの **Settings → Pages** を開く。
2. Build and deployment の Source を **Deploy from a branch** にする。
3. Branch を **main**、フォルダを **/(root)** にして Save。
4. Pages のビルド完了後、上記URLを開く。

`index.html`、`lessons/`、`assets/` を生成・コミット済みなので、公開時のビルドサービスやAPIキーは不要です。`.nojekyll` によりJekyll処理を省略します。リポジトリは公開のまま利用できます。

`https://megaminxkr.github.io/` 直下での公開には、通常 `megaminxkr.github.io` という名前のリポジトリが必要です。この `kobun_kyotsu` はプロジェクトサイトなので `/kobun_kyotsu/` に公開されます。

## 機能

- 紙と深緑を基調にしたレスポンシブUI。スマホの目次ドロワー、iPad・PCの読みやすい本文。
- 16章に独立したURL。JavaScriptなしでも本文・表・通常リンクを利用可能。
- 70トピックの全文検索。ひらがな・カタカナ、全角・半角を正規化。複数語AND検索。
- 学習済み・しおり・最後に開いた章・到達チェックの保存。
- ライト／ダークモード、印刷向けCSS、キーボード操作、スキップリンク、横スクロール表。
- 外部フォント、画像CDN、解析サービス、広告、実行時依存パッケージなし。

進捗は当該ブラウザの localStorage に保存されます。アカウント連携や端末間同期はありません。ブラウザのサイトデータを消すと記録も消えます。保存不可・破損データでも本文を表示できるようにしています。

## 開発

Node.js 22以上。アプリ本体の依存パッケージは不要です。

```sh
npm run build   # 教材から静的HTMLと検索索引を再生成
npm test        # Node標準の14テスト
npm run check  # ビルド＋テスト
npm run dev    # http://localhost:3000
# 任意のポート：npm run dev -- --port 4173
```

`/kobun_kyotsu/` 配下も開発サーバーで確認できます。

## 内容の更新

- `data/curriculum.mjs`：教材の編集元。章・小見出し・本文・表・例文を構造化。
- `scripts/build.mjs`：HTMLと検索索引の生成。
- `assets/style.css`：デザイン、レスポンシブ、印刷設定。
- `assets/app.mjs`：検索、進捗、テーマ、目次の操作。
- `assets/core.mjs`：検索・状態検証などの副作用のない関数。
- `tests/site.test.mjs`：内容・構造・検索・保存データ・リンクの回帰テスト。
- `scripts/browser-check.mjs`：Chromiumでの機能・レスポンシブ回帰テスト。

教材を変更したら `npm run check` を実行し、生成された `index.html`、`lessons/*.html`、`assets/search-index.json` も一緒にコミットしてください。生成HTMLを直接編集すると次回生成で上書きされます。

## 検証

GitHub Actions は push / pull_request 時に、ビルド、単体・構造テスト、生成物の差分、ブラウザ回帰を検証します。ブラウザテストは360・390・768・1024・1440px、検索、章への移動、保存後の再読込、しおり絞り込み、テーマ、チェックリスト、表のはみ出し、JavaScript無効、ストレージ拒否・破損を対象とします。

ブラウザテストをローカルで実行する場合のみ、追加インストールが必要です。

```sh
npm install --no-save --package-lock=false playwright@1.56.1
npx playwright install chromium
node scripts/browser-check.mjs
```

手動検証用の `tests/responsive.html` はスマホ・タブレット幅を並べて表示します。開発用です。

## 教材について

このチャットの古文まとめを元に、学習用の例文と解説を再構成しています。語彙は重要語の一覧であり、試験範囲を限定するものではありません。入試情報は2026年11月9日確認の令和9年度資料に基づきます。受験年度の要項は必ず公式資料で確認してください。

- [大学入試センター・令和9年度試験](https://www.dnc.ac.jp/kyotsu/shiken_jouhou/r9/)
- [GitHub Pages の作成手順](https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site)
