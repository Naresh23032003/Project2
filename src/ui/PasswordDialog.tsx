import { useState } from 'react';
import { Modal } from './Modal';
import type { Entry } from './state';

type Props = { entry: Entry | null; onSubmit: (id: string, password: string) => void; onSkip: (id: string) => void };

export function PasswordDialog({ entry, onSubmit, onSkip }: Props) {
  const [password, setPassword] = useState('');
  const wrong = entry?.state === 'wrongPassword';
  return (
    <Modal open={entry !== null} onClose={() => entry && onSkip(entry.id)} labelledBy="pw-title" dismissOnBackdrop={false}>
      {entry && (
        <form
          className="modal-body"
          onSubmit={(e) => {
            e.preventDefault();
            if (!password) return;
            onSubmit(entry.id, password);
            setPassword('');
          }}
        >
          <h2 id="pw-title">This PDF is password protected</h2>
          <p>
            Banks often use your date of birth or customer ID. The password stays in memory on this device and is gone when you close the tab.
          </p>
          <p className="hint">{entry.file.name}</p>
          <div className="field">
            <label htmlFor="pw">Password</label>
            <input
              id="pw"
              className="input"
              type="password"
              autoComplete="off"
              autoFocus
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              aria-invalid={wrong}
              aria-describedby={wrong ? 'pw-error' : undefined}
              data-testid="pdf-password"
            />
            {wrong && (
              <p id="pw-error" role="alert" style={{ color: 'var(--red-text)', fontWeight: 600 }}>
                That password didn't work. Try again.
              </p>
            )}
          </div>
          <div className="row-end">
            <button type="button" className="btn btn-quiet" onClick={() => onSkip(entry.id)}>
              Skip this file
            </button>
            <button type="submit" className="btn btn-primary" disabled={!password} data-testid="pdf-password-submit">
              Open PDF
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}
