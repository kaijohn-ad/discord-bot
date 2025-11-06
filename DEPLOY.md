# デプロイガイド

このBotを様々なプラットフォームにデプロイする方法を説明します。

## 無料プラットフォーム（推奨）

### Railway（最も簡単）

1. https://railway.app にアクセス
2. GitHubアカウントでログイン
3. 「New Project」→「Deploy from GitHub repo」
4. このリポジトリを選択
5. 環境変数を設定：
   ```
   DISCORD_TOKEN=your_token
   APPLICATION_ID=your_app_id
   GUILD_ID=your_guild_id
   TZ=Asia/Tokyo
   ```
6. デプロイ完了！

**料金**: 無料プランあり（月$5のクレジット）

### Render

1. https://render.com にアクセス
2. 「New Web Service」を選択
3. GitHubリポジトリを接続
4. 設定：
   - **Build Command**: `npm run build`
   - **Start Command**: `npm start`
5. 環境変数を設定
6. デプロイ

**料金**: 無料プランあり（15分間の非アクティブでスリープ）

### Fly.io

```bash
# Fly CLIをインストール
curl -L https://fly.io/install.sh | sh

# ログイン
fly auth login

# アプリを作成
fly launch

# 環境変数を設定
fly secrets set DISCORD_TOKEN=xxx APPLICATION_ID=xxx GUILD_ID=xxx TZ=Asia/Tokyo

# デプロイ
fly deploy
```

**料金**: 無料プランあり（3つのVMまで）

## 有料VPS（月額$4-6）

### DigitalOcean / Vultr / Linode

1. Ubuntu 22.04のVPSを作成
2. SSHで接続
3. Node.jsをインストール:
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```
4. Botをクローン:
   ```bash
   git clone <your-repo-url>
   cd discord-bot
   npm install
   ```
5. `.env`ファイルを作成
6. ビルド: `npm run build`
7. PM2で常時起動:
   ```bash
   npm install -g pm2
   pm2 start dist/index.js --name discord-bot
   pm2 save
   pm2 startup
   ```

## デプロイ後の設定

### スラッシュコマンドの登録

デプロイ後、一度だけスラッシュコマンドを登録する必要があります：

```bash
npm run register
```

または、ローカルマシンから実行：
```bash
npm run register
```

### データベースの永続化

クラウドプラットフォームでは、データベースファイルが削除されないように設定してください：

- **Railway**: ボリュームを作成してマウント
- **Render**: ディスクストレージを有効化
- **Fly.io**: ボリュームを作成: `fly volumes create data`

## トラブルシューティング

### Botが起動しない

- 環境変数が正しく設定されているか確認
- ログを確認: `fly logs` または Railway/Renderのダッシュボード

### スケジュールが動作しない

- タイムゾーンが正しく設定されているか確認
- Cron式が正しいか確認
- Botが起動しているか確認

### データベースがリセットされる

- 永続化ストレージが設定されているか確認
- データベースファイルのパスを確認

