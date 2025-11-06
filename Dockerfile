# Dockerfile for Discord Bot
FROM node:20-alpine

WORKDIR /app

# 依存関係をコピーしてインストール
COPY package*.json ./
RUN npm ci --only=production

# ソースコードをコピー
COPY . .

# TypeScriptをビルド
RUN npm run build

# ポートを公開（必要に応じて）
EXPOSE 3000

# Botを起動
CMD ["npm", "start"]

