import { describe, expect, it } from 'vitest';
import { formatDate, monthName } from '../../src/engine/labels';

describe('labels', () => {
  it('formats dates the way people say them', () => {
    expect(formatDate('2024-09-05')).toBe('5 Sep 2024');
    expect(formatDate('2025-01-31')).toBe('31 Jan 2025');
    expect(formatDate('not a date')).toBe('not a date');
  });
  it('names months in full', () => {
    expect(monthName('2024-04-05')).toBe('April');
    expect(monthName('2024-12-01')).toBe('December');
  });
});
