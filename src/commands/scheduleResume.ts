import {
  ChatInputCommandInteraction,
  PermissionFlagsBits,
} from 'discord.js';
import { dbOperations } from '../storage/db.js';
import { resumeJob, scheduleJob } from '../scheduler/scheduler.js';

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

  if (subcommand === 'resume') {
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

    // 既に有効か確認
    if (schedule.enabled === 1) {
      return interaction.reply({
        content: `スケジュール #${id} は既に有効です。`,
        ephemeral: true,
      });
    }

    // 再開
    const updated = dbOperations.setEnabled(id, interaction.guild.id, true);
    if (updated) {
      // スケジュールを再登録（ジョブが存在しない場合は新規作成）
      const updatedSchedule = dbOperations.getScheduleById(id);
      if (updatedSchedule) {
        scheduleJob(interaction.client, updatedSchedule);
      }
      await interaction.reply({
        content: `✅ スケジュール #${id} を再開しました。`,
        ephemeral: true,
      });
    } else {
      await interaction.reply({
        content: `スケジュール #${id} の再開に失敗しました。`,
        ephemeral: true,
      });
    }
  }
}

