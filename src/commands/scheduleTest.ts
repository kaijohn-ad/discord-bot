import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  PermissionFlagsBits,
} from 'discord.js';
import { dbOperations } from '../storage/db.js';

// メンション文字列とallowedMentionsを構築
function buildMention(type: string, id?: string | null) {
  if (type === 'everyone') {
    return {
      text: '@everyone',
      allowedMentions: { parse: ['everyone'] as const },
    };
  }
  if (type === 'here') {
    return {
      text: '@here',
      allowedMentions: { parse: ['everyone'] as const },
    };
  }
  if (type === 'user' && id) {
    return {
      text: `<@${id}>`,
      allowedMentions: { users: [id] },
    };
  }
  if (type === 'role' && id) {
    return {
      text: `<@&${id}>`,
      allowedMentions: { roles: [id] },
    };
  }
  throw new Error(`Invalid mention type: ${type} with id: ${id}`);
}

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

  if (subcommand === 'test') {
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

    // テスト送信
    try {
      const channel = await interaction.client.channels.fetch(schedule.channelId);
      if (!channel || !('send' in channel)) {
        return interaction.reply({
          content: 'チャンネルが見つからないか、テキストチャンネルではありません。',
          ephemeral: true,
        });
      }

      const { text, allowedMentions } = buildMention(schedule.mentionType, schedule.mentionId);
      const content = `${text} ${schedule.message}`.trim();

      await channel.send({
        content,
        allowedMentions,
      });

      await interaction.reply({
        content: `✅ スケジュール #${id} のテスト送信を完了しました。`,
        ephemeral: true,
      });
    } catch (error) {
      console.error('Error testing schedule:', error);
      await interaction.reply({
        content: 'テスト送信中にエラーが発生しました。',
        ephemeral: true,
      });
    }
  }
}

