import { describe, expect, it } from 'vitest';
import { formatRupees, ordinal } from '../../src/engine/format';

describe('formatRupees', () => {
  it.each([
    [0, '₹0'],
    [19900, '₹199'],
    [238800, '₹2,388'],
    [11950, '₹119.50'],
    [12345600, '₹1,23,456'],
    [10000000, '₹1,00,000'],
    [123456789, '₹12,34,567.89'],
    [99, '₹0.99'],
    [500, '₹5'],
  ])('%i paise is %s', (paise, text) => {
    expect(formatRupees(paise)).toBe(text);
  });
});

describe('ordinal', () => {
  it.each([[1, '1st'], [2, '2nd'], [3, '3rd'], [4, '4th'], [11, '11th'], [12, '12th'], [13, '13th'], [21, '21st'], [22, '22nd'], [23, '23rd'], [30, '30th'], [31, '31st']])(
    '%i is %s',
    (n, s) => expect(ordinal(n)).toBe(s),
  );
});
