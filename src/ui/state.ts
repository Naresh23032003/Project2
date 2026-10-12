import type { Analysis, Decision } from '../engine/analyze';
import type { Bank, ColumnMapping, Grid, Txn } from '../engine/types';

export type EntryState = 'queued' | 'reading' | 'ok' | 'needsPassword' | 'wrongPassword' | 'needsMapping' | 'scanned' | 'unsupported' | 'error';

export type Entry = {
  id: string;
  file: File;
  state: EntryState;
  message?: string;
  txns?: Txn[];
  bank?: Bank;
  warnings: string[];
  skipped: number;
  grid?: Grid;
  headerGuess?: number;
  password?: string;
  mapping?: ColumnMapping;
  flip?: boolean;
  dateOrder?: 'dmy' | 'mdy';
  skippedByUser?: boolean;
};

export type State = {
  entries: Entry[];
  analysis: Analysis | null;
  analysisKey: string;
  analysing: boolean;
  decisions: Record<string, Decision>;
  movedToSubscriptions: Record<string, true>;
  remember: boolean;
  sample: boolean;
};

export const initialState: State = {
  entries: [],
  analysis: null,
  analysisKey: '',
  analysing: false,
  decisions: {},
  movedToSubscriptions: {},
  remember: false,
  sample: false,
};

export type Action =
  | { type: 'add'; entries: Entry[]; sample: boolean }
  | { type: 'patch'; id: string; patch: Partial<Entry> }
  | { type: 'remove'; id: string }
  | { type: 'analysing'; key: string }
  | { type: 'analysed'; key: string; analysis: Analysis }
  | { type: 'decide'; id: string; decision: Decision | null }
  | { type: 'move'; id: string; on: boolean }
  | { type: 'remember'; value: boolean; decisions?: Record<string, Decision> }
  | { type: 'restoreChoices'; decisions: Record<string, Decision> }
  | { type: 'reset' };

export function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'add':
      return { ...state, entries: [...state.entries, ...action.entries], sample: state.entries.length === 0 ? action.sample : state.sample && action.sample };
    case 'patch':
      return { ...state, entries: state.entries.map((e) => (e.id === action.id ? { ...e, ...action.patch } : e)) };
    case 'remove':
      return { ...state, entries: state.entries.filter((e) => e.id !== action.id), analysisKey: '', analysis: state.entries.length <= 1 ? null : state.analysis };
    case 'analysing':
      return { ...state, analysing: true, analysisKey: action.key };
    case 'analysed':
      return action.key === state.analysisKey ? { ...state, analysing: false, analysis: action.analysis } : state;
    case 'decide': {
      const next = { ...state.decisions };
      if (action.decision) next[action.id] = action.decision;
      else delete next[action.id];
      return { ...state, decisions: next };
    }
    case 'move': {
      const next = { ...state.movedToSubscriptions };
      if (action.on) next[action.id] = true;
      else delete next[action.id];
      return { ...state, movedToSubscriptions: next };
    }
    case 'remember':
      return { ...state, remember: action.value };
    case 'restoreChoices':
      return { ...state, decisions: { ...action.decisions, ...state.decisions }, remember: true };
    case 'reset':
      return { ...initialState, remember: state.remember };
  }
}

/** An entry still waiting on work or on the person. */
export const isOpen = (e: Entry) => ['queued', 'reading', 'needsPassword', 'wrongPassword', 'needsMapping'].includes(e.state) && !e.skippedByUser;
export const isWorking = (e: Entry) => e.state === 'queued' || e.state === 'reading';
export const needsPerson = (e: Entry) => ['needsPassword', 'wrongPassword', 'needsMapping'].includes(e.state) && !e.skippedByUser;
