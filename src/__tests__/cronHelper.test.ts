import { describe, it, expect, beforeEach, vi } from 'vitest';
import { generateCronExpression, formatCronExpression, FrequencyType } from '../utils/cronHelper.js';

describe('Cron Helper', () => {
  describe('generateCronExpression', () => {
    it('should generate daily cron expression', () => {
      const cron = generateCronExpression(9, 0, 'daily');
      expect(cron).toBe('0 9 * * *');
    });

    it('should generate weekdays cron expression', () => {
      const cron = generateCronExpression(9, 30, 'weekdays');
      expect(cron).toBe('30 9 * * 1-5');
    });

    it('should generate weekends cron expression', () => {
      const cron = generateCronExpression(10, 0, 'weekends');
      expect(cron).toBe('0 10 * * 0,6');
    });

    it('should generate specific weekday cron expression', () => {
      const cron = generateCronExpression(14, 0, 'monday');
      expect(cron).toBe('0 14 * * 1');
    });

    it('should handle all weekdays', () => {
      const weekdays: FrequencyType[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
      const expectedCrons = ['0 9 * * 1', '0 9 * * 2', '0 9 * * 3', '0 9 * * 4', '0 9 * * 5', '0 9 * * 6', '0 9 * * 0'];
      
      weekdays.forEach((day, index) => {
        const cron = generateCronExpression(9, 0, day);
        expect(cron).toBe(expectedCrons[index]);
      });
    });
  });

  describe('formatCronExpression', () => {
    it('should format daily cron expression', () => {
      const formatted = formatCronExpression('0 9 * * *');
      expect(formatted).toBe('毎日 9:00');
    });

    it('should format weekdays cron expression', () => {
      const formatted = formatCronExpression('0 9 * * 1-5');
      expect(formatted).toBe('平日 9:00');
    });

    it('should format weekends cron expression', () => {
      const formatted = formatCronExpression('0 10 * * 0,6');
      expect(formatted).toBe('週末 10:00');
    });

    it('should format specific weekday cron expression', () => {
      const formatted = formatCronExpression('0 14 * * 1');
      expect(formatted).toBe('月曜日 14:00');
    });

    it('should return formatted cron for complex patterns', () => {
      // formatCronExpressionは複雑なパターンでも何らかの形式で返す
      const cron = '*/30 * * * *';
      const formatted = formatCronExpression(cron);
      expect(formatted).toBeDefined();
      expect(typeof formatted).toBe('string');
    });
  });
});

