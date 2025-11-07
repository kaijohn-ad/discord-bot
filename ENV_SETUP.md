# 環境変数の設定手順

本番環境で環境変数を設定する方法をプラットフォーム別に説明します。

## 📋 設定する環境変数一覧

### 必須（既存機能用）
```env
DISCORD_TOKEN=your_bot_token_here
APPLICATION_ID=your_application_id_here
GUILD_ID=your_guild_id_here
TZ=Asia/Tokyo
AUTO_REGISTER_COMMANDS=true
```

### 新規追加（自然言語リマインド機能用）
```env
LLM_PROVIDER=openrouter
LLM_MODEL=x-ai/grok-beta
LLM_API_KEY=your_llm_api_key_here
```

**注意**: `LLM_API_KEY`が設定されていない場合、自然言語リマインド機能は無効化されますが、既存のスラッシュコマンド機能は正常に動作します。

---

## 🚂 Railway での設定方法

### 手順

1. **Railwayダッシュボードにアクセス**
   - https://railway.app にログイン
   - プロジェクトを選択

2. **環境変数を設定**
   - プロジェクトのダッシュボードで「Variables」タブをクリック
   - 「New Variable」をクリック

3. **各環境変数を追加**
   ```
   DISCORD_TOKEN = your_bot_token_here
   APPLICATION_ID = your_application_id_here
   GUILD_ID = your_guild_id_here
   TZ = Asia/Tokyo
   AUTO_REGISTER_COMMANDS = true
   LLM_PROVIDER = openrouter
   LLM_MODEL = x-ai/grok-beta
   LLM_API_KEY = your_llm_api_key_here
   ```

4. **保存**
   - 各変数を追加したら「Add」をクリック
   - すべて追加したら、Botが自動的に再デプロイされます

### スクリーンショットの参考
- Variablesタブ → New Variable → キーと値を入力 → Add

---

## 🎨 Render での設定方法

### 手順

1. **Renderダッシュボードにアクセス**
   - https://render.com にログイン
   - サービスを選択

2. **環境変数を設定**
   - 左サイドバーの「Environment」をクリック
   - 「Add Environment Variable」をクリック

3. **各環境変数を追加**
   ```
   Key: DISCORD_TOKEN
   Value: your_bot_token_here
   
   Key: APPLICATION_ID
   Value: your_application_id_here
   
   Key: GUILD_ID
   Value: your_guild_id_here
   
   Key: TZ
   Value: Asia/Tokyo
   
   Key: AUTO_REGISTER_COMMANDS
   Value: true
   
   Key: LLM_PROVIDER
   Value: openrouter
   
   Key: LLM_MODEL
   Value: x-ai/grok-beta
   
   Key: LLM_API_KEY
   Value: your_llm_api_key_here
   ```

4. **保存**
   - 「Save Changes」をクリック
   - サービスが自動的に再デプロイされます

---

## ✈️ Fly.io での設定方法

### 手順

1. **Fly CLIでログイン**
   ```bash
   fly auth login
   ```

2. **環境変数を一括設定**
   ```bash
   fly secrets set \
     DISCORD_TOKEN=your_bot_token_here \
     APPLICATION_ID=your_application_id_here \
     GUILD_ID=your_guild_id_here \
     TZ=Asia/Tokyo \
     AUTO_REGISTER_COMMANDS=true \
     LLM_PROVIDER=openrouter \
     LLM_MODEL=x-ai/grok-beta \
     LLM_API_KEY=your_llm_api_key_here
   ```

   または、個別に設定：
   ```bash
   fly secrets set DISCORD_TOKEN=your_bot_token_here
   fly secrets set APPLICATION_ID=your_application_id_here
   fly secrets set GUILD_ID=your_guild_id_here
   fly secrets set TZ=Asia/Tokyo
   fly secrets set AUTO_REGISTER_COMMANDS=true
   fly secrets set LLM_PROVIDER=openrouter
   fly secrets set LLM_MODEL=x-ai/grok-beta
   fly secrets set LLM_API_KEY=your_llm_api_key_here
   ```

