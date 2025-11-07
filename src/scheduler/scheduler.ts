import cron from 'node-cron';
import { Client } from 'discord.js';
import { Schedule, MentionType } from '../types.js';
import type { ScheduledTask } from 'node-cron';

const jobs = new Map<number, ScheduledTask>();

// メンション文字列とallowedMentionsを構築（共通化）
export function buildMention(type: MentionType, id?: string | null) {
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

// スケジュールされたメッセージを送信
async function sendScheduled(client: Client, schedule: Schedule): Promise<void> {
  try {
    const channel = await client.channels.fetch(schedule.channelId);
    if (!channel || !('send' in channel)) {
      console.error(`Channel ${schedule.channelId} is not a text channel or not found`);
      return;
    }

    const { text, allowedMentions } = buildMention(schedule.mentionType, schedule.mentionId);
    const content = `${text} ${schedule.message}`.trim();

    await channel.send({
      content,
      allowedMentions,
    });

    console.log(`Sent scheduled message #${schedule.id} to channel ${schedule.channelId}`);
  } catch (error) {
    console.error(`Error sending scheduled message #${schedule.id}:`, error);
  }
}

// スケジュールを登録
export function scheduleJob(client: Client, schedule: Schedule): void {
  // 既存のジョブがあれば削除
  if (jobs.has(schedule.id)) {
    const existingJob = jobs.get(schedule.id);
    if (existingJob) {
      existingJob.stop();
    }
    jobs.delete(schedule.id);
  }

  // Cron式の検証
  if (!cron.validate(schedule.cron)) {
    throw new Error(`Invalid cron expression: ${schedule.cron}`);
  }

  // 新しいジョブを登録
  const job = cron.schedule(
    schedule.cron,
    () => {
      sendScheduled(client, schedule);
    },
    {
      scheduled: schedule.enabled === 1,
      timezone: schedule.timezone || 'Asia/Tokyo',
    }
  );

  jobs.set(schedule.id, job);
  console.log(`Scheduled job #${schedule.id} with cron: ${schedule.cron} (timezone: ${schedule.timezone || 'Asia/Tokyo'})`);
}

// スケジュールを削除
export function unscheduleJob(id: number): void {
  const job = jobs.get(id);
  if (job) {
    job.stop();
    jobs.delete(id);
    console.log(`Unscheduled job #${id}`);
  }
}

// スケジュールを一時停止
export function pauseJob(id: number): void {
  const job = jobs.get(id);
  if (job) {
    job.stop();
    console.log(`Paused job #${id}`);
  }
}

// スケジュールを再開
export function resumeJob(id: number): void {
  const job = jobs.get(id);
  if (job) {
    job.start();
    console.log(`Resumed job #${id}`);
  }
}

// 全ジョブをクリア
export function clearAllJobs(): void {
  for (const [id, job] of jobs.entries()) {
    job.stop();
  }
  jobs.clear();
  console.log('Cleared all scheduled jobs');
}

// ジョブが存在するか確認
export function hasJob(id: number): boolean {
  return jobs.has(id);
}

