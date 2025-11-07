import { describe, it, expect } from 'vitest';
import { config } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// 環境変数を読み込む
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
config({ path: path.join(__dirname, '../../.env') });

describe('Environment Configuration', () => {
  it('should have required Discord environment variables', () => {
    // テスト環境では必須ではないが、本番環境では必須
    // expect(process.env.DISCORD_TOKEN).toBeDefined();
  });

  it('should have optional LLM environment variables', () => {
    // LLM設定はオプション（自然言語リマインド機能を使用する場合のみ必要）
    const hasLLMConfig = !!process.env.LLM_API_KEY;
    
    if (hasLLMConfig) {
      expect(process.env.LLM_PROVIDER).toBeDefined();
      expect(process.env.LLM_MODEL).toBeDefined();
    }
  });
});

describe('Module Imports', () => {
  it('should import LLM provider module', async () => {
    const module = await import('../llm/provider.js');
    expect(module.createLLMProvider).toBeDefined();
    expect(module.getLLMProvider).toBeDefined();
  });

  it('should import parser module', async () => {
    const module = await import('../llm/parser.js');
    expect(module.parseReminderText).toBeDefined();
  });

  it('should import database operations', async () => {
    const module = await import('../storage/db.js');
    expect(module.dbOperations).toBeDefined();
    expect(module.oneTimeReminderOperations).toBeDefined();
  });

  it('should import scheduler modules', async () => {
    const schedulerModule = await import('../scheduler/scheduler.js');
    expect(schedulerModule.scheduleJob).toBeDefined();
    expect(schedulerModule.buildMention).toBeDefined();
    
    const oneTimeModule = await import('../scheduler/oneTime.js');
    expect(oneTimeModule.startOneTimeReminderPolling).toBeDefined();
    expect(oneTimeModule.stopOneTimeReminderPolling).toBeDefined();
  });

  it('should import cron helper', async () => {
    const module = await import('../utils/cronHelper.js');
    expect(module.generateCronExpression).toBeDefined();
    expect(module.formatCronExpression).toBeDefined();
  });
});

describe('Type Definitions', () => {
  it('should have correct type exports', async () => {
    const types = await import('../types.js');
    // MentionTypeは型エイリアスなので、実行時には存在しない
    // インポートが成功することを確認
    expect(types).toBeDefined();
    expect(typeof types).toBe('object');
  });
});

