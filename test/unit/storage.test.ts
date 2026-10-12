import { describe, expect, it } from 'vitest';
import { createChoiceStore } from '../../src/engine/storage';

function fakeStorage() {
  const data = new Map<string, string>();
  return {
    data,
    getItem: (k: string) => data.get(k) ?? null,
    setItem: (k: string, v: string) => void data.set(k, v),
    removeItem: (k: string) => void data.delete(k),
  };
}
const throwing = {
  getItem: () => { throw new Error('blocked'); },
  setItem: () => { throw new Error('blocked'); },
  removeItem: () => { throw new Error('blocked'); },
};

describe('choice store', () => {
  it('stores nothing until the person opts in', () => {
    const fs = fakeStorage();
    const store = createChoiceStore(fs);
    store.save({ 'netflix#0': 'cancel' });
    expect(fs.data.size).toBe(0);
    expect(store.isEnabled()).toBe(false);
    expect(store.load()).toEqual({});
  });

  it('saves and loads choices after opting in', () => {
    const fs = fakeStorage();
    const store = createChoiceStore(fs);
    store.enable({ 'netflix#0': 'cancel' });
    expect(store.isEnabled()).toBe(true);
    store.save({ 'netflix#0': 'cancel', 'spotify#0': 'keep' });
    expect(createChoiceStore(fs).load()).toEqual({ 'netflix#0': 'cancel', 'spotify#0': 'keep' });
  });

  it('forgets everything in one call', () => {
    const fs = fakeStorage();
    const store = createChoiceStore(fs);
    store.enable({ a: 'keep' });
    store.forget();
    expect(fs.data.size).toBe(0);
    expect(store.isEnabled()).toBe(false);
  });

  it('turning it off also deletes what was stored', () => {
    const fs = fakeStorage();
    const store = createChoiceStore(fs);
    store.enable({ a: 'keep' });
    store.disable();
    expect(fs.data.size).toBe(0);
  });

  it('ignores corrupt or hostile stored data', () => {
    const fs = fakeStorage();
    fs.setItem('dripcheck:optin', '1');
    fs.setItem('dripcheck:choices', '{"a":"cancel","b":"explode","__proto__":"keep","c":5}');
    expect(createChoiceStore(fs).load()).toEqual({ a: 'cancel' });
    fs.setItem('dripcheck:choices', 'not json');
    expect(createChoiceStore(fs).load()).toEqual({});
  });

  it('keeps working when storage is missing or throws', () => {
    for (const s of [null, throwing]) {
      const store = createChoiceStore(s);
      expect(() => store.enable({ a: 'keep' })).not.toThrow();
      expect(() => store.save({ a: 'keep' })).not.toThrow();
      expect(() => store.forget()).not.toThrow();
      expect(store.load()).toEqual({});
      expect(store.isEnabled()).toBe(false);
    }
  });
});
