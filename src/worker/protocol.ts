import type { FileOutcome, ParseOptions } from '../engine/parse/file';
import type { Analysis } from '../engine/analyze';
import type { Txn } from '../engine/types';

export type WorkerRequest =
  | { kind: 'parse'; id: string; file: File; options: Omit<ParseOptions, 'pdfjs'> }
  | { kind: 'analyze'; id: string; files: Txn[][] };

export type WorkerResponse =
  | { kind: 'parsed'; id: string; outcome: FileOutcome }
  | { kind: 'analyzed'; id: string; analysis: Analysis }
  | { kind: 'failed'; id: string; message: string };
