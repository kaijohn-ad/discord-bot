# Discord定期通知Bot

TypeScript + discord.js v14で実装された、スラッシュコマンドで定期メンションを設定できるDiscord Botです。

## 機能

- `/schedule add`: 新しい定期メッセージを追加
- `/schedule list`: 登録されているスケジュール一覧を表示
- `/schedule remove`: スケジュールを削除
- `/schedule pause`: スケジュールを一時停止
- `/schedule resume`: スケジュールを再開
- `/schedule test`: スケジュールをテスト送信

## セットアップ

1. 依存関係のインストール:
```bash
npm install
# または
pnpm install
```

2. `.env`ファイルを設定:
```env
DISCORD_TOKEN=your_bot_token_here
APPLICATION_ID=your_application_id_here
GUILD_ID=your_guild_id_here
TZ=Asia/Tokyo
```

**必要な情報の取得方法：**

1. **Discord Developer Portal**にアクセス: https://discord.com/developers/applications
2. **Application ID**を取得:
   - 左サイドバーの「General Information」
   - 「Application ID」をコピー
3. **Bot Token**を取得:
   - 左サイドバーの「Bot」
   - 「Reset Token」または「Copy」をクリックしてトークンを取得
   - ⚠️ **重要**: Bot Tokenは秘密情報です。他人に共有しないでください
4. **Guild ID**を取得:
   - Discordで開発者モードを有効化（設定 → 詳細設定 → 開発者モード）
   - サーバー名を右クリック → 「IDをコピー」

3. スラッシュコマンドを登録:
```bash
npm run register
# または
pnpm register
```

4. Botを起動:
```bash
npm run dev
# または
pnpm dev
```

本番環境では:
```bash
npm run build
npm start
```

## 使用方法

### スケジュールの追加

```
/schedule add channel:#general mention:everyone message:おはようございます！ cron:0 9 * * 1-5 timezone:Asia/Tokyo
```

- `channel`: メッセージを送信するチャンネル
- `mention`: メンションの種類（user/role/everyone/here）
- `target`: メンション対象（ユーザーまたはロール、mentionがuser/roleの場合のみ）
- `message`: 送信するメッセージ
- `cron`: Cron式（例: `0 9 * * 1-5` は平日9時）
- `timezone`: タイムゾーン（デフォルト: Asia/Tokyo）

### Cron式の例

- `0 9 * * 1-5`: 平日9時
- `0 12 * * *`: 毎日12時
- `0 0 * * 0`: 毎週日曜日の0時
- `*/30 * * * *`: 30分ごと

## 権限

- コマンドの実行には「サーバー管理」または「管理者」権限が必要です
- Botには対象チャンネルの「メッセージを送信」権限が必要です
- `@everyone`や`@here`を使用する場合、Botには「@everyoneにメンション」権限が必要です

## データベース

スケジュールはSQLiteデータベース（`schedules.db`）に保存されます。Botを再起動してもスケジュールは保持されます。

**注意**: クラウドデプロイ時は、データベースファイルが永続化されるように設定してください（Railwayのボリューム、Renderのディスクなど）。

## デプロイ

Botをクラウドサーバーにデプロイする方法は [DEPLOY.md](./DEPLOY.md) を参照してください。

### おすすめのプラットフォーム

1. **Railway** - 最も簡単、無料プランあり（月$5のクレジット）
2. **Render** - 無料プランあり（スリープする可能性あり）
3. **Fly.io** - 無料プランあり、高速
4. **VPS** - DigitalOcean/Vultrなど（月額$4-6）

詳細は [DEPLOY.md](./DEPLOY.md) をご覧ください。

