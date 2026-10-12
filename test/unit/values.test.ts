import { describe, expect, it } from 'vitest';
import { parseAmount, parseDate, inferDateOrder } from '../../src/engine/parse/values';

describe('parseDate', () => {
  it.each([
    ['05/03/2024', '2024-03-05'],
    ['5/3/2024', '2024-03-05'],
    ['05-03-2024', '2024-03-05'],
    ['05-03-24', '2024-03-05'],
    ['05.03.2024', '2024-03-05'],
    ['05 Mar 2024', '2024-03-05'],
    ['05-Mar-2024', '2024-03-05'],
    ['05-MAR-24', '2024-03-05'],
    ['5 March 2024', '2024-03-05'],
    ['Mar 5, 2024', '2024-03-05'],
    ['2024-03-05', '2024-03-05'],
    ['2024/03/05', '2024-03-05'],
    ['05/03/2024 14:22:10', '2024-03-05'],
    ['29/02/2024', '2024-02-29'],
    ['12/01/2024', '2024-01-12'],
  ])('reads %s as day first: %s', (input, iso) => {
    expect(parseDate(input)).toBe(iso);
  });

  it('never reads an ambiguous Indian date as month first', () => {
    expect(parseDate('03/04/2024')).toBe('2024-04-03');
  });

  it('reads month first only when asked', () => {
    expect(parseDate('03/04/2024', 'mdy')).toBe('2024-03-04');
  });

  it('reads Excel serial numbers', () => {
    expect(parseDate('45356')).toBe('2024-03-05');
    expect(parseDate(45356)).toBe('2024-03-05');
  });

  it.each(['', '  ', 'Opening Balance', '31/02/2024', '32/01/2024', '13/13/2024', '0', '99999999'])(
    'rejects %s',
    (input) => {
      expect(parseDate(input)).toBeNull();
    },
  );
});

describe('inferDateOrder', () => {
  it('stays day first when every sample fits', () => {
    expect(inferDateOrder(['05/03/2024', '06/03/2024', '12/04/2024'])).toBe('dmy');
  });
  it('switches to month first when a second part exceeds 12', () => {
    expect(inferDateOrder(['03/05/2024', '03/25/2024'])).toBe('mdy');
  });
  it('stays day first when a first part exceeds 12', () => {
    expect(inferDateOrder(['25/03/2024', '03/05/2024'])).toBe('dmy');
  });
  it('stays day first for fully ambiguous samples', () => {
    expect(inferDateOrder(['03/05/2024', '04/06/2024'])).toBe('dmy');
  });
});

describe('parseAmount', () => {
  it.each([
    ['1,234.56', 123456, false, undefined],
    ['12,34,567.89', 123456789, false, undefined],
    ['₹1,499.00', 149900, false, undefined],
    ['Rs. 500', 50000, false, undefined],
    ['INR 99.5', 9950, false, undefined],
    ['-500.00', 50000, true, undefined],
    ['500.00-', 50000, true, undefined],
    ['(500.00)', 50000, true, undefined],
    ['500.00 Dr', 50000, false, 'dr'],
    ['500.00Dr.', 50000, false, 'dr'],
    ['119.00(Dr)', 11900, false, 'dr'],
    ['50.00 (Cr)', 5000, false, 'cr'],
    ['1,200.00 CR', 120000, false, 'cr'],
    ['0.00', 0, false, undefined],
    ['199', 19900, false, undefined],
    ['0.1', 10, false, undefined],
  ])('reads %s', (input, paise, negative, side) => {
    expect(parseAmount(input)).toEqual({ paise, negative, side });
  });

  it('reads plain numbers from spreadsheets', () => {
    expect(parseAmount(1499.5)).toEqual({ paise: 149950, negative: false, side: undefined });
    expect(parseAmount(-20)).toEqual({ paise: 2000, negative: true, side: undefined });
  });

  it('avoids float drift', () => {
    expect(parseAmount('1.15')?.paise).toBe(115);
    expect(parseAmount('2.675')?.paise).toBe(268);
  });

  it.each(['', ' ', 'abc', 'Dr', '--', '1,2,3,x'])('rejects %s', (input) => {
    expect(parseAmount(input)).toBeNull();
  });
});
