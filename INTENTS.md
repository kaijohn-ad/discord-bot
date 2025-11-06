# Bot Intents設定ガイド

Discord Botを正常に動作させるためには、Developer Portalで必要なIntents（意図）を有効化する必要があります。

## 設定手順

1. [Discord Developer Portal](https://discord.com/developers/applications) にアクセス
2. あなたのアプリケーションを選択
3. 左サイドバーの「Bot」をクリック
4. 下にスクロールして「Privileged Gateway Intents」セクションを見つける
5. 以下のIntentsを有効化：

### 必須のIntent

- ✅ **MESSAGE CONTENT INTENT** - メッセージの内容を読み取るために必要

### オプションのIntent

- **SERVER MEMBERS INTENT** - サーバーメンバーの情報を取得する場合に必要（現在のBotでは不要）

## エラーが発生した場合

「Used disallowed intents」というエラーが表示された場合：

1. Developer Portalで上記のIntentsが有効になっているか確認
2. Bot Tokenを再生成（「Reset Token」をクリック）
3. `.env`ファイルの`DISCORD_TOKEN`を更新
4. Botを再起動

## 参考

- [Discord Gateway Intents](https://discord.com/developers/docs/topics/gateway#gateway-intents)
- [Privileged Intents](https://discord.com/developers/docs/topics/gateway#privileged-intents)

