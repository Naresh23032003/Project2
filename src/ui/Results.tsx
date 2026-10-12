import { Copy, Download, FilePlus2, Image, Info, RotateCcw, TriangleAlert } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';
import { summarize, type Analysis, type Decision } from '../engine/analyze';
import { exportCsv, summaryText } from '../engine/export';
import { formatRupees } from '../engine/format';
import { formatDate } from '../engine/labels';
import type { Recurring } from '../engine/types';
import { FileStatus } from './FileStatus';
import { useCountUp, useMediaQuery, useToast } from './hooks';
import { ItemCards } from './ItemCards';
import { ItemDrawer } from './ItemDrawer';
import { ItemsTable } from './ItemsTable';
import { countFilters, filterItems, priceAlerts, sortItems, type Filter, type SortDir, type SortKey } from './itemsView';
import { OtherRecurring } from './OtherRecurring';
import { ShareDialog } from './ShareDialog';
import type { Entry } from './state';

type Props = {
  analysis: Analysis;
  entries: Entry[];
  decisions: Record<string, Decision>;
  moved: Record<string, true>;
  remember: boolean;
  sample: boolean;
  onDecide: (id: string, d: Decision | null) => void;
  onMove: (id: string, on: boolean) => void;
  onFiles: (files: File[]) => void;
  onRemoveEntry: (id: string) => void;
  onFixEntry: (id: string) => void;
  onReset: () => void;
  onRemember: (on: boolean) => void;
};

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'sure', label: 'Sure' },
  { id: 'likely', label: 'Likely' },
  { id: 'maybe', label: 'Maybe' },
  { id: 'forgotten', label: 'Easy to forget' },
  { id: 'price', label: 'Price changed' },
  { id: 'stopped', label: 'Stopped' },
];

