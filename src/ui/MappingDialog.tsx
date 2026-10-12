import { useEffect, useMemo, useState } from 'react';
import type { Cell, ColumnMapping } from '../engine/types';
import { Modal } from './Modal';
import type { Entry } from './state';

type Props = {
  entry: Entry | null;
  onSubmit: (id: string, mapping: ColumnMapping, flip: boolean, dateOrder: 'dmy' | 'mdy') => void;
  onSkip: (id: string) => void;
};

const text = (c: Cell) => String(c ?? '').trim();
const letter = (i: number) => String.fromCharCode(65 + (i % 26));

export function MappingDialog({ entry, onSubmit, onSkip }: Props) {
  const grid = entry?.grid ?? [];
  const width = useMemo(() => grid.slice(0, 40).reduce((m, r) => Math.max(m, r.length), 0), [grid]);
  const [headerRow, setHeaderRow] = useState(0);
  const [date, setDate] = useState(0);
  const [desc, setDesc] = useState(1);
  const [layout, setLayout] = useState<'single' | 'split'>('split');
  const [amount, setAmount] = useState(2);
  const [debit, setDebit] = useState(2);
  const [credit, setCredit] = useState(3);
  const [flip, setFlip] = useState(false);
  const [dayFirst, setDayFirst] = useState(true);

  useEffect(() => {
    if (!entry) return;
    setHeaderRow(entry.headerGuess ?? 0);
    setDate(0);
    setDesc(Math.min(1, Math.max(0, width - 1)));
    setAmount(Math.min(2, Math.max(0, width - 1)));
    setDebit(Math.min(2, Math.max(0, width - 1)));
    setCredit(Math.min(3, Math.max(0, width - 1)));
  }, [entry?.id, entry?.headerGuess, width]);

  const header = grid[headerRow] ?? [];
  const name = (i: number) => `Column ${letter(i)}${text(header[i]) ? ': ' + text(header[i]) : ''}`;
  const columns = Array.from({ length: width }, (_, i) => i);
  const preview = grid.slice(headerRow, headerRow + 8);

  const select = (id: string, label: string, value: number, set: (n: number) => void) => (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <select id={id} className="input" value={value} onChange={(e) => set(Number(e.target.value))}>
        {columns.map((i) => (
          <option key={i} value={i}>
            {name(i)}
          </option>
        ))}
      </select>
    </div>
  );

  return (
    <Modal open={entry !== null} onClose={() => entry && onSkip(entry.id)} labelledBy="map-title" className="modal map-modal" dismissOnBackdrop={false}>
      {entry && (
        <form
          className="modal-body"
          onSubmit={(e) => {
            e.preventDefault();
            const mapping: ColumnMapping =
              layout === 'single' ? { headerRow, date, desc, amount } : { headerRow, date, desc, debit, credit };
            onSubmit(entry.id, mapping, flip, dayFirst ? 'dmy' : 'mdy');
          }}
        >
          <h2 id="map-title">Which column is which?</h2>
          <p>We couldn't recognise this file's layout. Pick the columns and we'll read it. Nothing is sent anywhere.</p>
          <p className="hint">{entry.file.name}</p>

          <div role="region" aria-label="Preview of the file, scrolls sideways" tabIndex={0} style={{ overflowX: 'auto', border: '1px solid var(--line)', borderRadius: 8 }}>
            <table style={{ fontSize: '0.8125rem', width: '100%' }} aria-label="First rows of the file">
              <thead>
                <tr>
                  {columns.map((i) => (
                    <th key={i} scope="col" style={{ textAlign: 'left', padding: '6px 8px', background: 'var(--surface-2)', whiteSpace: 'nowrap' }}>
                      {letter(i)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.map((r, ri) => (
                  <tr key={ri}>
                    {columns.map((i) => (
                      <td key={i} style={{ padding: '4px 8px', borderTop: '1px solid var(--line)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {text(r[i])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="field">
            <label htmlFor="map-header">Row with the column names</label>
            <input id="map-header" className="input" type="number" min={1} max={Math.max(1, grid.length)} value={headerRow + 1} onChange={(e) => setHeaderRow(Math.max(0, Number(e.target.value) - 1))} />
          </div>
          {select('map-date', 'Date', date, setDate)}
          {select('map-desc', 'Description', desc, setDesc)}

          <fieldset className="field" style={{ border: 0, padding: 0, margin: 0 }}>
            <legend className="label">How are amounts shown?</legend>
            <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input type="radio" name="layout" checked={layout === 'split'} onChange={() => setLayout('split')} /> Separate debit and credit columns
            </label>
            <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input type="radio" name="layout" checked={layout === 'single'} onChange={() => setLayout('single')} /> One amount column (money out is negative, or positive on card statements)
            </label>
          </fieldset>
          {layout === 'split' ? (
            <>
              {select('map-debit', 'Money out (debit or withdrawal)', debit, setDebit)}
              {select('map-credit', 'Money in (credit or deposit)', credit, setCredit)}
            </>
          ) : (
            <>
              {select('map-amount', 'Amount', amount, setAmount)}
              <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input type="checkbox" checked={flip} onChange={(e) => setFlip(e.target.checked)} /> Flip it: treat the opposite sign as money out
              </label>
            </>
          )}
          <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input type="checkbox" checked={dayFirst} onChange={(e) => setDayFirst(e.target.checked)} /> Dates are day first (31/01/2024 is 31 January)
          </label>

          <div className="row-end">
            <button type="button" className="btn btn-quiet" onClick={() => onSkip(entry.id)}>
              Skip this file
            </button>
            <button type="submit" className="btn btn-primary" data-testid="mapping-submit">
              Read the file
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}
