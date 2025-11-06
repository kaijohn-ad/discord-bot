import { Client, GatewayIntentBits } from 'discord.js';

export function createBotClient(): Client {
  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds, // スラッシュコマンドに必要
    ],
    allowedMentions: {
      parse: [],
      users: [],
      roles: [],
    },
  });

  return client;
}

