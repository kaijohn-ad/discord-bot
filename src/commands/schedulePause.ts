import {
  ChatInputCommandInteraction,
  PermissionFlagsBits,
} from 'discord.js';
import { dbOperations } from '../storage/db.js';
import { pauseJob } from '../scheduler/scheduler.js';

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

  if (subcommand === 'pause') {
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

    const id = interaction.options.getInteger('id', true);

    // スケジュールが存在するか確認
    const schedule = dbOperations.getScheduleById(id);
    if (!schedule) {
      return interaction.reply({
        content: `スケジュール #${id} が見つかりません。`,
        ephemeral: true,
      });
    }

    // 同じギルドのスケジュールか確認
    if (schedule.guildId !== interaction.guild.id) {
      return interaction.reply({
        content: 'このスケジュールはこのサーバーのものではありません。',
        ephemeral: true,
      });
    }

    // 既に無効か確認
    if (schedule.enabled === 0) {
      return interaction.reply({
        content: `スケジュール #${id} は既に無効です。`,
        ephemeral: true,
      });
    }

    // 一時停止
    const updated = dbOperations.setEnabled(id, interaction.guild.id, false);
    if (updated) {
      pauseJob(id);
      await interaction.reply({
        content: `✅ スケジュール #${id} を一時停止しました。`,
        ephemeral: true,
      });
    } else {
      await interaction.reply({
        content: `スケジュール #${id} の一時停止に失敗しました。`,
        ephemeral: true,
      });
    }
  }
}

