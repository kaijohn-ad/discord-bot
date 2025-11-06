import {
  ChatInputCommandInteraction,
  PermissionFlagsBits,
} from 'discord.js';
import { z } from 'zod';
import cron from 'node-cron';
import { dbOperations } from '../storage/db.js';
import { scheduleJob } from '../scheduler/scheduler.js';
import { MentionType } from '../types.js';

const cronSchema = z.string().refine(
  (val) => cron.validate(val),
  { message: 'Invalid cron expression' }
);

// このファイルはexecute関数のみをエクスポートします
// コマンド定義は index.ts で統合されます

export async function execute(interaction: ChatInputCommandInteraction) {
  if (!interaction.guild) {
    return interaction.reply({
      content: 'このコマンドはサーバー内でのみ使用できます。',
      ephemeral: true,
    });
  }

  const subcommand = interaction.options.getSubcommand();

  if (subcommand === 'add') {
    // 権限チェック
    const member = interaction.member;
    if (
      !member ||
      typeof member.permissions === 'string' ||
      (!member.permissions.has(PermissionFlagsBits.ManageGuild) &&
        !member.permissions.has(PermissionFlagsBits.Administrator))
    ) {
      return interaction.reply({
        content: 'このコマンドを実行するには「サーバー管理」または「管理者」権限が必要です。',
        ephemeral: true,
      });
    }

    const channel = interaction.options.getChannel('channel', true);
    const mentionType = interaction.options.getString('mention', true) as MentionType;
    const target = interaction.options.getMentionable('target');
    const message = interaction.options.getString('message', true);
    const cronExpr = interaction.options.getString('cron', true);
    const timezone = interaction.options.getString('timezone') || 'Asia/Tokyo';

    // バリデーション
    if (mentionType === 'user' || mentionType === 'role') {
      if (!target) {
        return interaction.reply({
          content: `${mentionType === 'user' ? 'ユーザー' : 'ロール'}を指定してください。`,
          ephemeral: true,
        });
      }
    }

    // Cron式の検証
    const cronValidation = cronSchema.safeParse(cronExpr);
    if (!cronValidation.success) {
      return interaction.reply({
        content: `無効なCron式です: ${cronExpr}\n例: \`0 9 * * 1-5\` (平日9時)`,
        ephemeral: true,
      });
    }

    // チャンネルがテキストチャンネルか確認
    if (!('send' in channel)) {
      return interaction.reply({
        content: 'テキストチャンネルを指定してください。',
        ephemeral: true,
      });
    }

    // データベースに保存
    let mentionId: string | null = null;
    if (mentionType === 'user' && target && 'id' in target) {
      mentionId = target.id;
    } else if (mentionType === 'role' && target && 'id' in target) {
      mentionId = target.id;
    }

    try {
      const scheduleId = dbOperations.addSchedule({
        guildId: interaction.guild.id,
        channelId: channel.id,
        mentionType,
        mentionId,
        message,
        cron: cronExpr,
        timezone,
        createdBy: interaction.user.id,
      });

      // スケジューラーに登録
      const schedule = dbOperations.getScheduleById(scheduleId);
      if (schedule) {
        scheduleJob(interaction.client, schedule);
      }

      const mentionText =
        mentionType === 'everyone'
          ? '@everyone'
          : mentionType === 'here'
          ? '@here'
          : mentionType === 'user'
          ? `<@${mentionId}>`
          : `<@&${mentionId}>`;

      await interaction.reply({
        content: `✅ スケジュール #${scheduleId} を追加しました。\n` +
          `チャンネル: ${channel}\n` +
          `メンション: ${mentionText}\n` +
          `メッセージ: ${message}\n` +
          `Cron: \`${cronExpr}\`\n` +
          `タイムゾーン: ${timezone}`,
        ephemeral: true,
      });
    } catch (error) {
      console.error('Error adding schedule:', error);
      await interaction.reply({
        content: 'スケジュールの追加中にエラーが発生しました。',
        ephemeral: true,
      });
    }
  }
}

