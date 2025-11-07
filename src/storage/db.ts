import Database from 'better-sqlite3';
import path from 'path';
import { Schedule, ScheduleInput, OneTimeReminder, OneTimeReminderInput } from '../types.js';

const dbPath = path.join(process.cwd(), 'schedules.db');
const db = new Database(dbPath);

// テーブル作成
db.exec(`
  CREATE TABLE IF NOT EXISTS schedules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    guildId TEXT NOT NULL,
    channelId TEXT NOT NULL,
    mentionType TEXT NOT NULL,
    mentionId TEXT,
    message TEXT NOT NULL,
    cron TEXT NOT NULL,
    timezone TEXT NOT NULL DEFAULT 'Asia/Tokyo',
    enabled INTEGER NOT NULL DEFAULT 1,
    createdBy TEXT NOT NULL,
    createdAt TEXT NOT NULL DEFAULT (datetime('now'))
  )
`);

// 一回限りリマインドテーブル作成
db.exec(`
  CREATE TABLE IF NOT EXISTS one_time_reminders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    guildId TEXT,
    channelId TEXT,
    userId TEXT NOT NULL,
    mentionType TEXT NOT NULL,
    mentionId TEXT,
    message TEXT NOT NULL,
    runAt TEXT NOT NULL,
    timezone TEXT NOT NULL DEFAULT 'Asia/Tokyo',
    enabled INTEGER NOT NULL DEFAULT 1,
    createdAt TEXT NOT NULL DEFAULT (datetime('now'))
  )
`);

// CRUD操作
export const dbOperations = {
  // スケジュール追加
  addSchedule(input: ScheduleInput): number {
    const stmt = db.prepare(`
      INSERT INTO schedules (guildId, channelId, mentionType, mentionId, message, cron, timezone, createdBy)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(
      input.guildId,
      input.channelId,
      input.mentionType,
      input.mentionId,
      input.message,
      input.cron,
      input.timezone,
      input.createdBy
    );
    return result.lastInsertRowid as number;
  },

  // 有効なスケジュールを全件取得
  getEnabledSchedules(): Schedule[] {
    const stmt = db.prepare('SELECT * FROM schedules WHERE enabled = 1');
    return stmt.all() as Schedule[];
  },

  // ギルドIDで取得
  getSchedulesByGuild(guildId: string): Schedule[] {
    const stmt = db.prepare('SELECT * FROM schedules WHERE guildId = ? ORDER BY createdAt DESC');
    return stmt.all(guildId) as Schedule[];
  },

  // IDで取得
  getScheduleById(id: number): Schedule | null {
    const stmt = db.prepare('SELECT * FROM schedules WHERE id = ?');
    const result = stmt.get(id) as Schedule | undefined;
    return result || null;
  },

  // スケジュール削除
  removeSchedule(id: number, guildId: string): boolean {
    const stmt = db.prepare('DELETE FROM schedules WHERE id = ? AND guildId = ?');
    const result = stmt.run(id, guildId);
    return result.changes > 0;
  },

  // スケジュール有効/無効切り替え
  setEnabled(id: number, guildId: string, enabled: boolean): boolean {
    const stmt = db.prepare('UPDATE schedules SET enabled = ? WHERE id = ? AND guildId = ?');
    const result = stmt.run(enabled ? 1 : 0, id, guildId);
    return result.changes > 0;
  },

  // データベース接続を閉じる（終了時用）
  close(): void {
    db.close();
  },
};

// 一回限りリマインドのCRUD操作
export const oneTimeReminderOperations = {
  // 一回限りリマインド追加
  addOneTimeReminder(input: OneTimeReminderInput): number {
    const stmt = db.prepare(`
      INSERT INTO one_time_reminders (guildId, channelId, userId, mentionType, mentionId, message, runAt, timezone)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(
      input.guildId,
      input.channelId,
      input.userId,
      input.mentionType,
      input.mentionId,
      input.message,
      input.runAt,
      input.timezone
    );
    return result.lastInsertRowid as number;
  },

  // 実行時刻が来たリマインドを取得（有効なもののみ）
  getDueReminders(): OneTimeReminder[] {
    const now = new Date().toISOString();
    const stmt = db.prepare(`
      SELECT * FROM one_time_reminders 
      WHERE enabled = 1 AND runAt <= ?
      ORDER BY runAt ASC
    `);
    return stmt.all(now) as OneTimeReminder[];
  },

  // IDで取得
  getOneTimeReminderById(id: number): OneTimeReminder | null {
    const stmt = db.prepare('SELECT * FROM one_time_reminders WHERE id = ?');
    const result = stmt.get(id) as OneTimeReminder | undefined;
    return result || null;
  },

  // ユーザーIDで取得
  getOneTimeRemindersByUser(userId: string): OneTimeReminder[] {
    const stmt = db.prepare('SELECT * FROM one_time_reminders WHERE userId = ? ORDER BY runAt ASC');
    return stmt.all(userId) as OneTimeReminder[];
  },

  // ギルドIDで取得
  getOneTimeRemindersByGuild(guildId: string): OneTimeReminder[] {
    const stmt = db.prepare('SELECT * FROM one_time_reminders WHERE guildId = ? ORDER BY runAt ASC');
    return stmt.all(guildId) as OneTimeReminder[];
  },

  // 一回限りリマインド削除
  removeOneTimeReminder(id: number, userId: string): boolean {
    const stmt = db.prepare('DELETE FROM one_time_reminders WHERE id = ? AND userId = ?');
    const result = stmt.run(id, userId);
    return result.changes > 0;
  },

  // 一回限りリマインド有効/無効切り替え
  setEnabled(id: number, userId: string, enabled: boolean): boolean {
    const stmt = db.prepare('UPDATE one_time_reminders SET enabled = ? WHERE id = ? AND userId = ?');
    const result = stmt.run(enabled ? 1 : 0, id, userId);
    return result.changes > 0;
  },
};

