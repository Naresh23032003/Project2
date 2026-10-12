import { describe, expect, it } from 'vitest';
import { parseGrid } from '../../src/engine/parse/table';
import type { Grid, ParsedTable } from '../../src/engine/types';

function ok(grid: Grid, opts: Parameters<typeof parseGrid>[1] = { source: 'f.csv' }): ParsedTable {
  const r = parseGrid(grid, opts);
  if (r.status !== 'ok') throw new Error('expected ok, got ' + r.status);
  return r;
}
const brief = (r: ParsedTable) => r.txns.map((t) => [t.date, t.desc, t.direction, t.amount]);

describe('HDFC style export', () => {
  const grid: Grid = [
    ['Mr ASHA RAO', '', '', '', '', '', ''],
    ['Account Branch : ANDHERI WEST', '', '', '', '', '', ''],
    ['IFSC : HDFC0000123  MICR : 400240001', '', '', '', '', '', ''],
    ['Statement From : 01/01/2024 To : 31/03/2024', '', '', '', '', '', ''],
    [],
    ['Date', 'Narration', 'Chq./Ref.No.', 'Value Dt', 'Withdrawal Amt.', 'Deposit Amt.', 'Closing Balance'],
    ['********', '********', '********', '********', '********', '********', '********'],
    ['05/01/24', 'UPI-NETFLIX-NETFLIX@ICICI-ICIC0000001-412345678901-AUTOPAY', '0000412345678901', '05/01/24', '199.00', '', '45,000.50'],
    ['06/01/24', 'ACH D- HDFC LTD-1234567890 WRAPPED', '0000000123', '06/01/24', '12,500.00', '', '32,500.50'],
    ['', 'CONTINUED TEXT', '', '', '', '', ''],
    ['10/01/24', 'NEFT CR-SALARY TECHCORP', 'N123', '10/01/24', '', '1,00,000.00', '1,32,500.50'],
    ['', '', '', '', '', '', ''],
    ['STATEMENT SUMMARY :-', '', '', '', '', '', ''],
    ['Opening Balance', 'Dr Count', 'Cr Count', 'Debits', 'Credits', 'Closing Bal', ''],
    ['11/01/24', 'AFTER FOOTER', '', '', '5.00', '', ''],
  ];

  it('finds the header below the junk rows', () => {
    const r = ok(grid);
    expect(r.mapping.headerRow).toBe(5);
    expect(r.bank).toBe('hdfc');
  });

  it('reads debits, credits and joins wrapped narrations', () => {
    expect(brief(ok(grid))).toEqual([
      ['2024-01-05', 'UPI-NETFLIX-NETFLIX@ICICI-ICIC0000001-412345678901-AUTOPAY', 'debit', 19900],
      ['2024-01-06', 'ACH D- HDFC LTD-1234567890 WRAPPED CONTINUED TEXT', 'debit', 1250000],
      ['2024-01-10', 'NEFT CR-SALARY TECHCORP', 'credit', 10000000],
    ]);
  });

  it('keeps balances and refs, and stops at the footer', () => {
    const r = ok(grid);
    expect(r.txns[0]?.balance).toBe(4500050);
    expect(r.txns[0]?.ref).toBe('0000412345678901');
    expect(r.txns.length).toBe(3);
  });
});

describe('SBI style export', () => {
  const grid: Grid = [
    ['Account Name :', 'MR TEST USER'],
    ['Account Number :', '00000012345678901'],
    ['Branch :', 'SBIN0001234'],
    ['Txn Date', 'Value Date', 'Description', 'Ref No./Cheque No.', 'Debit', 'Credit', 'Balance'],
    ['5 Mar 2024', '5 Mar 2024', 'DEBIT-ACH D- BAJAJ FINANCE LTD SI 12345678', 'TRANSFER', '8,000.00', '', '20,000.00 CR'],
    ['7 Mar 2024', '7 Mar 2024', 'TO TRANSFER-UPI/DR/412345678905/RAVI KUMAR/SBIN/ravi@sbi/UPI', '', '500.00', '', '19,500.00 CR'],
  ];
  it('reads Txn Date, separate Debit and Credit columns and Cr-suffixed balances', () => {
    const r = ok(grid);
    expect(r.bank).toBe('sbi');
    expect(brief(r).map((x) => [x[0], x[2], x[3]])).toEqual([
      ['2024-03-05', 'debit', 800000],
      ['2024-03-07', 'debit', 50000],
    ]);
    expect(r.txns[0]?.balance).toBe(2000000);
  });
});

