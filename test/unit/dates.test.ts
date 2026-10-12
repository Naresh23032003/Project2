import { describe, expect, it } from 'vitest';
import { addDays, addMonths, dayOfMonth, daysBetween, monthIndex } from '../../src/engine/dates';

describe('dates', () => {
  it('counts days between ISO dates', () => {
    expect(daysBetween('2024-01-01', '2024-01-31')).toBe(30);
    expect(daysBetween('2024-02-28', '2024-03-01')).toBe(2);
    expect(daysBetween('2024-03-01', '2024-02-28')).toBe(-2);
    expect(daysBetween('2023-12-31', '2024-01-01')).toBe(1);
  });

  it('adds days across month and year ends', () => {
    expect(addDays('2024-01-31', 1)).toBe('2024-02-01');
    expect(addDays('2023-12-31', 1)).toBe('2024-01-01');
    expect(addDays('2024-03-01', -1)).toBe('2024-02-29');
  });

  it('adds months and clamps to the end of the month', () => {
    expect(addMonths('2024-01-31', 1)).toBe('2024-02-29');
    expect(addMonths('2023-01-31', 1)).toBe('2023-02-28');
    expect(addMonths('2024-01-31', 2)).toBe('2024-03-31');
    expect(addMonths('2024-11-15', 3)).toBe('2025-02-15');
    expect(addMonths('2024-03-10', 12)).toBe('2025-03-10');
    expect(addMonths('2024-02-29', 12)).toBe('2025-02-28');
  });

  it('gives a month index and day of month', () => {
    expect(monthIndex('2024-03-05')).toBe(2024 * 12 + 2);
    expect(dayOfMonth('2024-03-05')).toBe(5);
  });
});
