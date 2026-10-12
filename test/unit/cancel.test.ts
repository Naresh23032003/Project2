import { describe, expect, it } from 'vitest';
import { guideFor, guides } from '../../src/engine/cancel';
import merchants from '../../src/data/merchants.json';
import type { Merchant } from '../../src/engine/types';

describe('cancel guides data', () => {
  it('covers 30 services with unique ids', () => {
    expect(guides.services).toHaveLength(30);
    expect(new Set(guides.services.map((s) => s.id)).size).toBe(30);
  });

  it.each(guides.services.map((s) => [s.id, s] as const))('%s has steps and an honest verification level', (_id, s) => {
    expect(s.steps.length).toBeGreaterThan(0);
    expect(s.verification).toMatch(/^(official|partial|unverified)$/);
    if (s.verification === 'unverified') {
      expect(s.source).toBeNull();
      expect(s.lastVerified).toBeNull();
    } else {
      expect(s.source).toMatch(/^https:\/\/[^\s]+$/);
      expect(s.lastVerified).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
    if (s.directUrl) expect(s.directUrl).toMatch(/^https:\/\//);
  });

  it('says what an unverified entry cannot confirm', () => {
    for (const s of guides.services.filter((x) => x.verification === 'unverified')) {
      expect(s.notes.join(' ')).toMatch(/couldn't/i);
    }
  });

  it('covers every known subscription and app store merchant', () => {
    const missing = (merchants as Merchant[])
      .filter((m) => m.kind === 'subscription' || m.kind === 'appstore' || (m.kind === 'telecom' && m.id !== 'bsnl'))
      .filter((m) => !guideFor(m.id))
      .map((m) => m.id);
    expect(missing).toEqual([]);
  });

  it('finds a guide by merchant id, including merged services', () => {
    expect(guideFor('netflix')?.name).toBe('Netflix');
    expect(guideFor('jiocinema')?.id).toBe('hotstar');
    expect(guideFor('unknown-merchant')).toBeUndefined();
  });

  it('has the general guides with sources and dates', () => {
    const g = guides.general;
    expect(g.upiAutopay.apps.map((a) => a.name)).toEqual(expect.arrayContaining(['Google Pay', 'PhonePe', 'Paytm']));
    expect(g.upiAutopay.sources.every((u) => u.startsWith('https://'))).toBe(true);
    expect(g.cardStandingInstruction.steps.length).toBeGreaterThan(0);
    expect(g.downloadStatement.banks.map((b) => b.id)).toEqual(['hdfc', 'sbi', 'icici', 'axis', 'kotak']);
    expect(g.upiAutopay.lastVerified).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
