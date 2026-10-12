import { describe, expect, it } from 'vitest';
import { normalize } from '../../src/engine/normalize';
import merchants from '../../src/data/merchants.json';
import type { Merchant, Rail } from '../../src/engine/types';

type Case = [desc: string, key: string, rail?: Rail, mandate?: boolean];

const generic: Case[] = [
  // HDFC style UPI: UPI-<payee>-<vpa>-<ifsc>-<ref>-<note>
  ['UPI-NETFLIX-NETFLIX@ICICI-ICIC0000001-412345678901-AUTOPAY', 'netflix', 'upi', true],
  ['UPI-SPOTIFY INDIA-SPOTIFYUPI.PAYU@HDFCBANK-HDFC0000001-501234567890-UPI MANDATE', 'spotify', 'upi', true],
  ['UPI-SWIGGY-SWIGGY@ICICI-ICIC0000001-412345678901-UPI', 'swiggy', 'upi', false],
  ['UPI-RAHUL SHARMA-RAHUL123@OKAXIS-UTIB0000001-412345678901-PAYMENT FROM PHONE', 'rahul sharma', 'upi', false],
  ['UPI-GOOGLE PLAY-GOOGLEPLAY@AXISBANK-UTIB0000002-412345678902-UPI', 'google play', 'upi', false],
  ['UPI-JIO PREPAID-JIO@YESBANK-YESB0000001-412345678903-MOBILE RECHARGE', 'jio prepaid', 'upi', false],
  ['UPI-AMAZON PAY INDIA-AMAZONPAY@APL-UTIB0000003-412345678904-UPI', 'amazon pay', 'upi', false],
  ['UPI-HOTSTAR-HOTSTAR@PAYU-HDFC0000001-412345678905-AUTOPAY', 'hotstar', 'upi', true],
  ['UPI-BILLDESK-BD.NETFLIX@HDFCBANK-HDFC0000001-412345678906-UPI', 'netflix', 'upi', false],
  ['UPI-RAZORPAY-RAZORPAY.SPOTIFY@AXISBANK-UTIB0000001-412345678907-UPI', 'spotify', 'upi', false],
  // Axis style UPI: UPI/P2M/<ref>/<payee>/<note>/<bank>
  ['UPI/P2M/412345678901/NETFLIX COM/Pay to Merchant/Federal Bank', 'netflix', 'upi', false],
  ['UPI/P2M/412345678901/SPOTIFY/UPI Mandate/HDFC BANK', 'spotify', 'upi', true],
  ['UPI/P2A/233368991817/NOUSHAD B/Kotak', 'noushad b', 'upi', false],
  ['UPI/P2M/412345678902/GOOGLE PLAY/Payment/Axis Bank', 'google play', 'upi', false],
  ['UPI/P2M/412345678903/APPLE MEDIA SERVICES/NA/ICICI Bank', 'apple media', 'upi', false],
  ['UPI/P2M/412345678904/CRED CLUB/Pay to/Yes Bank', 'cred club', 'upi', false],
  ['UPI/P2M/412345678905/PUNJAB STORE /Pay to/Federal Bank', 'punjab store', 'upi', false],
  // ICICI style UPI: UPI/<ref>/<note>/<vpa>/<bank>
  ['UPI/412345678901/Payment from PhonePe/netflix@icici/ICICI Bank', 'netflix', 'upi', false],
  ['UPI/412345678902/UPI/spotifyupi.payu@hdfcbank/HDFC BANK LTD', 'spotify', 'upi', false],
  ['UPI/412345678903/Mandate Payment/hotstar@yesbank/YES BANK', 'hotstar', 'upi', true],
  ['UPI/412345678904/NA/9876543210@ybl/State Bank Of India', 'phone 9876543210', 'upi', false],
  ['UPI/412345678905/AUTOPAY/bd.zee5@hdfcbank/HDFC BANK', 'zee5', 'upi', true],
  ['UPI/412345678906/rent march/9876543210@ybl/HDFC BANK', 'phone 9876543210', 'upi', false],
  ['UPI/412345678907/my gym fees/cultfit@icici/ICICI Bank', 'cultfit', 'upi', false],
  // SBI style
  ['UPI/DR/412345678901/NETFLIX/YESB/netflix@yesb/UPI', 'netflix', 'upi', false],
  ['TO TRANSFER-UPI/DR/412345678905/RAVI KUMAR/SBIN/ravi@sbi/UPI', 'ravi kumar', 'upi', false],
  ['BY TRANSFER-UPI/CR/412345678906/PRIYA N/KKBK/priya@kotak/UPI', 'priya n', 'upi', false],
  ['DEBIT-ACH BAJAJ FINANCE LTD SI 12345678', 'bajaj finance', 'nach', true],
  ['DEBIT-ACH D- SPOTIFY INDIA PVT LTD-412345', 'spotify', 'nach', true],
  // NACH, ACH, ECS
  ['ACH D- NETFLIX ENTERTAINMENT SERVICES INDIA LLP-412345', 'netflix entertainment', 'nach', true],
  ['ACH D- HDFC LTD-1234567890', 'hdfc', 'nach', true],
  ['ACH D- TATA SKY LTD-0012345', 'tata sky', 'nach', true],
  ['ACH D- BYJUS THINK AND LEARN PVT LTD-998877', 'byjus think and learn', 'nach', true],
  ['NACH DR ICICI PRUDENTIAL MUTUAL FUND 123456', 'icici prudential mutual fund', 'nach', true],
  ['NACH-DR-LIC OF INDIA-POLICY 123456', 'lic policy', 'nach', true],
  ['ECS-LIC OF INDIA-POLICY 123456', 'lic policy', 'nach', true],
  ['ECS DR 412345 AXIS MUTUAL FUND', 'axis mutual fund', 'nach', true],
  ['ACH D- INDIAN CLEARING CORP-SIP00123', 'indian clearing corp', 'nach', true],
  // standing instruction and mandates
  ['SI HDFC BANK CC 4012XXXXXXXX1234', 'hdfc bank cc', 'si', true],
  ['MANDATE DEBIT SPOTIFY 412345', 'spotify', 'si', true],
  ['E-MANDATE AUTOPAY NETFLIX COM 99887766', 'netflix', 'si', true],
  ['AUTOPAY SI-HOTSTAR 4012XXXXXXXX1234', 'hotstar', 'si', true],
  ['SI-CULT FIT-5123XXXXXXXX9876', 'cult fit', 'si', true],
  // card descriptors
  ['NETFLIX.COM MUMBAI IN', 'netflix'],
  ['NETFLIX.COM 866-579-7172 CA', 'netflix'],
  ['SPOTIFY P1A2B3C4 STOCKHOLM SE', 'spotify'],
  ['GOOGLE *YOUTUBE PREMIUM g.co/helppay#', 'google youtube premium'],
  ['GOOGLE *GOOGLE ONE', 'google one'],
  ['APPLE.COM/BILL ITUNES.COM', 'apple bill itunes'],
  ['POS 4012XXXXXXXX1234 SWIGGY ONE BANGALORE', 'swiggy one', 'card', false],
  ['POS XXXXXXXXXXXX5678 AMAZON PRIME MEMBERSHIP', 'amazon prime membership'],
  ['RAZ*CULT FIT BANGALORE', 'cult fit'],
  ['RZP*DISNEY HOTSTAR MUMBAI', 'disney hotstar'],
  ['PAYU*SONYLIV MUMBAI IN', 'sonyliv'],
  ['PAYTM*ZEE5 NOIDA', 'zee5'],
  ['BILLDESK*AIRTEL POSTPAID DELHI', 'airtel postpaid'],
  ['CCAVENUE*HUNGAMA MUMBAI', 'hungama'],
  ['MICROSOFT*MICROSOFT 365 MSBILL.INFO', 'microsoft 365 msbill'],
  ['CANVA* I04512-3488', 'canva'],
  ['OPENAI *CHATGPT SUBSCR SAN FRANCISCO US', 'openai chatgpt subscr'],
  ['ZOMATO GOLD MEMBERSHIP GURGAON', 'zomato gold membership'],
  ['PPSL*TIMES PRIME NEW DELHI', 'times prime'],
  ['LINKEDIN PREMIUM DUBLIN IE', 'linkedin premium'],
  // NEFT, IMPS, RTGS
  ['NEFT DR-HDFC0000001-RAMESH KUMAR-XXXXXXXX1234-NEFT123456', 'ramesh kumar', 'neft', false],
  ['IMPS-412345678901-RAHUL SHARMA-HDFC-XXXXXXXX1234-RENT', 'rahul sharma', 'imps', false],
  ['RTGS DR-ICIC0000001-SUNRISE BUILDERS-XXXXXXXX9876-RTGS9988', 'sunrise builders', 'neft', false],
  // misc
  ['EMI 12345678 BAJAJ FINANCE', 'emi bajaj finance'],
  ['ATM WDL 412345 MUMBAI', 'atm wdl'],
  ['  netflix   com  ', 'netflix'],
  ['UPI-RAMESH-9876543210@PAYTM-PYTM0123456-412345678908-RENT FOR MARCH', 'ramesh', 'upi', false],
  ['', ''],
];

