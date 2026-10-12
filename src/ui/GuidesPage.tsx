import { ExternalLink } from 'lucide-react';
import { guides, type CancelGuide } from '../engine/cancel';
import { formatDate } from '../engine/labels';

const LABEL = { official: 'Checked', partial: 'Partly checked', unverified: 'Not verified' } as const;

function Badge({ v }: { v: CancelGuide['verification'] }) {
  const cls = v === 'official' ? 'tag tag-ok' : v === 'partial' ? 'tag tag-stopped' : 'tag tag-forgotten';
  return <span className={cls}>{LABEL[v]}</span>;
}

export function GuidesPage() {
  const g = guides.general;
  return (
    <main className="page prose" id="main">
      <h1>Cancel guides</h1>
      <p>
        Short guides for the services people most often forget about in India. Each one says how far we could check it against the
        company's own help page: <strong>Checked</strong>, <strong>Partly checked</strong> or <strong>Not verified</strong>. Menu names change, so
        follow what you see on screen. Last checked {formatDate(guides.checked)}.
      </p>

      <h2 id="upi-autopay">{g.upiAutopay.title}</h2>
      {g.upiAutopay.apps.map((a) => (
        <section key={a.name}>
          <h3>{a.name}</h3>
          <ol>{a.steps.map((s) => <li key={s}>{s}</li>)}</ol>
        </section>
      ))}
      <ul style={{ marginTop: 12 }}>{g.upiAutopay.notes.map((n) => <li key={n}>{n}</li>)}</ul>

      <h2 id="card-si">{g.cardStandingInstruction.title}</h2>
      <ol>{g.cardStandingInstruction.steps.map((s) => <li key={s}>{s}</li>)}</ol>
      {g.cardStandingInstruction.banks.map((b) => (
        <section key={b.name}>
          <h3>{b.name}</h3>
          <ol>{b.steps.map((s) => <li key={s}>{s}</li>)}</ol>
        </section>
      ))}
      <ul style={{ marginTop: 12 }}>{g.cardStandingInstruction.notes.map((n) => <li key={n}>{n}</li>)}</ul>

      <h2 id="download">{g.downloadStatement.title}</h2>
      <p>Scanned PDFs can't be read. A CSV or Excel export is best. A text PDF also works.</p>
      {g.downloadStatement.banks.map((b) => (
        <section key={b.id}>
          <h3>{b.name} <Badge v={b.verification as CancelGuide['verification']} /></h3>
          <ol>{b.steps.map((s) => <li key={s}>{s}</li>)}</ol>
          <p className="hint">{b.note}</p>
        </section>
      ))}

      <h2 id="services">Services</h2>
      <ul className="guide-list">
        {guides.services.map((s) => (
          <li key={s.id}>
            <details id={`guide-${s.id}`}>
              <summary>
                {s.name} <Badge v={s.verification} />
              </summary>
              <div className="guide-body">
                {s.verification !== 'official' && (
                  <p className="verify">
                    {s.verification === 'partial'
                      ? 'Partly checked. We found an official page, but it does not cover every step.'
                      : "Not verified. We couldn't reach an official page, so these are the general routes."}
                  </p>
                )}
                <ol>{s.steps.map((x) => <li key={x}>{x}</li>)}</ol>
                <ul>{s.notes.map((x) => <li key={x}>{x}</li>)}</ul>
                {s.source && (
                  <p className="hint">
                    Source: <a href={s.source} target="_blank" rel="noopener noreferrer">official page <ExternalLink size={14} aria-hidden="true" style={{ verticalAlign: '-2px' }} /></a>
                    {s.lastVerified && `, checked ${formatDate(s.lastVerified)}`}
                  </p>
                )}
              </div>
            </details>
          </li>
        ))}
      </ul>
    </main>
  );
}
