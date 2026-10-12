import type { Analysis } from '../engine/analyze';
import type { FileOutcome, ParseOptions } from '../engine/parse/file';
import type { Txn } from '../engine/types';
import type { WorkerRequest, WorkerResponse } from './protocol';

type Pending = { resolve: (v: never) => void; reject: (e: Error) => void };

export class EngineClient {
  private worker: Worker;
  private pending = new Map<string, Pending>();
  private counter = 0;

  constructor() {
    this.worker = new Worker(new URL('./engine.worker.ts', import.meta.url), { type: 'module' });
    this.worker.onmessage = (e: MessageEvent<WorkerResponse>) => {
      const msg = e.data;
      const p = this.pending.get(msg.id);
      if (!p) return;
      this.pending.delete(msg.id);
      if (msg.kind === 'failed') p.reject(new Error(msg.message));
      else if (msg.kind === 'parsed') (p.resolve as (v: FileOutcome) => void)(msg.outcome);
      else (p.resolve as (v: Analysis) => void)(msg.analysis);
    };
    this.worker.onerror = () => {
      for (const p of this.pending.values()) p.reject(new Error('The reader stopped unexpectedly. Reload the page and try again.'));
      this.pending.clear();
    };
  }

  private request<T>(build: (id: string) => WorkerRequest): Promise<T> {
    const id = String(++this.counter);
    return new Promise<T>((resolve, reject) => {
      this.pending.set(id, { resolve: resolve as (v: never) => void, reject });
      this.worker.postMessage(build(id));
    });
  }

  parse(file: File, options: Omit<ParseOptions, 'pdfjs'> = {}): Promise<FileOutcome> {
    return this.request((id) => ({ kind: 'parse', id, file, options }));
  }

  analyze(files: Txn[][]): Promise<Analysis> {
    return this.request((id) => ({ kind: 'analyze', id, files }));
  }
}
