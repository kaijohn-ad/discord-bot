import {
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  EmbedBuilder,
} from 'discord.js';
import { dbOperations } from '../storage/db.js';

// このファイルはexecute関数のみをエクスポートします
// コマンド定義は index.ts で統合されます

const ITEMS_PER_PAGE = 10;

export async function execute(interaction: ChatInputCommandInteraction) {
  if (!interaction.guild) {
    return interaction.reply({
      content: 'このコマンドはサーバー内でのみ使用できます。',
      ephemeral: true,
    });
  }

  const subcommand = interaction.options.getSubcommand();

  if (subcommand === 'list') {
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

    const page = interaction.options.getInteger('page') || 1;
    const schedules = dbOperations.getSchedulesByGuild(interaction.guild.id);

    if (schedules.length === 0) {
      return interaction.reply({
        content: '登録されているスケジュールがありません。',
        ephemeral: true,
      });
    }

    const totalPages = Math.ceil(schedules.length / ITEMS_PER_PAGE);
    const startIndex = (page - 1) * ITEMS_PER_PAGE;
    const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, schedules.length);
    const pageSchedules = schedules.slice(startIndex, endIndex);

    const embed = new EmbedBuilder()
      .setTitle('スケジュール一覧')
      .setDescription(`全 ${schedules.length} 件（ページ ${page}/${totalPages}）`)
      .setColor(0x5865f2)
      .setTimestamp();

    for (const schedule of pageSchedules) {
      const mentionText =
        schedule.mentionType === 'everyone'
          ? '@everyone'
          : schedule.mentionType === 'here'
          ? '@here'
          : schedule.mentionType === 'user'
          ? `<@${schedule.mentionId}>`
          : `<@&${schedule.mentionId}>`;

      const status = schedule.enabled === 1 ? '🟢 有効' : '🔴 無効';
      const channelMention = `<#${schedule.channelId}>`;

      embed.addFields({
        name: `#${schedule.id} ${status}`,
        value:
          `チャンネル: ${channelMention}\n` +
          `メンション: ${mentionText}\n` +
          `メッセージ: ${schedule.message.substring(0, 100)}${schedule.message.length > 100 ? '...' : ''}\n` +
          `Cron: \`${schedule.cron}\`\n` +
          `タイムゾーン: ${schedule.timezone}\n` +
          `作成者: <@${schedule.createdBy}>`,
        inline: false,
      });
    }

    if (totalPages > 1) {
      embed.setFooter({ text: `ページ ${page}/${totalPages} - /schedule list page:<番号> で他のページを表示` });
    }

    await interaction.reply({
      embeds: [embed],
      ephemeral: true,
    });
  }
}

