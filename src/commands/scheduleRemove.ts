import {
  ChatInputCommandInteraction,
  PermissionFlagsBits,
} from 'discord.js';
import { dbOperations } from '../storage/db.js';
import { unscheduleJob } from '../scheduler/scheduler.js';

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

  if (subcommand === 'remove') {
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

    // 削除
    const deleted = dbOperations.removeSchedule(id, interaction.guild.id);
    if (deleted) {
      unscheduleJob(id);
      await interaction.reply({
        content: `✅ スケジュール #${id} を削除しました。`,
        ephemeral: true,
      });
    } else {
      await interaction.reply({
        content: `スケジュール #${id} の削除に失敗しました。`,
        ephemeral: true,
      });
    }
  }
}

