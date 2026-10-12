import { lazy, Suspense, useCallback, useEffect, useMemo, useReducer, useRef } from 'react';
import type { Decision } from '../engine/summary';
import type { FileOutcome } from '../engine/parse/file';
import { createChoiceStore } from '../engine/storage';
import type { ColumnMapping } from '../engine/types';
import { EngineClient } from '../worker/client';
import { FileStatus } from './FileStatus';
import { Header } from './Header';
import { Shell } from './Shell';
import { useRoute } from './hooks';
import { Landing } from './Landing';
import { MappingDialog } from './MappingDialog';
import { PasswordDialog } from './PasswordDialog';
import { initialState, isOpen, needsPerson, reducer, type Entry } from './state';

function safeStorage(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

const Results = lazy(() => import('./Results').then((m) => ({ default: m.Results })));
const GuidesPage = lazy(() => import('./GuidesPage').then((m) => ({ default: m.GuidesPage })));
const PrivacyPage = lazy(() => import('./PrivacyPage').then((m) => ({ default: m.PrivacyPage })));

function Loading() {
  return (
    <main className="page landing" id="main">
      <p className="hint" role="status">Loading</p>
    </main>
  );
}

let counter = 0;

export function App() {
  const { route } = useRoute();
  const [state, dispatch] = useReducer(reducer, initialState);
  const clientRef = useRef<EngineClient | null>(null);
  const client = useCallback(() => (clientRef.current ??= new EngineClient()), []);
  const store = useMemo(() => createChoiceStore(safeStorage()), []);

  useEffect(() => {
    document.title = route === 'privacy' ? 'Privacy | Dripcheck' : route === 'guides' ? 'Cancel guides | Dripcheck' : 'Dripcheck';
  }, [route]);

  useEffect(() => {
    if (store.isEnabled()) dispatch({ type: 'restoreChoices', decisions: store.load() });
  }, [store]);

  // Read every queued file in the worker.
  useEffect(() => {
    for (const e of state.entries) {
      if (e.state !== 'queued') continue;
      dispatch({ type: 'patch', id: e.id, patch: { state: 'reading' } });
      client()
        .parse(e.file, { password: e.password, mapping: e.mapping, flip: e.flip, dateOrder: e.dateOrder })
        .then((o: FileOutcome) => {
          switch (o.status) {
            case 'ok':
              dispatch({ type: 'patch', id: e.id, patch: { state: 'ok', txns: o.txns, bank: o.bank, warnings: o.warnings, skipped: o.skippedRows, message: undefined } });
              break;
            case 'needsMapping':
              dispatch({ type: 'patch', id: e.id, patch: { state: 'needsMapping', grid: o.grid, headerGuess: o.headerGuess } });
              break;
            case 'unsupported':
              dispatch({ type: 'patch', id: e.id, patch: { state: 'unsupported', message: o.reason } });
              break;
            default:
              dispatch({ type: 'patch', id: e.id, patch: { state: o.status } });
          }
        })
        .catch((err: Error) => dispatch({ type: 'patch', id: e.id, patch: { state: 'error', message: err.message } }));
    }
  }, [state.entries, client]);

  // Once nothing is waiting, find the recurring charges across all readable files.
  useEffect(() => {
    if (state.entries.some(isOpen)) return;
    const ready = state.entries.filter((e) => e.state === 'ok' && e.txns);
    if (ready.length === 0) return;
    const key = ready.map((e) => e.id).join(',');
    if (key === state.analysisKey) return;
    dispatch({ type: 'analysing', key });
    client()
      .analyze(ready.map((e) => e.txns ?? []))
      .then((analysis) => dispatch({ type: 'analysed', key, analysis }))
      .catch((err: Error) => dispatch({ type: 'patch', id: ready[0]?.id ?? '', patch: { state: 'error', message: err.message } }));
  }, [state.entries, state.analysisKey, client]);

  useEffect(() => {
    if (state.remember) store.save(state.decisions);
  }, [state.decisions, state.remember, store]);

  const addFiles = useCallback((files: File[], sample = false) => {
    const entries: Entry[] = files.map((file) => ({ id: `f${++counter}`, file, state: 'queued', warnings: [], skipped: 0 }));
    dispatch({ type: 'add', entries, sample });
  }, []);

  const useSample = async () => {
    const { SAMPLE_FILE_NAME, sampleStatementCsv } = await import('../engine/sample');
    addFiles([new File([sampleStatementCsv()], SAMPLE_FILE_NAME, { type: 'text/csv' })], true);
  };

  const decide = (id: string, decision: Decision | null) => dispatch({ type: 'decide', id, decision });
  const remember = (on: boolean) => {
    if (on) store.enable(state.decisions);
    else store.forget();
    dispatch({ type: 'remember', value: on });
  };

  const pwEntry = state.entries.find((e) => (e.state === 'needsPassword' || e.state === 'wrongPassword') && !e.skippedByUser) ?? null;
  const mapEntry = pwEntry ? null : (state.entries.find((e) => e.state === 'needsMapping' && !e.skippedByUser) ?? null);
  const fix = (id: string) => dispatch({ type: 'patch', id, patch: { skippedByUser: false } });

  const working = state.entries.some((e) => isOpen(e) && !needsPerson(e)) || state.analysing;
  const hasResults = state.analysis !== null && state.entries.some((e) => e.state === 'ok');

  let body: React.ReactNode;
  if (route === 'privacy') body = <PrivacyPage />;
  else if (route === 'guides') body = <GuidesPage />;
  else if (hasResults && state.analysis) {
    body = (
      <Results
        analysis={state.analysis}
        entries={state.entries}
        decisions={state.decisions}
        moved={state.movedToSubscriptions}
        remember={state.remember}
        sample={state.sample}
        onDecide={decide}
        onMove={(id, on) => dispatch({ type: 'move', id, on })}
        onFiles={(f) => addFiles(f)}
        onRemoveEntry={(id) => dispatch({ type: 'remove', id })}
        onFixEntry={fix}
        onReset={() => dispatch({ type: 'reset' })}
        onRemember={remember}
      />
    );
  } else if (state.entries.length > 0 && (working || state.entries.some(needsPerson))) {
    body = (
      <main className="page landing" id="main">
        <h1 className="display" data-testid="reading-title">Reading your statement</h1>
        <p className="lead">Your files are read on this device. Nothing is uploaded.</p>
        <FileStatus entries={state.entries} onRemove={(id) => dispatch({ type: 'remove', id })} onFix={fix} />
        <div className="progress" aria-hidden="true"><span /></div>
      </main>
    );
  } else {
    const failed = state.entries.filter((e) => e.state !== 'ok');
    body = (
      <Landing
        onFiles={(f) => addFiles(f)}
        onSample={() => void useSample()}
        problem={
          failed.length > 0 ? (
            <div style={{ marginTop: 24 }}>
              <p className="notice error" role="alert"><span>We couldn't read {failed.length === 1 ? 'that file' : 'those files'}.</span></p>
              <FileStatus entries={failed} onRemove={(id) => dispatch({ type: 'remove', id })} onFix={fix} />
            </div>
          ) : undefined
        }
      />
    );
  }

  return (
    <Shell
        header={<Header />}
        dialogs={
          <>
            <PasswordDialog
              entry={pwEntry}
              onSubmit={(id, password) => dispatch({ type: 'patch', id, patch: { password, state: 'queued' } })}
              onSkip={(id) => dispatch({ type: 'patch', id, patch: { skippedByUser: true } })}
            />
            <MappingDialog
              entry={mapEntry}
              onSubmit={(id, mapping: ColumnMapping, flip, dateOrder) => dispatch({ type: 'patch', id, patch: { mapping, flip, dateOrder, state: 'queued' } })}
              onSkip={(id) => dispatch({ type: 'patch', id, patch: { skippedByUser: true } })}
            />
          </>
        }
      >
        <Suspense fallback={<Loading />}>{body}</Suspense>
      </Shell>
  );
}
