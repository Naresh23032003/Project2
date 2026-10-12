import type { Cadence, Category, Confidence } from './types';

export const TYPE_LABEL: Record<Category, string> = {
  subscription: 'Subscription',
  emi: 'Loan or EMI',
  rent: 'Rent',
  sip: 'Investment (SIP)',
  insurance: 'Insurance',
  own_transfer: 'Transfer to yourself',
  card_bill: 'Card bill',
  transfer: 'Payment to a person',
  bill: 'Utility bill',
};
export const CADENCE_LABEL: Record<Cadence, string> = { weekly: 'Weekly', monthly: 'Monthly', quarterly: 'Quarterly', yearly: 'Yearly' };
export const CONFIDENCE_LABEL: Record<Confidence, string> = { sure: 'Sure', likely: 'Likely', maybe: 'Maybe' };

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const FULL_MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

/** 2024-09-05 becomes 5 Sep 2024. */
export function formatDate(iso: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso;
  return `${Number(iso.slice(8, 10))} ${MONTHS[Number(iso.slice(5, 7)) - 1]} ${iso.slice(0, 4)}`;
}

/** 2024-04-05 becomes April, for sentences like "went from ₹119 to ₹139 in April". */
export function monthName(iso: string): string {
  return FULL_MONTHS[Number(iso.slice(5, 7)) - 1] ?? iso;
}