describe('normalize without a merchant list', () => {
  it.each(generic)('%s', (desc, key, rail, mandate) => {
    const n = normalize(desc, []);
    expect(n.key).toBe(key);
    if (rail) expect(n.rail).toBe(rail);
    if (mandate !== undefined) expect(n.mandate).toBe(mandate);
  });

  it('has at least 60 cases', () => {
    expect(generic.length).toBeGreaterThanOrEqual(60);
  });
});

describe('normalize with the known merchant list', () => {
  const list = merchants as Merchant[];
  const netflixVariants = [
    'UPI/P2M/412345678901/NETFLIX COM/Pay to Merchant/Federal Bank',
    'UPI-NETFLIX-NETFLIX@ICICI-ICIC0000001-412345678901-AUTOPAY',
    'NETFLIX.COM MUMBAI IN',
    'NETFLIX.COM 866-579-7172 CA',
    'ACH D- NETFLIX ENTERTAINMENT SERVICES INDIA LLP-412345',
    'UPI/412345678901/Payment from PhonePe/netflix@icici/ICICI Bank',
    'E-MANDATE AUTOPAY NETFLIX COM 99887766',
  ];

  it.each(netflixVariants)('maps %s to one merchant', (desc) => {
    const n = normalize(desc, list);
    expect(n.key).toBe('netflix');
    expect(n.knownId).toBe('netflix');
    expect(n.display).toBe('Netflix');
  });

  it('keeps youtube premium apart from the generic google play charge', () => {
    expect(normalize('GOOGLE *YOUTUBE PREMIUM g.co/helppay#', list).knownId).toBe('youtube-premium');
    expect(normalize('UPI-GOOGLE PLAY-GOOGLEPLAY@AXISBANK-UTIB0000002-412345678902-UPI', list).knownId).toBe('google-play');
  });

  it('keeps swiggy one apart from plain swiggy orders', () => {
    expect(normalize('POS 4012XXXXXXXX1234 SWIGGY ONE BANGALORE', list).knownId).toBe('swiggy-one');
    expect(normalize('UPI-SWIGGY-SWIGGY@ICICI-ICIC0000001-412345678901-UPI', list).knownId).toBe('swiggy');
  });

  it('leaves unknown merchants without a knownId', () => {
    const n = normalize('UPI/P2M/412345678905/PUNJAB STORE /Pay to/Federal Bank', list);
    expect(n.knownId).toBeUndefined();
    expect(n.display).toBe('Punjab Store');
  });
});

