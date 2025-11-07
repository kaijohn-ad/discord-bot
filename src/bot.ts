import { Client, GatewayIntentBits } from 'discord.js';

export function createBotClient(): Client {
  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds, // スラッシュコマンドに必要
      GatewayIntentBits.GuildMessages, // サーバー内メッセージを読み取る
      GatewayIntentBits.DirectMessages, // DMを読み取る
      GatewayIntentBits.MessageContent, // メッセージ内容を読み取る（自然言語リマインド用）
    ],
    allowedMentions: {
      parse: [],
      users: [],
      roles: [],
    },
  });

  return client;
}

