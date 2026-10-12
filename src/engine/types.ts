export type Rail = 'upi' | 'card' | 'nach' | 'si' | 'neft' | 'imps' | 'other';
export type Cadence = 'weekly' | 'monthly' | 'quarterly' | 'yearly';
export type Confidence = 'sure' | 'likely' | 'maybe';
export type MerchantKind = 'subscription' | 'appstore' | 'telecom' | 'variable' | 'finance';

export type Merchant = {
  id: string;
  name: string;
  kind: MerchantKind;
  patterns: string[];
  cadence?: Cadence;
};

export type Normalized = {
  key: string;
  display: string;
  rail: Rail;
  mandate: boolean;
  knownId?: string;
};
