import { ChevronRight } from 'lucide-react';
import { formatRupees } from '../engine/format';
import { CADENCE_LABEL, TYPE_LABEL, formatDate } from '../engine/labels';
import type { Recurring } from '../engine/types';

type Props = { items: Recurring[]; onMove: (id: string) => void };

export function OtherRecurring({ items, onMove }: Props) {
  if (items.length === 0) return null;
  return (
    <details className="other" data-testid="other-recurring">
      <summary>
        <ChevronRight aria-hidden="true" />
        Other recurring payments ({items.length})
      </summary>
      <div className="other-body">
        <p className="hint">
          Loans, rent, investments, insurance, bills and regular payments to people. They repeat, but they aren't subscriptions, so
          they're left out of your total. If one of them is a subscription, move it up.
        </p>
        <ul className="other-list">
          {items.map((r) => (
            <li key={r.id}>
              <div>
                <strong>{r.display}</strong>
                <div className="meta">
                  {TYPE_LABEL[r.category]}, {CADENCE_LABEL[r.cadence].toLowerCase()}, last charged {formatDate(r.lastDate)}
                </div>
              </div>
              <div className="amt num">
                {formatRupees(r.typicalAmount)}
                <div className="meta">{formatRupees(r.yearlyCost)} a year</div>
              </div>
              <button type="button" className="btn btn-quiet btn-small" style={{ gridColumn: '1 / -1', justifySelf: 'start' }} onClick={() => onMove(r.id)}>
                This is a subscription
              </button>
            </li>
          ))}
        </ul>
      </div>
    </details>
  );
}