describe('ICICI style export', () => {
  const grid: Grid = [
    ['Detailed Statement'],
    ['Transactions List - Mr A TEST - 000000123456 (INR)'],
    ['S No.', 'Value Date', 'Transaction Date', 'Cheque Number', 'Transaction Remarks', 'Withdrawal Amount (INR)', 'Deposit Amount (INR)', 'Balance (INR)'],
    [1, '06/02/2024', '05/02/2024', '-', 'UPI/412345678901/Payment from PhonePe/netflix@icici/ICICI Bank', 199, 0, 9801],
    [2, '07/02/2024', '07/02/2024', '-', 'UPI/412345678902/NA/9876543210@ybl/State Bank Of India', 0, 2500, 12301],
  ];
  it('prefers Transaction Date over Value Date and accepts numeric cells', () => {
    const r = ok(grid);
    expect(brief(r)).toEqual([
      ['2024-02-05', 'UPI/412345678901/Payment from PhonePe/netflix@icici/ICICI Bank', 'debit', 19900],
      ['2024-02-07', 'UPI/412345678902/NA/9876543210@ybl/State Bank Of India', 'credit', 250000],
    ]);
  });
});

describe('Axis style export', () => {
  const grid: Grid = [
    ['Statement of Account No - 912010012345678 for the period (From : 01-04-2024 To : 30-06-2024)'],
    ['Tran Date', 'CHQNO', 'PARTICULARS', 'DR', 'CR', 'BAL', 'SOL'],
    ['05-04-2024', '', 'UPI/P2M/412345678901/SPOTIFY/UPI Mandate/HDFC BANK', '139.00', '', '10861.00', '6001'],
    ['06-04-2024', '', 'SALARY CREDIT', '', '50000.00', '60861.00', '6001'],
  ];
  it('reads DR and CR columns', () => {
    const r = ok(grid);
    expect(brief(r).map((x) => [x[0], x[2], x[3]])).toEqual([
      ['2024-04-05', 'debit', 13900],
      ['2024-04-06', 'credit', 5000000],
    ]);
  });
});

describe('Kotak style single amount column', () => {
  const grid: Grid = [
    ['Sl. No.', 'Transaction Date', 'Value Date', 'Description', 'Chq / Ref No.', 'Amount', 'Dr / Cr', 'Balance'],
    [1, '12-05-2024', '12-05-2024', 'SI-CULT FIT-5123XXXXXXXX9876', '', '1,299.00', 'DR', '8,000.00'],
    [2, '13-05-2024', '13-05-2024', 'NEFT-REFUND', '', '300.00', 'CR', '8,300.00'],
  ];
  it('uses the Dr / Cr marker column', () => {
    expect(brief(ok(grid)).map((x) => [x[2], x[3]])).toEqual([
      ['debit', 129900],
      ['credit', 30000],
    ]);
  });
});

describe('amount with suffix instead of a marker column', () => {
  const grid: Grid = [
    ['Date', 'Narration', 'Withdrawal(Dr)/Deposit(Cr)', 'Balance'],
    ['01/04/2024', 'SPOTIFY', '119.00(Dr)', '100.00'],
    ['02/04/2024', 'REFUND', '50.00(Cr)', '150.00'],
  ];
  it('reads Dr and Cr suffixes', () => {
    expect(brief(ok(grid)).map((x) => [x[2], x[3]])).toEqual([
      ['debit', 11900],
      ['credit', 5000],
    ]);
  });
});

describe('signed single amount column', () => {
  const bank: Grid = [
    ['Date', 'Description', 'Amount'],
    ['01/04/2024', 'NETFLIX', '-199.00'],
    ['02/04/2024', 'SPOTIFY', '-119.00'],
    ['03/04/2024', 'SALARY', '50000.00'],
    ['04/04/2024', 'ZOMATO', '-250.00'],
  ];
  const card: Grid = [
    ['Transaction Date', 'Transaction Description', 'Amount (in Rs.)'],
    ['01/04/2024', 'NETFLIX.COM MUMBAI', '199.00'],
    ['02/04/2024', 'SPOTIFY', '119.00'],
    ['03/04/2024', 'PAYMENT RECEIVED THANK YOU', '-5000.00'],
    ['04/04/2024', 'ZOMATO', '250.00'],
  ];
  it('treats the majority sign as debit (bank: negative)', () => {
    expect(ok(bank).txns.map((t) => t.direction)).toEqual(['debit', 'debit', 'credit', 'debit']);
  });
  it('treats the majority sign as debit (card: positive)', () => {
    expect(ok(card).txns.map((t) => t.direction)).toEqual(['debit', 'debit', 'credit', 'debit']);
  });
  it('flips when asked', () => {
    expect(ok(card, { source: 'c.csv', flip: true }).txns.map((t) => t.direction)).toEqual(['credit', 'credit', 'debit', 'credit']);
  });
});

