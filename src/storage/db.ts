import Database from 'better-sqlite3';
import path from 'path';
import { Schedule, ScheduleInput } from '../types.js';

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

