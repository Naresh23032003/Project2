import type { Category, Merchant, Normalized, Txn } from './types';

const RULES: [Category, RegExp][] = [
  ['card_bill', /CREDIT CARD|\bCC PAYMENT|\bCC\b|CARD PAYMENT|CARD BILL|\bCRED\b|BILLDESK.*CARD/],
  ['sip', /\bSIP\b|MUTUAL FUND|\bMF\b|\bICCL\b|INDIAN CLEARING|BSE STAR|\bGROWW\b|ZERODHA|\bNPS\b|\bPPF\b|RECURRING DEPOSIT|\bRD INST/],
  ['emi', /\bEMI\b|\bLOAN\b|BAJAJ FIN|HDFC LTD|FINSERV|FINCORP|CAPITAL FIRST|TATA CAPITAL|HOUSING FINANCE|LIC HOUSING|MUTHOOT|MANAPPURAM|KREDITBEE|MONEYVIEW|FULLERTON|PIRAMAL/],
  ['insurance', /\bLIC\b|INSURANCE|\bPOLICY\b|HDFC LIFE|SBI LIFE|ICICI PRU(DENTIAL)? LIFE|STAR HEALTH|NIVA BUPA|CARE HEALTH|MAX LIFE|TATA AIA|BAJAJ ALLIANZ|\bACKO\b/],
  ['rent', /\bRENT\b/],
  ['own_transfer', /\bSELF\b|OWN ACC|\bSWEEP\b/],
  ['bill', /ELECTRICITY|POWER (LTD|CO)|\bBESCOM\b|\bMSEDCL\b|\bBSES\b|TORRENT POWER|TATA POWER|WATER BOARD|MAHANAGAR GAS|INDRAPRASTHA GAS|PIPED GAS|PROPERTY TAX|MUNICIPAL/],
];

export function classify(hits: Txn[], norms: Normalized[], merchant?: Merchant): Category {
  if (merchant && (merchant.kind === 'subscription' || merchant.kind === 'appstore' || merchant.kind === 'telecom')) {
    return 'subscription';
  }
  const text = hits.map((h) => h.desc).join(' ').toUpperCase();
  for (const [category, re] of RULES) if (re.test(text)) return category;
  if (norms.length > 0 && norms.every((n) => n.person)) return 'transfer';
  return 'subscription';
}
