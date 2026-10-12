import type { Decision } from './analyze';

type Store = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;
export type Choices = Record<string, Decision>;

const OPT_IN = 'dripcheck:optin';
const CHOICES = 'dripcheck:choices';
const VALID = new Set<string>(['keep', 'cancel', 'not']);

// Storage can be missing or throw in private windows and with blocked site data.
export function createChoiceStore(storage: Store | null) {
  const attempt = <T>(fn: (s: Store) => T, fallback: T): T => {
    if (!storage) return fallback;
    try {
      return fn(storage);
    } catch {
      return fallback;
    }
  };

  const isEnabled = () => attempt((s) => s.getItem(OPT_IN) === '1', false);

  const write = (choices: Choices) => attempt((s) => s.setItem(CHOICES, JSON.stringify(choices)), undefined);

  return {
    isEnabled,
    enable(choices: Choices) {
      attempt((s) => s.setItem(OPT_IN, '1'), undefined);
      write(choices);
    },
    disable() {
      attempt((s) => {
        s.removeItem(OPT_IN);
        s.removeItem(CHOICES);
      }, undefined);
    },
    load(): Choices {
      if (!isEnabled()) return {};
      const raw = attempt((s) => s.getItem(CHOICES), null);
      if (!raw) return {};
      try {
        const parsed: unknown = JSON.parse(raw);
        if (typeof parsed !== 'object' || parsed === null) return {};
        const out: Choices = {};
        for (const [k, v] of Object.entries(parsed)) {
          if (k !== '__proto__' && typeof v === 'string' && VALID.has(v)) out[k] = v as Decision;
        }
        return out;
      } catch {
        return {};
      }
    },
    save(choices: Choices) {
      if (isEnabled()) write(choices);
    },
    forget() {
      this.disable();
    },
  };
}
