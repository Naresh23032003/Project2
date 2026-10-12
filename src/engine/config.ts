import type { Cadence } from './types';

export const CONFIG = {
  reversalWindowDays: 7,

  // Charges within this band of a cluster's latest amount join that cluster.
  amountToleranceMin: 1000,
  amountTolerancePct: 0.12,
  // Consecutive amounts closer than this count as the same price.
  samePriceMin: 200,
  samePricePct: 0.03,
  // Sequential clusters only merge as a price change if their medians are this close.
  priceChangeMaxRatio: 2,
  minStableFraction: 0.5,
  sureStableFraction: 0.7,

  fuzzyMerge: 0.93,
  fuzzyPrefixMin: 5,

  driftDays: { weekly: 1, monthly: 4, quarterly: 4, yearly: 7 } as Record<Cadence, number>,
  minHits: { weekly: 4, monthly: 3, quarterly: 3, yearly: 2 } as Record<Cadence, number>,
  minHitsWithSignal: { weekly: 3, monthly: 2, quarterly: 2, yearly: 2 } as Record<Cadence, number>,
  minCoverage: 0.75,
  // Try the whole merchant as one series first. It must explain this share of the charges.
  wholeSeriesCoverage: 0.8,
  // Frequent-spend merchants (fuel, food, rides) need more repeats when there is no mandate.
  variableExtraHits: 2,
  // At a merchant with this many charges, a series without a mandate must explain this share of them.
  busyMerchantCharges: 15,
  busyMerchantMinShare: 0.3,

  periodsPerYear: { weekly: 52, monthly: 12, quarterly: 4, yearly: 1 } as Record<Cadence, number>,
  periodDays: { weekly: 7, monthly: 30, quarterly: 91, yearly: 365 } as Record<Cadence, number>,
  graceMinDays: 5,
  gracePct: 0.2,

  score: { sure: 80, likely: 55, maybe: 35, singleHit: 40 },
  forgottenMonthlyMax: 25000,
};
