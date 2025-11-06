import 'dotenv/config';
import { Events, REST, Routes } from 'discord.js';
import { createBotClient } from './bot.js';
import { commands } from './commands/index.js';
import { dbOperations } from './storage/db.js';
import { scheduleJob, clearAllJobs } from './scheduler/scheduler.js';

const client = createBotClient();

// スラッシュコマンドの処理
client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const command = commands.get(interaction.commandName);
  if (!command) {
    console.error(`Command ${interaction.commandName} not found`);
    return;
  }

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(`Error executing command ${interaction.commandName}:`, error);
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({
        content: 'コマンドの実行中にエラーが発生しました。',
        ephemeral: true,
      });
    } else {
      await interaction.reply({
        content: 'コマンドの実行中にエラーが発生しました。',
        ephemeral: true,
      });
    }
  }
});

// スラッシュコマンドの自動登録（環境変数で制御）
async function registerCommands() {
  const token = process.env.DISCORD_TOKEN;
  const applicationId = process.env.APPLICATION_ID;
  const guildId = process.env.GUILD_ID;
  const autoRegister = process.env.AUTO_REGISTER_COMMANDS === 'true';

  if (!autoRegister) {
    console.log('ℹ️  スラッシュコマンドの自動登録は無効です（AUTO_REGISTER_COMMANDS=false）');
    return;
  }

  if (!token || !applicationId || !guildId) {
    console.warn('⚠️  スラッシュコマンドの自動登録に必要な環境変数が設定されていません');
    return;
  }

  try {
    console.log('📝 スラッシュコマンドを登録中...');
    const rest = new REST().setToken(token);
    const commandData = Array.from(commands.values()).map((cmd) => cmd.data.toJSON());

    const data = await rest.put(
      Routes.applicationGuildCommands(applicationId, guildId),
      { body: commandData }
    ) as unknown[];

    console.log(`✅ ${data.length} 個のスラッシュコマンドを登録しました`);
  } catch (error) {
    console.error('❌ スラッシュコマンドの登録中にエラーが発生しました:', error);
  }
}

// Bot起動時の処理
client.once(Events.ClientReady, async (readyClient) => {
  console.log(`✅ ${readyClient.user.tag} としてログインしました`);

  // スラッシュコマンドを自動登録
  await registerCommands();

  // 既存のジョブをクリア
  clearAllJobs();

  // データベースから有効なスケジュールを読み込んで登録
  const schedules = dbOperations.getEnabledSchedules();
  console.log(`📅 ${schedules.length} 件のスケジュールを読み込み中...`);

  for (const schedule of schedules) {
    try {
      scheduleJob(readyClient, schedule);
    } catch (error) {
      console.error(`Error scheduling job #${schedule.id}:`, error);
    }
  }

  console.log('✅ すべてのスケジュールを登録しました');
});

// エラーハンドリング
client.on(Events.Error, (error) => {
  console.error('Discord client error:', error);
});

process.on('SIGINT', () => {
  console.log('Shutting down...');
  clearAllJobs();
  dbOperations.close();
  client.destroy();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('Shutting down...');
  clearAllJobs();
  dbOperations.close();
  client.destroy();
  process.exit(0);
});

// Botをログイン
const token = process.env.DISCORD_TOKEN;
if (!token) {
  console.error('DISCORD_TOKEN is not set in .env file');
  process.exit(1);
}

client.login(token).catch((error) => {
  console.error('Failed to login:', error);
  process.exit(1);
});

