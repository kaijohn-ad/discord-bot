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

