import { AlertTriangle, FileText, X } from 'lucide-react';
import type { Bank } from '../engine/types';
import type { Entry } from './state';

const BANK: Record<Bank, string> = { hdfc: 'HDFC', sbi: 'SBI', icici: 'ICICI', axis: 'Axis', kotak: 'Kotak' };

export function stateText(e: Entry): string {
  switch (e.state) {
    case 'queued':
    case 'reading':
      return 'Reading on your device';
    case 'ok': {
      const n = e.txns?.length ?? 0;
      return `${e.bank ? BANK[e.bank] + ' layout, ' : ''}${n.toLocaleString('en-IN')} transactions`;
    }
    case 'needsPassword':
      return 'Needs a password';
    case 'wrongPassword':
      return 'That password did not work';
    case 'needsMapping':
      return 'Needs a look at the columns';
    case 'scanned':
      return 'Scanned PDF, no text to read';
    case 'unsupported':
    case 'error':
      return e.message ?? 'Could not read this file';
  }
}

type Props = {
  entries: Entry[];
  onRemove: (id: string) => void;
  onFix: (id: string) => void;
};

export function FileStatus({ entries, onRemove, onFix }: Props) {
  if (entries.length === 0) return null;
  const scanned = entries.some((e) => e.state === 'scanned');
  return (
    <div>
      <ul className="file-list" aria-label="Files">
        {entries.map((e) => (
          <li key={e.id} data-state={e.state}>
            {e.state === 'ok' ? <FileText aria-hidden="true" size={18} /> : <AlertTriangle aria-hidden="true" size={18} />}
            <span className="name">{e.file.name}</span>
            <span className="state">{stateText(e)}</span>
            {(e.state === 'needsPassword' || e.state === 'wrongPassword') && (
              <button type="button" className="btn btn-quiet btn-small" onClick={() => onFix(e.id)}>
                Enter password
              </button>
            )}
            {e.state === 'needsMapping' && (
              <button type="button" className="btn btn-quiet btn-small" onClick={() => onFix(e.id)}>
                Choose columns
              </button>
            )}
            <button type="button" className="icon-btn" style={{ width: 32, height: 32 }} onClick={() => onRemove(e.id)} aria-label={`Remove ${e.file.name}`}>
              <X aria-hidden="true" size={16} />
            </button>
          </li>
        ))}
      </ul>
      {scanned && (
        <p className="notice error" style={{ marginTop: 12 }} role="alert">
          <AlertTriangle aria-hidden="true" />
          <span>
            A scanned PDF is a picture of a statement, so there's no text to read. Download the CSV or Excel version from your bank
            instead. <a href="#/guides#download">Here's how, bank by bank.</a>
          </span>
        </p>
      )}
    </div>
  );
}
