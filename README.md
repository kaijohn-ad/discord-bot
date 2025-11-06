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
AUTO_REGISTER_COMMANDS=true
```

**環境変数の説明：**
- `DISCORD_TOKEN`: Botのトークン（必須）
- `APPLICATION_ID`: アプリケーションID（必須）
- `GUILD_ID`: サーバーID（必須）
- `TZ`: タイムゾーン（デフォルト: Asia/Tokyo）
- `AUTO_REGISTER_COMMANDS`: スラッシュコマンドの自動登録（`true`で有効、デフォルト: `false`）

**必要な情報の取得方法：**

1. **Discord Developer Portal**にアクセス: https://discord.com/developers/applications
2. **Application ID**を取得:
   - 左サイドバーの「General Information」
   - 「Application ID」をコピー
3. **Bot Token**を取得:
   - 左サイドバーの「Bot」
   - 「Reset Token」または「Copy」をクリックしてトークンを取得
   - ⚠️ **重要**: Bot Tokenは秘密情報です。他人に共有しないでください
4. **Bot Intents（意図）を有効化**（重要！）:
   - 左サイドバーの「Bot」セクションで
   - 「Privileged Gateway Intents」セクションを確認
   - ✅ **MESSAGE CONTENT INTENT** を有効化（必須）
   - ✅ **SERVER MEMBERS INTENT** は必要に応じて有効化（現在は不要）
   - ⚠️ これを行わないとBotが起動できません
5. **Guild ID**を取得:
   - Discordで開発者モードを有効化（設定 → 詳細設定 → 開発者モード）
   - サーバー名を右クリック → 「IDをコピー」

3. スラッシュコマンドを登録（手動の場合）:
```bash
npm run register
# または
pnpm register
```

**自動登録について：**
- `AUTO_REGISTER_COMMANDS=true`を設定すると、Bot起動時に自動的にスラッシュコマンドが登録されます
- Railwayなどのクラウドデプロイ時は、環境変数に`AUTO_REGISTER_COMMANDS=true`を設定することを推奨します
- 手動で登録する場合は、`npm run register`を実行してください

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

#### 簡単モード（推奨）

時間と頻度を選択するだけで設定できます：

```
/schedule add channel:#general mention:@everyone message:おはようございます！ hour:9 frequency:平日のみ
```

**簡単モードのオプション：**
- `hour`: 送信時刻（時、0-23）
- `minute`: 送信時刻（分、0-59、省略時は0）
- `frequency`: 頻度
  - `毎日` - 毎日送信
  - `平日のみ（月〜金）` - 平日のみ送信
  - `週末のみ（土日）` - 週末のみ送信
  - `月曜日` / `火曜日` / ... / `日曜日` - 特定の曜日のみ送信

**使用例：**
- `/schedule add channel:#general mention:@everyone message:おはよう！ hour:9 frequency:平日のみ` - 平日9時
- `/schedule add channel:#general mention:@here message:こんにちは！ hour:12 minute:30 frequency:毎日` - 毎日12時30分
- `/schedule add channel:#general mention:@everyone message:週末だ！ hour:10 frequency:週末のみ` - 週末10時

#### 上級者モード

Cron式を直接指定できます：

```
/schedule add channel:#general mention:@everyone message:おはようございます！ cron:"0 9 * * 1-5"
```

**Cron式の例：**
- `0 9 * * 1-5`: 平日9時
- `0 12 * * *`: 毎日12時
- `0 0 * * 0`: 毎週日曜日の0時
- `*/30 * * * *`: 30分ごと
- `0 21-23 * * *`: 21時から23時まで1時間ごと

**共通オプション：**
- `channel`: メッセージを送信するチャンネル（必須）
- `mention`: メンションの種類（user/role/everyone/here、必須）
- `target`: メンション対象（ユーザーまたはロール、mentionがuser/roleの場合のみ）
- `message`: 送信するメッセージ（必須）
- `timezone`: タイムゾーン（デフォルト: Asia/Tokyo）

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

