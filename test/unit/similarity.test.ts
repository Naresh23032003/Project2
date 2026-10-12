import { describe, expect, it } from 'vitest';
import { jaroWinkler } from '../../src/engine/similarity';

describe('jaroWinkler', () => {
  it('scores identical strings 1', () => expect(jaroWinkler('netflix', 'netflix')).toBe(1));
  it('scores empty against anything 0', () => expect(jaroWinkler('', 'netflix')).toBe(0));
  it('scores a typo above the merge threshold', () => expect(jaroWinkler('acme streaming', 'acme streamng')).toBeGreaterThanOrEqual(0.93));
  it('scores different merchants below the threshold', () => expect(jaroWinkler('netflix', 'spotify')).toBeLessThan(0.7));
  it('matches the textbook value for martha and marhta', () => expect(jaroWinkler('martha', 'marhta')).toBeCloseTo(0.9611, 3));
});
