import { Client, GatewayIntentBits, Partials } from 'discord.js';

export function createBotClient(): Client {
  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
    ],
    partials: [Partials.Channel, Partials.Message],
    allowedMentions: {
      parse: [],
      users: [],
      roles: [],
    },
  });

  return client;
}

