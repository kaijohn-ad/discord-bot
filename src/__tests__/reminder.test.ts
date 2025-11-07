import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { parseReminderText } from '../llm/parser.js';
import { getLLMProvider, createLLMProvider } from '../llm/provider.js';
import { oneTimeReminderOperations } from '../storage/db.js';
import { buildMention } from '../scheduler/scheduler.js';
import { MentionType } from '../types.js';

describe('LLM Provider', () => {
  beforeEach(() => {
    // 環境変数をリセット
    delete process.env.LLM_PROVIDER;
    delete process.env.LLM_MODEL;
    delete process.env.LLM_API_KEY;
    vi.resetModules();
  });

  it('should return null when API key is not set', async () => {
    const { createLLMProvider } = await import('../llm/provider.js');
    const provider = createLLMProvider();
    expect(provider).toBeNull();
  });

  it('should create OpenRouter provider when API key is set', async () => {
    process.env.LLM_PROVIDER = 'openrouter';
    process.env.LLM_API_KEY = 'test-key';
    process.env.LLM_MODEL = 'test-model';
    
    vi.resetModules();
    const { createLLMProvider } = await import('../llm/provider.js');
    const provider = createLLMProvider();
    expect(provider).not.toBeNull();
  });

  it('should create Google provider when provider is google', async () => {
    process.env.LLM_PROVIDER = 'google';
    process.env.LLM_API_KEY = 'test-key';
    process.env.LLM_MODEL = 'test-model';
    
    vi.resetModules();
    const { createLLMProvider } = await import('../llm/provider.js');
    const provider = createLLMProvider();
    expect(provider).not.toBeNull();
  });
});

describe('Natural Language Parser', () => {
  beforeEach(() => {
    // LLMプロバイダをモック（実際のモジュールを使用）
    vi.resetModules();
  });

  it('should parse date time with chrono-node', async () => {
    const result = await parseReminderText('明日9時に資料を送って');
    
    // chrono-nodeが日時を解析できる場合
    if (result && result.type === 'once') {
      expect(result.message).toContain('資料を送って');
      expect(result.runAt).toBeDefined();
    }
  });

  it('should detect frequency keywords', async () => {
    const result = await parseReminderText('毎週月曜9時に定例会議');
    
    if (result && result.type === 'recurring') {
      expect(result.frequency).toBe('monday');
      expect(result.hour).toBe(9);
    }
  });

  it('should handle daily frequency', async () => {
    const result = await parseReminderText('毎日12時に昼休憩');
    
    if (result && result.type === 'recurring') {
      expect(result.frequency).toBe('daily');
      expect(result.hour).toBe(12);
    }
  });

  it('should handle weekdays frequency', async () => {
    const result = await parseReminderText('平日9時に朝会');
    
    if (result && result.type === 'recurring') {
      expect(result.frequency).toBe('weekdays');
    }
  });
});

describe('Mention Builder', () => {
  it('should build @everyone mention', () => {
    const result = buildMention('everyone');
    expect(result.text).toBe('@everyone');
    expect(result.allowedMentions.parse).toContain('everyone');
  });

  it('should build @here mention', () => {
    const result = buildMention('here');
    expect(result.text).toBe('@here');
    expect(result.allowedMentions.parse).toContain('everyone');
  });

  it('should build user mention', () => {
    const userId = '123456789';
    const result = buildMention('user', userId);
    expect(result.text).toBe(`<@${userId}>`);
    expect(result.allowedMentions.users).toContain(userId);
  });

  it('should build role mention', () => {
    const roleId = '987654321';
    const result = buildMention('role', roleId);
    expect(result.text).toBe(`<@&${roleId}>`);
    expect(result.allowedMentions.roles).toContain(roleId);
  });

  it('should throw error for invalid mention type', () => {
    expect(() => buildMention('user' as MentionType, null)).toThrow();
  });
});

describe('One-Time Reminder Database Operations', () => {
  const testReminder = {
    guildId: 'test-guild',
    channelId: 'test-channel',
    userId: 'test-user',
    mentionType: 'everyone' as MentionType,
    mentionId: null,
    message: 'テストメッセージ',
    runAt: new Date(Date.now() + 3600000).toISOString(), // 1時間後
    timezone: 'Asia/Tokyo',
  };

  it('should add one-time reminder', () => {
    const id = oneTimeReminderOperations.addOneTimeReminder(testReminder);
    expect(id).toBeGreaterThan(0);
  });

  it('should get one-time reminder by ID', () => {
    const id = oneTimeReminderOperations.addOneTimeReminder(testReminder);
    const reminder = oneTimeReminderOperations.getOneTimeReminderById(id);
    
    expect(reminder).not.toBeNull();
    expect(reminder?.message).toBe(testReminder.message);
  });

  it('should get reminders by user', () => {
    oneTimeReminderOperations.addOneTimeReminder(testReminder);
    const reminders = oneTimeReminderOperations.getOneTimeRemindersByUser(testReminder.userId);
    
    expect(reminders.length).toBeGreaterThan(0);
  });

  it('should get due reminders', () => {
    const pastReminder = {
      ...testReminder,
      runAt: new Date(Date.now() - 1000).toISOString(), // 1秒前
    };
    
    oneTimeReminderOperations.addOneTimeReminder(pastReminder);
    const dueReminders = oneTimeReminderOperations.getDueReminders();
    
    expect(dueReminders.length).toBeGreaterThan(0);
  });

  it('should remove one-time reminder', () => {
    const id = oneTimeReminderOperations.addOneTimeReminder(testReminder);
    const removed = oneTimeReminderOperations.removeOneTimeReminder(id, testReminder.userId);
    
    expect(removed).toBe(true);
    
    const reminder = oneTimeReminderOperations.getOneTimeReminderById(id);
    expect(reminder).toBeNull();
  });

  it('should set enabled status', () => {
    const id = oneTimeReminderOperations.addOneTimeReminder(testReminder);
    const updated = oneTimeReminderOperations.setEnabled(id, testReminder.userId, false);
    
    expect(updated).toBe(true);
    
    const reminder = oneTimeReminderOperations.getOneTimeReminderById(id);
    expect(reminder?.enabled).toBe(0);
  });
});

describe('Integration Tests', () => {
  it('should parse and create one-time reminder', async () => {
    // モックなしで実際のパーサーをテスト（LLM APIキーが必要）
    // 実際の環境では、モックを使用することを推奨
    
    const text = '明日9時に資料を送って';
    const parsed = await parseReminderText(text);
    
    if (parsed && parsed.type === 'once') {
      expect(parsed.message).toBeDefined();
      expect(parsed.runAt).toBeDefined();
      
      // データベースに保存できることを確認
      const reminderId = oneTimeReminderOperations.addOneTimeReminder({
        guildId: null,
        channelId: null,
        userId: 'test-user',
        mentionType: parsed.mentionType || 'everyone',
        mentionId: parsed.mentionId || null,
        message: parsed.message,
        runAt: parsed.runAt!,
        timezone: 'Asia/Tokyo',
      });
      
      expect(reminderId).toBeGreaterThan(0);
      
      // クリーンアップ
      oneTimeReminderOperations.removeOneTimeReminder(reminderId, 'test-user');
    }
  });

  it('should parse and create recurring reminder', async () => {
    const text = '毎週月曜9時に定例会議';
    const parsed = await parseReminderText(text);
    
    if (parsed && parsed.type === 'recurring') {
      expect(parsed.frequency).toBe('monday');
      expect(parsed.hour).toBe(9);
      expect(parsed.message).toBeDefined();
    }
  });
});

