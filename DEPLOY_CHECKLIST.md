# 本番デプロイ前チェックリスト

## ✅ 実装確認済み

- [x] 既存のスラッシュコマンド機能は維持されている
- [x] エラーハンドリングが適切に実装されている
- [x] LLM APIキーが設定されていない場合、警告を出して機能を無効化（既存機能には影響なし）
- [x] データベーステーブルは自動作成される（`CREATE TABLE IF NOT EXISTS`）
- [x] テストがすべて成功（43テスト）
- [x] 依存関係が正しく追加されている

## ⚠️ 本番デプロイ前に確認が必要な項目

### 1. Discord Developer Portal の設定

**必須**: MESSAGE CONTENT INTENT を有効化する必要があります

1. https://discord.com/developers/applications にアクセス
2. 該当するアプリケーションを選択
3. 左サイドバーの「Bot」セクションを開く
4. 「Privileged Gateway Intents」セクションで以下を有効化：
   - ✅ **MESSAGE CONTENT INTENT** （必須 - 自然言語リマインド機能に必要）
   - ✅ **SERVER MEMBERS INTENT** （既に有効化されている場合はそのまま）

⚠️ **重要**: この設定を行わないと、Botがメッセージ内容を読み取れず、自然言語リマインド機能が動作しません。

### 2. 環境変数の設定

本番環境で以下の環境変数を設定してください：

**必須（既存）:**
```env
DISCORD_TOKEN=your_bot_token_here
APPLICATION_ID=your_application_id_here
GUILD_ID=your_guild_id_here
TZ=Asia/Tokyo
AUTO_REGISTER_COMMANDS=true
```

**新規追加（自然言語リマインド機能を使用する場合）:**
```env
LLM_PROVIDER=openrouter
LLM_MODEL=x-ai/grok-beta
LLM_API_KEY=your_llm_api_key_here
```

**注意**: 
- `LLM_API_KEY`が設定されていない場合、自然言語リマインド機能は無効化されますが、既存のスラッシュコマンド機能は正常に動作します
- 自然言語リマインド機能を使用しない場合は、これらの環境変数は設定不要です

### 3. 依存関係のインストール

本番環境で以下を実行してください：

```bash
npm install
```

新しく追加された依存関係：
- `chrono-node`: 日時解析用
- `@google/generative-ai`: Google Gemini用（LLM_PROVIDER=googleの場合のみ必要）

### 4. データベースのマイグレーション

**自動実行されます** - 追加の作業は不要です。

Bot起動時に以下のテーブルが自動的に作成されます：
- `schedules` (既存)
- `one_time_reminders` (新規)

### 5. デプロイ後の確認事項

1. Botが正常に起動しているか確認
2. 既存のスラッシュコマンド（`/schedule list`など）が動作するか確認
3. LLM APIキーが設定されている場合：
   - BotにDMを送って自然言語リマインド機能をテスト
   - サーバー内でBotをメンションして自然言語リマインド機能をテスト
4. ログを確認してエラーがないか確認

## 🚀 デプロイ手順

1. コードをコミット
2. 本番環境にプッシュ
3. 環境変数を設定（上記参照）
4. Discord Developer PortalでMESSAGE CONTENT INTENTを有効化
5. Botを再起動
6. 動作確認

## 📝 ロールバック手順

問題が発生した場合：

1. 環境変数 `LLM_API_KEY` を削除または空にする
   - これにより自然言語リマインド機能が無効化され、既存機能のみが動作します
2. または、前のバージョンにロールバック

## ✅ 結論

**デプロイ可能です** - ただし、上記のチェックリストを確認してからデプロイしてください。

特に重要な点：
- ✅ 既存機能への影響なし（LLM APIキーが設定されていない場合でも動作）
- ⚠️ MESSAGE CONTENT INTENTの有効化が必要
- ⚠️ 環境変数の設定が必要（自然言語リマインド機能を使用する場合）