3. **確認**
   ```bash
   fly secrets list
   ```

4. **再デプロイ（必要に応じて）**
   ```bash
   fly deploy
   ```

---

## 💻 VPS（DigitalOcean/Vultr/Linode等）での設定方法

### 手順

1. **SSHでサーバーに接続**
   ```bash
   ssh user@your-server-ip
   ```

2. **プロジェクトディレクトリに移動**
   ```bash
   cd discord-bot
   ```

3. **`.env`ファイルを作成または編集**
   ```bash
   nano .env
   ```

4. **環境変数を記述**
   ```env
   DISCORD_TOKEN=your_bot_token_here
   APPLICATION_ID=your_application_id_here
   GUILD_ID=your_guild_id_here
   TZ=Asia/Tokyo
   AUTO_REGISTER_COMMANDS=true
   LLM_PROVIDER=openrouter
   LLM_MODEL=x-ai/grok-beta
   LLM_API_KEY=your_llm_api_key_here
   ```

5. **保存**
   - `Ctrl + X` → `Y` → `Enter`（nanoエディタの場合）

6. **PM2で再起動（使用している場合）**
   ```bash
   pm2 restart discord-bot
   ```

---

## 🔐 環境変数の取得方法

### DISCORD_TOKEN / APPLICATION_ID / GUILD_ID

1. **Discord Developer Portal**にアクセス: https://discord.com/developers/applications
2. **Application ID**: 左サイドバー「General Information」→「Application ID」をコピー
3. **Bot Token**: 左サイドバー「Bot」→「Reset Token」または「Copy」でトークンを取得
4. **Guild ID**: Discordで開発者モードを有効化 → サーバー名を右クリック → 「IDをコピー」

### LLM_API_KEY

#### OpenRouterを使用する場合

1. **OpenRouter**にアクセス: https://openrouter.ai
2. アカウントを作成またはログイン
3. 「Keys」ページでAPIキーを生成
4. APIキーをコピー

**推奨モデル**: `x-ai/grok-beta`（デフォルト）

#### Google Geminiを使用する場合

1. **Google AI Studio**にアクセス: https://makersuite.google.com/app/apikey
2. APIキーを生成
3. APIキーをコピー

**環境変数の設定**:
```env
LLM_PROVIDER=google
LLM_MODEL=gemini-2.5-flash-sep
LLM_API_KEY=your_google_api_key_here
```

---

## ✅ 設定後の確認

環境変数を設定したら、以下を確認してください：

1. **Botが正常に起動しているか**
   - ログを確認（Railway/Render/Fly.ioのダッシュボード、または`fly logs`）

2. **既存機能が動作するか**
   ```bash
   # Discordで以下を実行
   /schedule list
   ```

3. **自然言語リマインド機能が動作するか**（LLM_API_KEYを設定した場合）
   - BotにDMを送る: 「明日9時にテスト」
   - またはサーバー内でBotをメンション: `@Bot名 明日9時にテスト`

---

## 🚨 トラブルシューティング

### 環境変数が反映されない

- **Railway/Render**: サービスを再デプロイ
- **Fly.io**: `fly deploy`を実行
- **VPS**: Botを再起動（`pm2 restart discord-bot`）

### LLM機能が動作しない

- `LLM_API_KEY`が正しく設定されているか確認
- ログで警告メッセージを確認: `⚠️ LLM_API_KEY が設定されていません`
- APIキーが有効か確認（OpenRouter/Google AI Studioで確認）

### 環境変数の値にスペースが含まれる場合

- 値を引用符で囲む: `LLM_MODEL="x-ai/grok-beta"`
- Fly.ioの場合: `fly secrets set LLM_MODEL="x-ai/grok-beta"`

---

## 📝 セキュリティ注意事項

⚠️ **重要**: 環境変数には機密情報が含まれます

- ✅ 環境変数はプラットフォームの管理画面で設定（`.env`ファイルをGitにコミットしない）
- ✅ APIキーは定期的にローテーションすることを推奨
- ✅ 本番環境と開発環境で異なるAPIキーを使用することを推奨

