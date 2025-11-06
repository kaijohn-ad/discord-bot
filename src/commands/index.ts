import { Collection, SlashCommandBuilder } from 'discord.js';
import type { ChatInputCommandInteraction } from 'discord.js';
import * as scheduleAdd from './scheduleAdd.js';
import * as scheduleList from './scheduleList.js';
import * as scheduleRemove from './scheduleRemove.js';
import * as schedulePause from './schedulePause.js';
import * as scheduleResume from './scheduleResume.js';
import * as scheduleTest from './scheduleTest.js';

// コマンドの型定義
export interface Command {
  data: SlashCommandBuilder | Omit<SlashCommandBuilder, 'addSubcommand' | 'addSubcommandGroup'>;
  execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
}

// 統合されたscheduleコマンドの定義
const scheduleData = new SlashCommandBuilder()
  .setName('schedule')
  .setDescription('スケジュール管理コマンド')
  // add サブコマンド
  .addSubcommand((subcommand) =>
    subcommand
      .setName('add')
      .setDescription('新しい定期メッセージを追加')
      .addChannelOption((option) =>
        option
          .setName('channel')
          .setDescription('メッセージを送信するチャンネル')
          .setRequired(true)
      )
      .addStringOption((option) =>
        option
          .setName('mention')
          .setDescription('メンションの種類')
          .setRequired(true)
          .addChoices(
            { name: 'ユーザー', value: 'user' },
            { name: 'ロール', value: 'role' },
            { name: '@everyone', value: 'everyone' },
            { name: '@here', value: 'here' }
          )
      )
      .addStringOption((option) =>
        option
          .setName('message')
          .setDescription('送信するメッセージ')
          .setRequired(true)
          .setMaxLength(2000)
      )
      .addStringOption((option) =>
        option
          .setName('cron')
          .setDescription('Cron式（例: 0 9 * * 1-5 は平日9時）')
          .setRequired(true)
      )
      .addMentionableOption((option) =>
        option
          .setName('target')
          .setDescription('メンション対象（ユーザーまたはロール、mentionがuser/roleの場合のみ）')
          .setRequired(false)
      )
      .addStringOption((option) =>
        option
          .setName('timezone')
          .setDescription('タイムゾーン（デフォルト: Asia/Tokyo）')
          .setRequired(false)
      )
  )
  // list サブコマンド
  .addSubcommand((subcommand) =>
    subcommand
      .setName('list')
      .setDescription('登録されているスケジュール一覧を表示')
      .addIntegerOption((option) =>
        option
          .setName('page')
          .setDescription('ページ番号（1から始まる）')
          .setRequired(false)
          .setMinValue(1)
      )
  )
  // remove サブコマンド
  .addSubcommand((subcommand) =>
    subcommand
      .setName('remove')
      .setDescription('スケジュールを削除')
      .addIntegerOption((option) =>
        option
          .setName('id')
          .setDescription('削除するスケジュールのID')
          .setRequired(true)
          .setMinValue(1)
      )
  )
  // pause サブコマンド
  .addSubcommand((subcommand) =>
    subcommand
      .setName('pause')
      .setDescription('スケジュールを一時停止')
      .addIntegerOption((option) =>
        option
          .setName('id')
          .setDescription('一時停止するスケジュールのID')
          .setRequired(true)
          .setMinValue(1)
      )
  )
  // resume サブコマンド
  .addSubcommand((subcommand) =>
    subcommand
      .setName('resume')
      .setDescription('スケジュールを再開')
      .addIntegerOption((option) =>
        option
          .setName('id')
          .setDescription('再開するスケジュールのID')
          .setRequired(true)
          .setMinValue(1)
      )
  )
  // test サブコマンド
  .addSubcommand((subcommand) =>
    subcommand
      .setName('test')
      .setDescription('スケジュールをテスト送信')
      .addIntegerOption((option) =>
        option
          .setName('id')
          .setDescription('テスト送信するスケジュールのID')
          .setRequired(true)
          .setMinValue(1)
      )
  );

// 統合されたexecute関数
async function scheduleExecute(interaction: ChatInputCommandInteraction): Promise<void> {
  const subcommand = interaction.options.getSubcommand();
  
  if (subcommand === 'add') {
    await scheduleAdd.execute(interaction);
  } else if (subcommand === 'list') {
    await scheduleList.execute(interaction);
  } else if (subcommand === 'remove') {
    await scheduleRemove.execute(interaction);
  } else if (subcommand === 'pause') {
    await schedulePause.execute(interaction);
  } else if (subcommand === 'resume') {
    await scheduleResume.execute(interaction);
  } else if (subcommand === 'test') {
    await scheduleTest.execute(interaction);
  }
}

export const commands = new Collection<string, Command>();

commands.set('schedule', {
  data: scheduleData as SlashCommandBuilder,
  execute: scheduleExecute,
});