describe('person flag', () => {
  it.each([
    ['UPI/P2A/233368991817/NOUSHAD B/Kotak', true],
    ['UPI/412345678904/NA/9876543210@ybl/State Bank Of India', true],
    ['NEFT DR-HDFC0000001-RAMESH KUMAR-XXXXXXXX1234-NEFT123456', true],
    ['IMPS-412345678901-RAHUL SHARMA-HDFC-XXXXXXXX1234-RENT', true],
    ['UPI/P2M/412345678901/NETFLIX COM/Pay to Merchant/Federal Bank', false],
    ['UPI-NETFLIX-NETFLIX@ICICI-ICIC0000001-412345678901-AUTOPAY', false],
    ['ACH D- TATA SKY LTD-0012345', false],
  ])('%s', (desc, person) => {
    expect(normalize(desc, []).person).toBe(person);
  });
});

describe('display names', () => {
  it.each([
    ['ACH D- HDFC LTD-1234567890', 'HDFC'],
    ['ACH D- ICICI PRUDENTIAL MUTUAL FUND-123456', 'ICICI Prudential Mutual Fund'],
    ['ECS-LIC OF INDIA-POLICY 123456', 'LIC Policy'],
    ['ACH D- LIC HOUSING FINANCE LTD-0012345', 'LIC Housing Finance'],
    ['ACH D- BAJAJ FINSERV EMI-0012345', 'Bajaj Finserv EMI'],
    ['CC PAYMENT HDFC BANK CARD 4012XXXXXXXX1234', 'CC Payment HDFC Bank Card'],
    ['UPI-RAMESH KUMAR-RAMESH.K@OKAXIS-UTIB0000001-412345678908-RENT', 'Ramesh Kumar'],
  ])('%s shows as %s', (desc, display) => {
    expect(normalize(desc, []).display).toBe(display);
  });
});