describe('edge cases', () => {
  it('asks for a mapping when no header can be found', () => {
    const r = parseGrid([['a', 'b', 'c'], ['1', '2', '3']], { source: 'x.csv' });
    expect(r.status).toBe('needsMapping');
  });

  it('uses a supplied mapping', () => {
    const grid: Grid = [
      ['when', 'what', 'out', 'in'],
      ['01/04/2024', 'SPOTIFY', '119', ''],
    ];
    const r = ok(grid, { source: 'x.csv', mapping: { headerRow: 0, date: 0, desc: 1, debit: 2, credit: 3 } });
    expect(brief(r)).toEqual([['2024-04-01', 'SPOTIFY', 'debit', 11900]]);
  });

  it('skips rows with bad dates and zero amounts, and counts the bad ones', () => {
    const grid: Grid = [
      ['Date', 'Narration', 'Debit', 'Credit'],
      ['01/04/2024', 'OK', '10', ''],
      ['not a date', 'BAD', '10', ''],
      ['02/04/2024', 'ZERO', '0.00', ''],
    ];
    const r = ok(grid);
    expect(r.txns.length).toBe(1);
    expect(r.skippedRows).toBe(1);
  });

  it('reads Excel serial dates', () => {
    const grid: Grid = [
      ['Date', 'Narration', 'Debit', 'Credit'],
      [45356, 'SERIAL', 10, ''],
    ];
    expect(ok(grid).txns[0]?.date).toBe('2024-03-05');
  });

  it('reads month-first dates only when the data proves it, and says so', () => {
    const grid: Grid = [
      ['Date', 'Description', 'Debit', 'Credit'],
      ['03/25/2024', 'A', '10', ''],
      ['04/02/2024', 'B', '10', ''],
    ];
    const r = ok(grid);
    expect(r.dateOrder).toBe('mdy');
    expect(r.txns.map((t) => t.date)).toEqual(['2024-03-25', '2024-04-02']);
    expect(r.warnings.join(' ')).toMatch(/month first/i);
  });

  it('keeps day-first for ambiguous dates', () => {
    const grid: Grid = [
      ['Date', 'Description', 'Debit', 'Credit'],
      ['03/04/2024', 'A', '10', ''],
    ];
    expect(ok(grid).txns[0]?.date).toBe('2024-04-03');
  });

  it('ignores separator rows made of stars or dashes without counting them as bad', () => {
    const grid: Grid = [
      ['Date', 'Narration', 'Debit', 'Credit'],
      ['********', '********', '********', '********'],
      ['01/04/2024', 'FIRST', '10', ''],
      ['--------', '--------', '--------', '--------'],
      ['02/04/2024', 'SECOND', '20', ''],
    ];
    const r = ok(grid);
    expect(r.skippedRows).toBe(0);
    expect(r.txns.map((x) => x.desc)).toEqual(['FIRST', 'SECOND']);
  });

  it('ignores page number lines in the middle of a statement', () => {
    const grid: Grid = [
      ['Date', 'Narration', 'Debit', 'Credit'],
      ['01/04/2024', 'FIRST', '10', ''],
      ['Page 1 of 2', '', '', ''],
      ['', 'Page 2 of 2', '', ''],
      ['02/04/2024', 'SECOND', '20', ''],
    ];
    const r = ok(grid);
    expect(r.txns.map((x) => x.desc)).toEqual(['FIRST', 'SECOND']);
  });

  it('gives each transaction a unique id', () => {
    const grid: Grid = [
      ['Date', 'Narration', 'Debit', 'Credit'],
      ['01/04/2024', 'SAME', '10', ''],
      ['01/04/2024', 'SAME', '10', ''],
    ];
    const ids = ok(grid).txns.map((t) => t.id);
    expect(new Set(ids).size).toBe(2);
  });
});
