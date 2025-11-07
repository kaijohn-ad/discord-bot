// 一回限りリマインドのスケジューラー（毎分ポーリング）

import cron from 'node-cron';
import { Client } from 'discord.js';
import { OneTimeReminder } from '../types.js';
import { oneTimeReminderOperations } from '../storage/db.js';
import { buildMention } from './scheduler.js';

let pollingJob: cron.ScheduledTask | null = null;

// 一回限りリマインドを送信
async function sendOneTimeReminder(client: Client, reminder: OneTimeReminder): Promise<void> {
  try {
    let channel;
    
    if (reminder.channelId) {
      // サーバー内チャンネル
      channel = await client.channels.fetch(reminder.channelId);
    } else {
      // DM
      const user = await client.users.fetch(reminder.userId);
      channel = await user.createDM();
    }

    if (!channel || !('send' in channel)) {
      console.error(`Channel not found or not a text channel for reminder #${reminder.id}`);
      return;
    }

    const { text, allowedMentions } = buildMention(reminder.mentionType, reminder.mentionId);
    const content = `${text} ${reminder.message}`.trim();

    await channel.send({
      content,
      allowedMentions,
    });

    console.log(`Sent one-time reminder #${reminder.id} to ${reminder.channelId || 'DM'}`);

    // 送信後、データベースから削除
    oneTimeReminderOperations.removeOneTimeReminder(reminder.id, reminder.userId);
  } catch (error) {
    console.error(`Error sending one-time reminder #${reminder.id}:`, error);
    // エラーが発生した場合も削除（無限ループを防ぐ）
    try {
      oneTimeReminderOperations.removeOneTimeReminder(reminder.id, reminder.userId);
    } catch (deleteError) {
      console.error(`Error deleting reminder #${reminder.id}:`, deleteError);
    }
  }
}

// 実行時刻が来たリマインドをチェックして送信
async function checkAndSendDueReminders(client: Client): Promise<void> {
  const dueReminders = oneTimeReminderOperations.getDueReminders();
  
  for (const reminder of dueReminders) {
    await sendOneTimeReminder(client, reminder);
  }
}

// 一回限りリマインドのポーリングを開始
export function startOneTimeReminderPolling(client: Client): void {
  if (pollingJob) {
    console.log('One-time reminder polling is already running');
    return;
  }

  // 毎分実行
  pollingJob = cron.schedule('* * * * *', () => {
    checkAndSendDueReminders(client);
  }, {
    scheduled: true,
    timezone: 'Asia/Tokyo',
  });

  console.log('Started one-time reminder polling (every minute)');
}

// 一回限りリマインドのポーリングを停止
export function stopOneTimeReminderPolling(): void {
  if (pollingJob) {
    pollingJob.stop();
    pollingJob = null;
    console.log('Stopped one-time reminder polling');
  }
}