function download(name: string, mime: string, body: string) {
  const url = URL.createObjectURL(new Blob([body], { type: mime }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function Results(p: Props) {
  const wide = useMediaQuery('(min-width: 900px)');
  const [filter, setFilter] = useState<Filter>('all');
  const [sortKey, setSortKey] = useState<SortKey>('cost');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [open, setOpen] = useState<Recurring | null>(null);
  const [share, setShare] = useState(false);
  const [fresh, setFresh] = useState<string | null>(null);
  const addInput = useRef<HTMLInputElement>(null);
  const toast = useToast();

  const all = useMemo(() => p.analysis.recurring.map((r) => (p.moved[r.id] ? { ...r, category: 'subscription' as const } : r)), [p.analysis, p.moved]);
  const subs = useMemo(() => all.filter((r) => r.category === 'subscription'), [all]);
  const others = useMemo(() => all.filter((r) => r.category !== 'subscription'), [all]);
  const summary = useMemo(() => summarize(all, p.decisions), [all, p.decisions]);
  const counts = useMemo(() => countFilters(subs), [subs]);
  const alerts = useMemo(() => priceAlerts(subs), [subs]);
  const visible = useMemo(() => sortItems(filterItems(subs, filter), sortKey, sortDir), [subs, filter, sortKey, sortDir]);
  const shownSavings = useCountUp(summary.potentialSavings);
  const markedCancel = subs.filter((r) => p.decisions[r.id] === 'cancel' && r.status === 'active').length;
  const failed = p.entries.filter((e) => e.state !== 'ok');

  const decide = (id: string, d: Decision | null) => {
    p.onDecide(id, d);
    if (d === 'cancel') {
      setFresh(id);
      window.setTimeout(() => setFresh((cur) => (cur === id ? null : cur)), 700);
    }
  };

  const sort = (k: SortKey) => {
    if (k === sortKey) setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    else {
      setSortKey(k);
      setSortDir(k === 'name' ? 'asc' : 'desc');
    }
  };

  const names = subs
    .filter((r) => r.status === 'active' && r.confidence !== 'maybe' && p.decisions[r.id] !== 'not')
    .sort((a, b) => b.yearlyCost - a.yearlyCost);
  const shareData = {
    headline: summary.potentialSavings > 0 ? `I found ${formatRupees(summary.potentialSavings)} a year I can stop paying.` : `I found ${formatRupees(summary.yearlyTotal)} a year in recurring charges.`,
    sub: `${summary.count} recurring ${summary.count === 1 ? 'thing' : 'things'} found in ${p.analysis.months + 1} months of statements.`,
  };
  const shareNames = names.length > 3 ? `${names.slice(0, 3).map((r) => r.display).join(', ')} and ${names.length - 3} more` : names.map((r) => r.display).join(', ');

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(summaryText(all, p.decisions, { includeNames: true }));
      toast.show('Summary copied');
    } catch {
      toast.show('Could not copy. Select the text yourself instead.');
    }
  };

  const sentence =
    summary.count > 0 ? (
      <>
        You're paying <span className="figure">{formatRupees(summary.yearlyTotal)}</span> a year for <span className="figure">{summary.count}</span> recurring{' '}
        {summary.count === 1 ? 'thing' : 'things'}.
      </>
    ) : (
      <>We didn't find a clear subscription.</>
    );

  return (
    <main className="page results" id="main">
      {p.sample && (
        <p className="notice" style={{ marginBottom: 20 }}>
          <Info aria-hidden="true" />
          <span>This is made-up sample data, so you can see how it works. Drop in your own statement to see your numbers.</span>
        </p>
      )}

      <div className="results-head">
        <div>
          <h1 className="sentence" data-testid="headline">{sentence}</h1>
          <p className="sub">
            From {p.analysis.months + 1} months of statements, {formatDate(p.analysis.start)} to {formatDate(p.analysis.end)}.
            {summary.maybeCount > 0 && ` ${summary.maybeCount} more ${summary.maybeCount === 1 ? 'might be one' : 'might be subscriptions'} (marked Maybe).`}
            {summary.stoppedCount > 0 && ` ${summary.stoppedCount} stopped and ${summary.stoppedCount === 1 ? "isn't" : "aren't"} counted.`}
          </p>
          {p.analysis.months < 2 && (
            <p className="notice" style={{ marginTop: 12 }}>
              <TriangleAlert aria-hidden="true" />
              <span>Only {p.analysis.months + 1} {p.analysis.months === 0 ? 'month' : 'months'} of data. Use at least 3, and 6 to 12 to catch yearly charges.</span>
            </p>
          )}
        </div>
        <div className="savings" data-zero={summary.potentialSavings === 0} data-testid="savings">
          <p className="savings-label">If you cancel what you've marked</p>
          <p className="savings-value num" aria-hidden="true">{formatRupees(shownSavings)} a year</p>
          <p className="sr-only" role="status" data-testid="savings-status">
            You'd save {formatRupees(summary.potentialSavings)} a year
          </p>
          <p className="savings-note">
            {markedCancel > 0 ? `${markedCancel} marked Cancel.` : 'Mark items Cancel and this number grows.'}
          </p>
        </div>
      </div>

      {failed.length > 0 && (
        <div style={{ marginTop: 20 }}>
          <p className="notice error"><TriangleAlert aria-hidden="true" /><span>{failed.length} of {p.entries.length} files could not be read, so the numbers leave them out.</span></p>
          <FileStatus entries={failed} onRemove={p.onRemoveEntry} onFix={p.onFixEntry} />
        </div>
      )}

      {alerts.length > 0 && (
        <ul className="alerts" aria-label="Price changes" data-testid="price-alerts">
          {alerts.map((a) => (
            <li key={a.id + a.text}>
              <TriangleAlert aria-hidden="true" />
              {a.text}
            </li>
          ))}
        </ul>
      )}

      {subs.length > 0 ? (
        <>
          <div className="toolbar" role="group" aria-label="Filter the list">
            {FILTERS.filter((f) => f.id === 'all' || counts[f.id] > 0).map((f) => (
              <button key={f.id} type="button" className="chip" aria-pressed={filter === f.id} onClick={() => setFilter(f.id)}>
                {f.label} <span className="count">{counts[f.id]}</span>
              </button>
            ))}
          </div>
          {visible.length === 0 ? (
            <p className="notice" style={{ marginTop: 12 }}>
              <span>Nothing matches that filter.</span>
              <button type="button" className="btn btn-quiet btn-small" onClick={() => setFilter('all')}>Show all</button>
            </p>
          ) : wide ? (
            <ItemsTable items={visible} decisions={p.decisions} freshStamp={fresh} sortKey={sortKey} sortDir={sortDir} onSort={sort} onDecide={decide} onOpen={setOpen} />
          ) : (
            <ItemCards items={visible} decisions={p.decisions} freshStamp={fresh} onDecide={decide} onOpen={setOpen} />
          )}
        </>
      ) : (
        <p className="sub" style={{ marginTop: 24 }}>
          We checked {p.analysis.txns.length.toLocaleString('en-IN')} transactions and none repeat on a clear schedule. That often means the statement covers too few months.
          Try adding more.
        </p>
      )}

      <OtherRecurring items={others} onMove={(id) => p.onMove(id, true)} />

      <div className="actions">
        <button type="button" className="btn btn-primary" onClick={() => download('dripcheck-recurring.csv', 'text/csv;charset=utf-8', exportCsv(all, p.decisions))} data-testid="export-csv">
          <Download aria-hidden="true" /> Download CSV
        </button>
        <button type="button" className="btn btn-secondary" onClick={copy}><Copy aria-hidden="true" /> Copy summary</button>
        <button type="button" className="btn btn-secondary" onClick={() => setShare(true)} data-testid="share-open"><Image aria-hidden="true" /> Share card</button>
        <button type="button" className="btn btn-quiet" onClick={() => addInput.current?.click()}><FilePlus2 aria-hidden="true" /> Add more statements</button>
        <button type="button" className="btn btn-quiet" onClick={p.onReset} data-testid="start-over"><RotateCcw aria-hidden="true" /> Start over</button>
        <input ref={addInput} className="sr-only" type="file" multiple accept=".csv,.xls,.xlsx,.pdf,.txt,.tsv" aria-label="Add more statement files" tabIndex={-1} onChange={(e) => { if (e.target.files?.length) p.onFiles(Array.from(e.target.files)); e.target.value = ''; }} />
      </div>

      <label className="remember">
        <input type="checkbox" checked={p.remember} onChange={(e) => p.onRemember(e.target.checked)} data-testid="remember" />
        Remember my Keep and Cancel choices on this device
      </label>
      {p.remember && (
        <p className="hint" style={{ marginTop: 6 }}>
          Only your choices are saved, in this browser. Never the statement.{' '}
          <button type="button" className="btn btn-quiet btn-small" onClick={() => p.onRemember(false)} data-testid="forget">Forget everything</button>
        </p>
      )}

      {summary.potentialSavings > 0 && (
        <div className="savings-bar" aria-hidden="true">
          <span>You'd save</span> <strong className="num">{formatRupees(shownSavings)} a year</strong>
        </div>
      )}

      <ItemDrawer item={open} decision={open ? p.decisions[open.id] : undefined} onDecide={(d) => open && decide(open.id, d)} onClose={() => setOpen(null)} />
      <ShareDialog open={share} onClose={() => setShare(false)} data={shareData} names={shareNames} hasNames={names.length > 0} />
      {toast.message && <div className="toast" role="status">{toast.message}</div>}
    </main>
  );
}
