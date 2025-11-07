# Discord定期通知Bot

TypeScript + discord.js v14で実装された、スラッシュコマンドと自然言語でリマインドを設定できるDiscord Botです。

## 機能

### スラッシュコマンド
- `/schedule add`: 新しい定期メッセージを追加
- `/schedule list`: 登録されているスケジュール一覧を表示
- `/schedule remove`: スケジュールを削除
- `/schedule pause`: スケジュールを一時停止
- `/schedule resume`: スケジュールを再開
- `/schedule test`: スケジュールをテスト送信

### 自然言語リマインド（新機能）
- **DMまたはBotメンション**で自然言語でリマインドを設定
- **一回限り**と**定期**の両方に対応
- LLMを使用して自然言語を解析

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

# LLM設定（自然言語リマインド用）
LLM_PROVIDER=openrouter
LLM_MODEL=x-ai/grok-beta
LLM_API_KEY=your_llm_api_key_here
```

**環境変数の説明：**
- `DISCORD_TOKEN`: Botのトークン（必須）
- `APPLICATION_ID`: アプリケーションID（必須）
- `GUILD_ID`: サーバーID（必須）
- `TZ`: タイムゾーン（デフォルト: Asia/Tokyo）
- `AUTO_REGISTER_COMMANDS`: スラッシュコマンドの自動登録（`true`で有効、デフォルト: `false`）
- `LLM_PROVIDER`: LLMプロバイダ（`openrouter` または `google`、デフォルト: `openrouter`）
- `LLM_MODEL`: 使用するLLMモデル（デフォルト: `x-ai/grok-beta`）
  - OpenRouter: `x-ai/grok-beta`, `minimax/m2`, `openai/gpt-oss-120b-high` など
  - Google: `gemini-2.5-flash-sep` など
- `LLM_API_KEY`: LLM APIキー（自然言語リマインド機能に必須）

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

### 自然言語リマインド（新機能）

Botに**DMを送る**か、**サーバー内でBotをメンション**して自然言語でリマインドを設定できます。

**使い方：**
1. BotにDMを送る、またはサーバー内で `@Bot名` をメンション
2. リマインド内容を自然言語で入力

**一回限りリマインドの例：**
- 「明日9時に資料を送って」
- 「3時間後に会議のリマインド」
- 「来週月曜15時に提出期限」

**定期リマインドの例：**
- 「毎週月曜9時に定例会議」
- 「毎日12時に昼休憩の時間です」
- 「平日9時に朝会のリマインド」

**メンションの指定：**
- メッセージ内に `@everyone`、`@here`、ユーザー、ロールをメンションすると、そのメンションが使用されます
- 指定がない場合は `@everyone` が使用されます

**注意：**
- サーバー内で使用する場合、「サーバー管理」または「管理者」権限が必要です
- DMの場合は、自分宛てのリマインドのみ作成できます

### スケジュールの追加（スラッシュコマンド）

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

スケジュールとリマインドはSQLiteデータベース（`schedules.db`）に保存されます。Botを再起動してもスケジュールは保持されます。

- `schedules`: 定期リマインド（既存）
- `one_time_reminders`: 一回限りリマインド（新規）

**注意**: クラウドデプロイ時は、データベースファイルが永続化されるように設定してください（Railwayのボリューム、Renderのディスクなど）。

## デプロイ

Botをクラウドサーバーにデプロイする方法は [DEPLOY.md](./DEPLOY.md) を参照してください。

### おすすめのプラットフォーム

1. **Railway** - 最も簡単、無料プランあり（月$5のクレジット）
2. **Render** - 無料プランあり（スリープする可能性あり）
3. **Fly.io** - 無料プランあり、高速
4. **VPS** - DigitalOcean/Vultrなど（月額$4-6）

詳細は [DEPLOY.md](./DEPLOY.md) をご覧ください。

## テスト

プロジェクトにはVitestを使用したテストスイートが含まれています。

### テストの実行

```bash
# 開発モード（ウォッチモード）
npm test

# 一度だけ実行
npm run test:run
```

### テストカバレッジ

テストカバレッジレポートを生成するには：

```bash
npm run test:run -- --coverage
```

### テストファイル

- `src/__tests__/reminder.test.ts` - リマインド機能のユニットテスト
- `src/__tests__/cronHelper.test.ts` - Cron式ヘルパーのテスト
- `src/__tests__/integration.test.ts` - 統合テスト
- `src/__tests__/setup.test.ts` - セットアップとモジュールインポートのテスト

