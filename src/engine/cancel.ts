import data from '../data/cancel-guides.json';

export type Verification = 'official' | 'partial' | 'unverified';

export type CancelGuide = {
  id: string;
  name: string;
  merchantIds: string[];
  verification: Verification;
  lastVerified: string | null;
  source: string | null;
  directUrl?: string;
  steps: string[];
  notes: string[];
};

export type GeneralGuides = typeof data.general;
export type CancelGuides = { version: number; checked: string; verificationLevels: Record<Verification, string>; services: CancelGuide[]; general: GeneralGuides };

export const guides = data as unknown as CancelGuides;

export function guideFor(merchantId: string | undefined): CancelGuide | undefined {
  if (!merchantId) return undefined;
  return guides.services.find((s) => s.merchantIds.includes(merchantId));
}
