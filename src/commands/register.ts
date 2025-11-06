import 'dotenv/config';
import { REST, Routes } from 'discord.js';
import { commands } from './index.js';

const token = process.env.DISCORD_TOKEN;
const applicationId = process.env.APPLICATION_ID;
const guildId = process.env.GUILD_ID;

if (!token) {
  console.error('DISCORD_TOKEN is not set in .env file');
  process.exit(1);
}

if (!applicationId) {
  console.error('APPLICATION_ID is not set in .env file');
  process.exit(1);
}

if (!guildId) {
  console.error('GUILD_ID is not set in .env file');
  process.exit(1);
}

const rest = new REST().setToken(token);

(async () => {
  try {
    console.log('スラッシュコマンドを登録中...');

    const commandData = Array.from(commands.values()).map((cmd) => cmd.data.toJSON());

    // Guildコマンドとして登録
    const data = await rest.put(
      Routes.applicationGuildCommands(applicationId, guildId),
      { body: commandData }
    ) as unknown[];

    console.log(`✅ ${data.length} 個のスラッシュコマンドを登録しました:`);
    for (const cmd of data) {
      if (cmd && typeof cmd === 'object' && 'name' in cmd) {
        console.log(`  - /${cmd.name}`);
      }
    }
  } catch (error) {
    console.error('コマンドの登録中にエラーが発生しました:', error);
    process.exit(1);
  }
})();

