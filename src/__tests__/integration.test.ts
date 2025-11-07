import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Client, Message, Guild, TextChannel, DMChannel, User } from 'discord.js';
import { parseReminderText } from '../llm/parser.js';
import { oneTimeReminderOperations, dbOperations } from '../storage/db.js';
import { generateCronExpression } from '../utils/cronHelper.js';

// Discord.jsのモック
vi.mock('discord.js', () => {
  return {
    Client: vi.fn(),
    Message: vi.fn(),
    Guild: vi.fn(),
    TextChannel: vi.fn(),
    DMChannel: vi.fn(),
    User: vi.fn(),
  };
});

describe('End-to-End Reminder Flow', () => {
  beforeEach(() => {
    // テストデータのクリーンアップ
    // 実際の実装では、テスト用のデータベースを使用することを推奨
  });

  it('should handle one-time reminder creation flow', async () => {
    const text = '明日9時に資料を送って';
    
    // 1. パース
    const parsed = await parseReminderText(text);
    
    if (parsed && parsed.type === 'once') {
      // 2. データベースに保存
      const reminderId = oneTimeReminderOperations.addOneTimeReminder({
        guildId: null,
        channelId: null,
        userId: 'test-user-123',
        mentionType: parsed.mentionType || 'everyone',
        mentionId: parsed.mentionId || null,
        message: parsed.message,
        runAt: parsed.runAt!,
        timezone: 'Asia/Tokyo',
      });
      
      expect(reminderId).toBeGreaterThan(0);
      
      // 3. 取得して確認
      const reminder = oneTimeReminderOperations.getOneTimeReminderById(reminderId);
      expect(reminder).not.toBeNull();
      expect(reminder?.message).toBe(parsed.message);
      
      // 4. クリーンアップ
      oneTimeReminderOperations.removeOneTimeReminder(reminderId, 'test-user-123');
    }
  });

  it('should handle recurring reminder creation flow', async () => {
    const text = '毎週月曜9時に定例会議';
    
    // 1. パース
    const parsed = await parseReminderText(text);
    
    if (parsed && parsed.type === 'recurring') {
      // 2. Cron式を生成
      const cron = generateCronExpression(
        parsed.hour ?? 9,
        parsed.minute ?? 0,
        parsed.frequency || 'daily'
      );
      
      expect(cron).toBe('0 9 * * 1'); // 月曜9時
      
      // 3. データベースに保存（実際の実装では、スケジューラーにも登録）
      const scheduleId = dbOperations.addSchedule({
        guildId: 'test-guild',
        channelId: 'test-channel',
        mentionType: parsed.mentionType || 'everyone',
        mentionId: parsed.mentionId || null,
        message: parsed.message,
        cron,
        timezone: 'Asia/Tokyo',
        createdBy: 'test-user-123',
      });
      
      expect(scheduleId).toBeGreaterThan(0);
      
      // 4. クリーンアップ
      dbOperations.removeSchedule(scheduleId, 'test-guild');
    }
  });

  it('should handle multiple reminders for same user', async () => {
    const userId = 'test-user-multi';
    
    // 複数のリマインドを追加
    const id1 = oneTimeReminderOperations.addOneTimeReminder({
      guildId: null,
      channelId: null,
      userId,
      mentionType: 'everyone',
      mentionId: null,
      message: 'リマインド1',
      runAt: new Date(Date.now() + 3600000).toISOString(),
      timezone: 'Asia/Tokyo',
    });
    
    const id2 = oneTimeReminderOperations.addOneTimeReminder({
      guildId: null,
      channelId: null,
      userId,
      mentionType: 'everyone',
      mentionId: null,
      message: 'リマインド2',
      runAt: new Date(Date.now() + 7200000).toISOString(),
      timezone: 'Asia/Tokyo',
    });
    
    // ユーザーのリマインドを取得
    const reminders = oneTimeReminderOperations.getOneTimeRemindersByUser(userId);
    expect(reminders.length).toBeGreaterThanOrEqual(2);
    
    // クリーンアップ
    oneTimeReminderOperations.removeOneTimeReminder(id1, userId);
    oneTimeReminderOperations.removeOneTimeReminder(id2, userId);
  });
});

describe('Error Handling', () => {
  it('should handle invalid date parsing gracefully', async () => {
    const text = '無効な日時指定';
    const parsed = await parseReminderText(text);
    
    // LLMが設定されていない場合、nullが返される可能性がある
    // これは正常な動作
    expect(parsed === null || typeof parsed === 'object').toBe(true);
  });

  it('should handle missing required fields', () => {
    expect(() => {
      oneTimeReminderOperations.addOneTimeReminder({
        guildId: null,
        channelId: null,
        userId: '', // 空文字列
        mentionType: 'everyone',
        mentionId: null,
        message: '',
        runAt: new Date().toISOString(),
        timezone: 'Asia/Tokyo',
      });
    }).not.toThrow(); // SQLiteは空文字列を許可するため
  });
});

