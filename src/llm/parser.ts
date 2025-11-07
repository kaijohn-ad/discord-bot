// 自然言語からリマインド情報を解析するパーサー

import * as chrono from 'chrono-node';
import { z } from 'zod';
import { getLLMProvider } from './provider.js';
import { MentionType } from '../types.js';
import { FrequencyType, generateCronExpression } from '../utils/cronHelper.js';

// 解析結果の型定義
const ParsedReminderSchema = z.object({
  type: z.enum(['once', 'recurring']),
  message: z.string().min(1).max(2000),
  mentionType: z.enum(['user', 'role', 'everyone', 'here']).optional(),
  mentionId: z.string().nullable().optional(),
  // 一回限りの場合
  runAt: z.string().optional(), // ISO 8601形式
  // 定期的な場合
  hour: z.number().int().min(0).max(23).optional(),
  minute: z.number().int().min(0).max(59).optional(),
  frequency: z.enum(['daily', 'weekdays', 'weekends', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']).optional(),
});

export type ParsedReminder = z.infer<typeof ParsedReminderSchema>;

// 頻度キーワードのマッピング
const frequencyKeywords: Record<string, FrequencyType> = {
  '毎日': 'daily',
  '平日': 'weekdays',
  '平日のみ': 'weekdays',
  '週末': 'weekends',
  '週末のみ': 'weekends',
  '毎週月曜': 'monday',
  '毎週火曜': 'tuesday',
  '毎週水曜': 'wednesday',
  '毎週木曜': 'thursday',
  '毎週金曜': 'friday',
  '毎週土曜': 'saturday',
  '毎週日曜': 'sunday',
  '月曜': 'monday',
  '月曜日': 'monday',
  '火曜': 'tuesday',
  '火曜日': 'tuesday',
  '水曜': 'wednesday',
  '水曜日': 'wednesday',
  '木曜': 'thursday',
  '木曜日': 'thursday',
  '金曜': 'friday',
  '金曜日': 'friday',
  '土曜': 'saturday',
  '土曜日': 'saturday',
  '日曜': 'sunday',
  '日曜日': 'sunday',
};

/**
 * chrono-nodeで日時を解析
 */
function parseDateTime(text: string): { date: Date | null; remainingText: string } {
  const results = chrono.ja.parse(text);
  if (results.length === 0) {
    return { date: null, remainingText: text };
  }

  // 最初の結果を使用
  const result = results[0];
  const date = result.start.date();
  
  // 解析された部分をテキストから除去（簡易的な実装）
  const startIndex = result.index;
  const endIndex = result.index + result.text.length;
  const remainingText = text.slice(0, startIndex) + text.slice(endIndex);

  return { date, remainingText: remainingText.trim() };
}

/**
 * 頻度キーワードを検出
 */
function detectFrequency(text: string): FrequencyType | null {
  const lowerText = text.toLowerCase();
  for (const [keyword, frequency] of Object.entries(frequencyKeywords)) {
    if (lowerText.includes(keyword.toLowerCase())) {
      return frequency;
    }
  }
  return null;
}

/**
 * メンション情報を検出
 */
function detectMentions(text: string): { mentionType: MentionType; mentionId: string | null } {
  if (text.includes('@everyone') || text.includes('everyone')) {
    return { mentionType: 'everyone', mentionId: null };
  }
  if (text.includes('@here') || text.includes('here')) {
    return { mentionType: 'here', mentionId: null };
  }
  // ユーザー/ロールのメンションは実際のDiscordメッセージから取得する必要がある
  return { mentionType: 'everyone', mentionId: null };
}

/**
 * LLMを使って自然言語を解析
 */
async function parseWithLLM(text: string): Promise<ParsedReminder | null> {
  const provider = getLLMProvider();
  if (!provider) {
    return null;
  }

  const systemPrompt = `あなたはDiscordボットのリマインド機能のためのパーサーです。
ユーザーの自然言語入力から、リマインド情報を抽出してJSON形式で返してください。

返すJSONの形式:
{
  "type": "once" | "recurring",
  "message": "リマインドメッセージ",
  "mentionType": "everyone" | "here" | "user" | "role" (オプション),
  "runAt": "ISO 8601形式の日時" (typeが"once"の場合),
  "hour": 0-23 (typeが"recurring"の場合),
  "minute": 0-59 (typeが"recurring"の場合、省略時は0),
  "frequency": "daily" | "weekdays" | "weekends" | "monday" | ... (typeが"recurring"の場合)
}

例:
- "明日9時に資料を送って" → {"type":"once","message":"資料を送って","runAt":"2024-01-02T09:00:00+09:00"}
- "毎週月曜9時に定例会議" → {"type":"recurring","message":"定例会議","hour":9,"minute":0,"frequency":"monday"}
- "毎日12時に昼休憩" → {"type":"recurring","message":"昼休憩","hour":12,"minute":0,"frequency":"daily"}

必ず有効なJSONのみを返してください。説明文は不要です。`;

  const response = await provider.generate(text, systemPrompt);
  
  if (response.error || !response.content) {
    console.error('LLM解析エラー:', response.error);
    return null;
  }

  // JSONを抽出（コードブロックがあれば除去）
  let jsonText = response.content.trim();
  if (jsonText.startsWith('```')) {
    const lines = jsonText.split('\n');
    jsonText = lines.slice(1, -1).join('\n').trim();
  }
  if (jsonText.startsWith('json')) {
    jsonText = jsonText.slice(4).trim();
  }

  try {
    const parsed = JSON.parse(jsonText);
    const validated = ParsedReminderSchema.parse(parsed);
    return validated;
  } catch (error) {
    console.error('JSON解析エラー:', error);
    return null;
  }
}

/**
 * 自然言語テキストからリマインド情報を解析
 */
export async function parseReminderText(text: string): Promise<ParsedReminder | null> {
  // 1. chrono-nodeで日時を解析
  const { date, remainingText } = parseDateTime(text);

  // 2. 頻度キーワードを検出
  const frequency = detectFrequency(text);

  // 3. メンション情報を検出
  const mentions = detectMentions(text);

  // 4. 日時が解析できた場合
  if (date) {
    const now = new Date();
    if (date > now) {
      // 未来の日時 = 一回限り
      return {
        type: 'once',
        message: remainingText || text,
        mentionType: mentions.mentionType,
        mentionId: mentions.mentionId,
        runAt: date.toISOString(),
      };
    }
  }

  // 5. 頻度が検出された場合 = 定期
  if (frequency) {
    // 時刻を抽出（簡易的な実装）
    const timeMatch = text.match(/(\d{1,2})[時時](\d{1,2})?[分分]?/);
    const hour = timeMatch ? parseInt(timeMatch[1], 10) : 9; // デフォルト9時
    const minute = timeMatch && timeMatch[2] ? parseInt(timeMatch[2], 10) : 0;

    return {
      type: 'recurring',
      message: remainingText || text,
      mentionType: mentions.mentionType,
      mentionId: mentions.mentionId,
      hour,
      minute,
      frequency,
    };
  }

  // 6. LLMで補完
  const llmResult = await parseWithLLM(text);
  if (llmResult) {
    return llmResult;
  }

  return null;
}

