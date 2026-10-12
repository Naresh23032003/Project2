import type { Decision } from '../engine/summary';
import { formatRupees } from '../engine/format';
import { CADENCE_LABEL, formatDate } from '../engine/labels';
import type { Recurring } from '../engine/types';
import { Confidence, Monogram, Tags } from './Badges';
import { Choice } from './Choice';
import { Stamp } from './Stamp';

type Props = {
  items: Recurring[];
  decisions: Record<string, Decision>;
  freshStamp: string | null;
  onDecide: (id: string, d: Decision | null) => void;
  onOpen: (r: Recurring) => void;
};

export function ItemCards({ items, decisions, freshStamp, onDecide, onOpen }: Props) {
  return (
    <ul className="cards" data-testid="items-cards">
      {items.map((r) => {
        const d = decisions[r.id];
        return (
          <li key={r.id} className="card" data-testid="item-row" data-choice={d ?? ''} data-status={r.status}>
            {d === 'cancel' && <Stamp date={r.status === 'stopped' ? r.lastDate : r.nextExpected} fresh={freshStamp === r.id} className="card-stamp" />}
            <div className="card-top">
              <Monogram name={r.display} />
              <div style={{ minWidth: 0, flex: 1 }}>
                <button type="button" className="who-name" onClick={() => onOpen(r)}>{r.display}</button>
                <div className="hint">{CADENCE_LABEL[r.cadence]}, {formatRupees(r.typicalAmount)}</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
              <Confidence value={r.confidence} />
              <Tags item={r} />
            </div>
            <p className="who-reason" style={{ maxWidth: 'none', display: 'block' }}>{r.reasons[0]}</p>
            <dl className="card-amounts">
              <div><dt>Per year</dt><dd className="num">{formatRupees(r.yearlyCost)}</dd></div>
              <div><dt>{r.status === 'stopped' ? 'Last charged' : 'Next expected'}</dt><dd className="num">{formatDate(r.status === 'stopped' ? r.lastDate : r.nextExpected)}</dd></div>
            </dl>
            <Choice id={r.id} name={r.display} value={d} onChange={(next) => onDecide(r.id, next)} />
          </li>
        );
      })}
    </ul>
  );
}
