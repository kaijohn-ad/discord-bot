export type MentionType = 'user' | 'role' | 'everyone' | 'here';

export interface Schedule {
  id: number;
  guildId: string;
  channelId: string;
  mentionType: MentionType;
  mentionId: string | null;
  message: string;
  cron: string;
  timezone: string;
  enabled: number; // SQLite uses INTEGER for boolean
  createdBy: string;
  createdAt: string;
}

export interface ScheduleInput {
  guildId: string;
  channelId: string;
  mentionType: MentionType;
  mentionId: string | null;
  message: string;
  cron: string;
  timezone: string;
  createdBy: string;
}

export interface OneTimeReminder {
  id: number;
  guildId: string | null;
  channelId: string | null;
  userId: string;
  mentionType: MentionType;
  mentionId: string | null;
  message: string;
  runAt: string; // ISO 8601形式
  timezone: string;
  enabled: number;
  createdAt: string;
}

export interface OneTimeReminderInput {
  guildId: string | null;
  channelId: string | null;
  userId: string;
  mentionType: MentionType;
  mentionId: string | null;
  message: string;
  runAt: string;
  timezone: string;
}

