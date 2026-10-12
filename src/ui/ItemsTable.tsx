import { ArrowDown, ArrowUp } from 'lucide-react';
import type { Decision } from '../engine/summary';
import { formatRupees } from '../engine/format';
import { CADENCE_LABEL, formatDate } from '../engine/labels';
import type { Recurring } from '../engine/types';
import { Confidence, Monogram, Tags } from './Badges';
import { Choice } from './Choice';
import type { SortDir, SortKey } from './itemsView';
import { Stamp } from './Stamp';

type Props = {
  items: Recurring[];
  decisions: Record<string, Decision>;
  freshStamp: string | null;
  sortKey: SortKey;
  sortDir: SortDir;
  onSort: (k: SortKey) => void;
  onDecide: (id: string, d: Decision | null) => void;
  onOpen: (r: Recurring) => void;
};

export function ItemsTable({ items, decisions, freshStamp, sortKey, sortDir, onSort, onDecide, onOpen }: Props) {
  const th = (key: SortKey, label: string, right = false) => (
    <th scope="col" className={right ? 'right' : undefined} aria-sort={sortKey === key ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'}>
      <button type="button" onClick={() => onSort(key)}>
        {label}
        {sortKey === key && (sortDir === 'asc' ? <ArrowUp size={14} aria-hidden="true" /> : <ArrowDown size={14} aria-hidden="true" />)}
      </button>
    </th>
  );
  return (
    <div className="table-wrap" role="region" aria-label="Recurring charges, scrolls sideways on small screens" tabIndex={0}>
      <table className="items" data-testid="items-table">
        <thead>
          <tr>
            {th('name', 'Service')}
            <th scope="col" className="right">Charge</th>
            {th('cost', 'Per year', true)}
            {th('next', 'Last and next')}
            {th('confidence', 'Confidence')}
            <th scope="col">Your call</th>
            <th scope="col"><span className="sr-only">Stamp</span></th>
          </tr>
        </thead>
        <tbody>
          {items.map((r) => {
            const d = decisions[r.id];
            return (
              <tr key={r.id} data-testid="item-row" data-choice={d ?? ''} data-status={r.status}>
                <td>
                  <div className="who">
                    <Monogram name={r.display} />
                    <div className="who-text">
                      <button type="button" className="who-name" onClick={() => onOpen(r)}>{r.display}</button>
                      <div className="who-reason" title={r.reasons[0]}>{r.reasons[0]}</div>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 2 }}><Tags item={r} /></div>
                    </div>
                  </div>
                </td>
                <td className="right num">
                  {formatRupees(r.typicalAmount)}
                  <div className="sub-line">{CADENCE_LABEL[r.cadence]}</div>
                </td>
                <td className="right num" style={{ fontWeight: 650 }}>{formatRupees(r.yearlyCost)}</td>
                <td className="num nowrap">
                  {r.status === 'stopped' ? 'Stopped' : formatDate(r.nextExpected)}
                  <div className="sub-line">Last {formatDate(r.lastDate)}</div>
                </td>
                <td><Confidence value={r.confidence} /></td>
                <td><Choice id={r.id} name={r.display} value={d} onChange={(next) => onDecide(r.id, next)} /></td>
                <td className="stamp-cell" >
                  {d === 'cancel' && (
                    <Stamp
                      date={r.status === 'stopped' ? r.lastDate : r.nextExpected}
                      fresh={freshStamp === r.id}
                      className="row-stamp"
                    />
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
