// Cron式を簡単に生成するユーティリティ関数

export type FrequencyType = 'daily' | 'weekdays' | 'weekends' | 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

/**
 * 時間と頻度からCron式を生成
 * @param hour 時（0-23）
 * @param minute 分（0-59、デフォルト: 0）
 * @param frequency 頻度
 * @returns Cron式
 */
export function generateCronExpression(
  hour: number,
  minute: number = 0,
  frequency: FrequencyType = 'daily'
): string {
  // 分 時 日 月 曜日
  // 0-59 0-23 1-31 1-12 0-6 (0=日曜日)

  const minuteStr = minute.toString().padStart(2, '0');
  const hourStr = hour.toString().padStart(2, '0');

  switch (frequency) {
    case 'daily':
      return `${minute} ${hour} * * *`;
    case 'weekdays':
      return `${minute} ${hour} * * 1-5`; // 月曜日から金曜日
    case 'weekends':
      return `${minute} ${hour} * * 0,6`; // 土曜日と日曜日
    case 'monday':
      return `${minute} ${hour} * * 1`;
    case 'tuesday':
      return `${minute} ${hour} * * 2`;
    case 'wednesday':
      return `${minute} ${hour} * * 3`;
    case 'thursday':
      return `${minute} ${hour} * * 4`;
    case 'friday':
      return `${minute} ${hour} * * 5`;
    case 'saturday':
      return `${minute} ${hour} * * 6`;
    case 'sunday':
      return `${minute} ${hour} * * 0`;
    default:
      return `${minute} ${hour} * * *`;
  }
}

/**
 * 時間範囲からCron式を生成（1時間ごと）
 * @param startHour 開始時刻（0-23）
 * @param endHour 終了時刻（0-23）
 * @param frequency 頻度
 * @returns Cron式の配列
 */
export function generateHourlyCronExpressions(
  startHour: number,
  endHour: number,
  frequency: FrequencyType = 'daily'
): string[] {
  const expressions: string[] = [];
  for (let hour = startHour; hour <= endHour; hour++) {
    expressions.push(generateCronExpression(hour, 0, frequency));
  }
  return expressions;
}

/**
 * Cron式を人間が読みやすい形式に変換
 * @param cron Cron式
 * @returns 読みやすい説明
 */
export function formatCronExpression(cron: string): string {
  const parts = cron.split(' ');
  if (parts.length !== 5) return cron;

  const [minute, hour, day, month, weekday] = parts;

  // 毎日特定の時間
  if (day === '*' && month === '*' && weekday === '*') {
    return `毎日 ${hour}:${minute.padStart(2, '0')}`;
  }

  // 平日
  if (weekday === '1-5') {
    return `平日 ${hour}:${minute.padStart(2, '0')}`;
  }

  // 週末
  if (weekday === '0,6') {
    return `週末 ${hour}:${minute.padStart(2, '0')}`;
  }

  // 特定の曜日
  const weekdayNames: { [key: string]: string } = {
    '0': '日曜日',
    '1': '月曜日',
    '2': '火曜日',
    '3': '水曜日',
    '4': '木曜日',
    '5': '金曜日',
    '6': '土曜日',
  };

  if (weekday in weekdayNames && day === '*' && month === '*') {
    return `${weekdayNames[weekday]} ${hour}:${minute.padStart(2, '0')}`;
  }

  return cron;
}

