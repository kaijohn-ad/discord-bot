# Dockerfile for Discord Bot
FROM node:20-alpine

WORKDIR /app

# 依存関係をコピーしてインストール（devDependenciesも含む）
COPY package*.json ./
RUN npm ci

# ソースコードをコピー
COPY . .

# TypeScriptをビルド
RUN npm run build

# 本番用の依存関係のみを再インストール（オプション：イメージサイズを小さくする場合）
# RUN npm ci --only=production && npm cache clean --force

# ポートを公開（必要に応じて）
EXPOSE 3000

# Botを起動
CMD ["npm", "start"]

