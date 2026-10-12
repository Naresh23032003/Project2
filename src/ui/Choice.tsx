import type { Decision } from '../engine/analyze';

type Props = { id: string; name: string; value: Decision | undefined; onChange: (d: Decision | null) => void };

const OPTIONS: { value: Decision; label: string }[] = [
  { value: 'keep', label: 'Keep' },
  { value: 'cancel', label: 'Cancel' },
  { value: 'not', label: 'Not a subscription' },
];

// Clicking the chosen option again clears it, so a mark is never a trap.
export function Choice({ id, name, value, onChange }: Props) {
  return (
    <div className="choice" role="radiogroup" aria-label={`Your call on ${name}`}>
      {OPTIONS.map((o) => (
        <label key={o.value}>
          <input
            type="radio"
            name={`choice-${id}`}
            checked={value === o.value}
            onChange={() => undefined}
            onClick={() => onChange(value === o.value ? null : o.value)}
          />
          <span className={o.value === 'not' ? 'not' : o.value}>{o.label}</span>
        </label>
      ))}
    </div>
  );
}
