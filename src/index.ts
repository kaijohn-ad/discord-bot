import 'dotenv/config';
import { Events, REST, Routes, PermissionFlagsBits } from 'discord.js';
import { createBotClient } from './bot.js';
import { commands } from './commands/index.js';
import { dbOperations, oneTimeReminderOperations } from './storage/db.js';
import { scheduleJob, clearAllJobs } from './scheduler/scheduler.js';
import { startOneTimeReminderPolling, stopOneTimeReminderPolling } from './scheduler/oneTime.js';
import { parseReminderText } from './llm/parser.js';
import { generateCronExpression } from './utils/cronHelper.js';

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

  // 一回限りリマインドのポーリングを開始
  startOneTimeReminderPolling(readyClient);
});

// メッセージ受信時の処理（自然言語リマインド）
client.on(Events.MessageCreate, async (message) => {
  // Bot自身のメッセージは無視
  if (message.author.bot) return;

  // DMまたはBotメンションの場合のみ処理
  const isDM = message.channel.isDMBased();
  const isMentioned = message.mentions.users.has(client.user!.id);

  // デバッグログ
  console.log(`[MessageCreate] Received message from ${message.author.tag}: ${message.content.substring(0, 50)}...`);
  console.log(`[MessageCreate] isDM: ${isDM}, isMentioned: ${isMentioned}`);

  if (!isDM && !isMentioned) {
    console.log('[MessageCreate] Skipping: not DM and not mentioned');
    return;
  }

  // LLMプロバイダが設定されていない場合はスキップ
  const { getLLMProvider } = await import('./llm/provider.js');
  const llmProvider = getLLMProvider();
  console.log(`[MessageCreate] LLM Provider: ${llmProvider ? 'available' : 'not available'}`);
  if (!llmProvider) {
    console.log('[MessageCreate] LLM provider not available, sending error message');
    if (isDM) {
      await message.reply('⚠️ LLM機能が設定されていません。管理者に連絡してください。');
    }
    return;
  }

  try {
    // 権限チェック（サーバー内の場合）
    if (!isDM && message.guild) {
      const member = message.member;
      if (
        !member ||
        typeof member.permissions === 'string' ||
        (!member.permissions.has(PermissionFlagsBits.ManageGuild) &&
          !member.permissions.has(PermissionFlagsBits.Administrator))
      ) {
        await message.reply('この機能を使用するには「サーバー管理」または「管理者」権限が必要です。');
        return;
      }
    }

    // Botメンションを除去してテキストを取得
    let text = message.content;
    if (isMentioned) {
      text = text.replace(new RegExp(`<@!?${client.user!.id}>`, 'g'), '').trim();
    }

    if (!text) {
      await message.reply('リマインド内容を入力してください。\n例: 「明日9時に資料を送って」「毎週月曜9時に定例会議」');
      return;
    }

    // 処理中メッセージを送信
    const processingMessage = await message.reply('⏳ リマインドを解析中...');

    // 自然言語を解析
    const parsed = await parseReminderText(text);

    if (!parsed) {
      await processingMessage.edit('❌ リマインド情報を解析できませんでした。もう一度お試しください。\n例: 「明日9時に資料を送って」「毎週月曜9時に定例会議」');
      return;
    }

    // メンション情報を取得（メッセージから実際のメンションを検出）
    let mentionType = parsed.mentionType || 'everyone';
    let mentionId: string | null = null;

    if (message.mentions.everyone) {
      mentionType = 'everyone';
    } else if (message.mentions.roles.size > 0) {
      mentionType = 'role';
      mentionId = message.mentions.roles.first()!.id;
    } else if (message.mentions.users.size > 0 && !message.mentions.users.has(client.user!.id)) {
      mentionType = 'user';
      mentionId = Array.from(message.mentions.users.keys()).find(id => id !== client.user!.id) || null;
    }

    const timezone = 'Asia/Tokyo';

    if (parsed.type === 'once') {
      // 一回限りリマインド
      const reminderId = oneTimeReminderOperations.addOneTimeReminder({
        guildId: message.guild?.id || null,
        channelId: isDM ? null : message.channel.id,
        userId: message.author.id,
        mentionType,
        mentionId,
        message: parsed.message,
        runAt: parsed.runAt!,
        timezone,
      });

      const runAtDate = new Date(parsed.runAt!);
      const formattedDate = runAtDate.toLocaleString('ja-JP', { timeZone: timezone });

      await processingMessage.edit(
        `✅ 一回限りリマインド #${reminderId} を登録しました。\n` +
        `📅 実行時刻: ${formattedDate}\n` +
        `💬 メッセージ: ${parsed.message}`
      );
    } else {
      // 定期リマインド
      const hour = parsed.hour ?? 9;
      const minute = parsed.minute ?? 0;
      const frequency = parsed.frequency || 'daily';
      const cron = generateCronExpression(hour, minute, frequency);

      const scheduleId = dbOperations.addSchedule({
        guildId: message.guild!.id,
        channelId: message.channel.id,
        mentionType,
        mentionId,
        message: parsed.message,
        cron,
        timezone,
        createdBy: message.author.id,
      });

      // スケジューラーに登録
      const schedule = dbOperations.getScheduleById(scheduleId);
      if (schedule) {
        scheduleJob(client, schedule);
      }

      const frequencyText = {
        daily: '毎日',
        weekdays: '平日のみ',
        weekends: '週末のみ',
        monday: '月曜日',
        tuesday: '火曜日',
        wednesday: '水曜日',
        thursday: '木曜日',
        friday: '金曜日',
        saturday: '土曜日',
        sunday: '日曜日',
      }[frequency];

      await processingMessage.edit(
        `✅ 定期リマインド #${scheduleId} を登録しました。\n` +
        `📅 スケジュール: ${frequencyText} ${hour}:${minute.toString().padStart(2, '0')}\n` +
        `💬 メッセージ: ${parsed.message}`
      );
    }
  } catch (error) {
    console.error('Error processing natural language reminder:', error);
    await message.reply('❌ リマインドの作成中にエラーが発生しました。');
  }
});

// エラーハンドリング
client.on(Events.Error, (error) => {
  console.error('Discord client error:', error);
});

process.on('SIGINT', () => {
  console.log('Shutting down...');
  clearAllJobs();
  stopOneTimeReminderPolling();
  dbOperations.close();
  client.destroy();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('Shutting down...');
  clearAllJobs();
  stopOneTimeReminderPolling();
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

