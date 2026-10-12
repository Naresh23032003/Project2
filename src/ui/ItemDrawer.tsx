import { ExternalLink, X } from 'lucide-react';
import type { Decision } from '../engine/analyze';
import { guideFor, type CancelGuide } from '../engine/cancel';
import { formatRupees } from '../engine/format';
import { CADENCE_LABEL, TYPE_LABEL, formatDate } from '../engine/labels';
import type { Recurring } from '../engine/types';
import { Confidence, Monogram, Tags } from './Badges';
import { Choice } from './Choice';
import { Modal } from './Modal';

type Props = { item: Recurring | null; decision: Decision | undefined; onDecide: (d: Decision | null) => void; onClose: () => void };

function Verification({ guide }: { guide: CancelGuide }) {
  const when = guide.lastVerified ? formatDate(guide.lastVerified) : '';
  if (guide.verification === 'official') {
    return (
      <p className="verify verify-official" data-testid="verify">
        <strong>Checked against the official help page</strong>
        {guide.name}'s own page, on {when}. Menu names change, so follow what you see on screen.
      </p>
    );
  }
  if (guide.verification === 'partial') {
    return (
      <p className="verify" data-testid="verify">
        <strong>Partly checked</strong>
        We found an official page on {when}, but it doesn't cover every step. Where something is missing, we say so below.
      </p>
    );
  }
  return (
    <p className="verify verify-unverified" data-testid="verify">
      <strong>Not verified</strong>
      We couldn't reach an official page for {guide.name}, so these are the general routes. Check the app for the exact menu names.
    </p>
  );
}

export function ItemDrawer({ item, decision, onDecide, onClose }: Props) {
  const guide = item ? guideFor(item.knownId) : undefined;
  const link = guide?.directUrl ?? guide?.source ?? null;
  return (
    <Modal open={item !== null} onClose={onClose} labelledBy="drawer-title" className="drawer">
      {item && (
        <>
          <div className="drawer-head">
            <Monogram name={item.display} />
            <h2 id="drawer-title">{item.display}</h2>
            <button type="button" className="icon-btn" onClick={onClose} aria-label="Close details">
              <X aria-hidden="true" />
            </button>
          </div>
          <div className="drawer-body" data-testid="drawer">
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
              <Confidence value={item.confidence} />
              <Tags item={item} />
              <span className="hint">{TYPE_LABEL[item.category]}, {CADENCE_LABEL[item.cadence].toLowerCase()}</span>
            </div>

            <section>
              <h3>Your call</h3>
              <Choice id={`drawer-${item.id}`} name={item.display} value={decision} onChange={onDecide} />
              <p className="hint" style={{ marginTop: 8 }}>
                {formatRupees(item.typicalAmount)} {CADENCE_LABEL[item.cadence].toLowerCase()}, about {formatRupees(item.yearlyCost)} a year.
              </p>
            </section>

            <section>
              <h3>Why we think so</h3>
              <ul>
                {item.reasons.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
            </section>

            {item.priceChanges.length > 0 && (
              <section>
                <h3>Price changes</h3>
                <ul>
                  {item.priceChanges.map((c) => (
                    <li key={c.date}>
                      {formatRupees(c.from)} to {formatRupees(c.to)} on {formatDate(c.date)}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <section>
              <h3>The charges we found</h3>
              <table className="history">
                <thead>
                  <tr><th scope="col">Date</th><th scope="col">Amount</th></tr>
                </thead>
                <tbody>
                  {[...item.hits].reverse().map((h) => (
                    <tr key={h.id}>
                      <td className="num">{formatDate(h.date)}</td>
                      <td className="num">{formatRupees(h.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>

            {item.category === 'subscription' && (
              <section aria-labelledby="how-to-cancel">
                <h3 id="how-to-cancel">How to cancel</h3>
                {guide ? (
                  <div style={{ display: 'grid', gap: 12 }}>
                    <Verification guide={guide} />
                    <ol>
                      {guide.steps.map((s) => (
                        <li key={s}>{s}</li>
                      ))}
                    </ol>
                    {guide.notes.length > 0 && (
                      <ul>
                        {guide.notes.map((n) => (
                          <li key={n}>{n}</li>
                        ))}
                      </ul>
                    )}
                    {link && (
                      <p>
                        <a className="btn btn-secondary btn-small" href={link} target="_blank" rel="noopener noreferrer">
                          {guide.directUrl ? 'Open your account page' : 'Open the official help page'}
                          <ExternalLink aria-hidden="true" />
                        </a>
                      </p>
                    )}
                    <p className="hint">
                      Cancelling is not the same as stopping the payment. To stop the payment itself, see{' '}
                      <a href="#/guides#upi-autopay">UPI autopay</a> and <a href="#/guides#card-si">card standing instructions</a>.
                    </p>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gap: 12 }}>
                    <p className="verify verify-unverified" data-testid="verify">
                      <strong>No guide for this one yet</strong>
                      We don't have verified steps for {item.display}. Use the general routes below.
                    </p>
                    <ol>
                      <li>Open the {item.display} app or website and look for a subscription or billing section.</li>
                      <li>If you pay through UPI autopay, stop the mandate in your UPI app.</li>
                      <li>If you pay by card, withdraw the standing instruction with your card issuer.</li>
                    </ol>
                    <p>
                      <a href="#/guides#upi-autopay">UPI autopay steps</a> and <a href="#/guides#card-si">card standing instruction steps</a>.
                    </p>
                  </div>
                )}
              </section>
            )}
          </div>
        </>
      )}
    </Modal>
  );
}
