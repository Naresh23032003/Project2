import { analyze } from '../engine/analyze';
import { parseStatement } from '../engine/parse/file';
import type { PdfJs } from '../engine/parse/pdf';
import type { WorkerRequest, WorkerResponse } from './protocol';

let pdfjs: Promise<PdfJs> | undefined;

// pdf.js is only fetched when someone drops a PDF. Putting its worker code in this worker's scope
// makes it run here instead of starting a second worker, which keeps the CSP simple.
function loadPdfjs(): Promise<PdfJs> {
  pdfjs ??= (async () => {
    const [lib, worker] = await Promise.all([import('pdfjs-dist/legacy/build/pdf.mjs'), import('pdfjs-dist/legacy/build/pdf.worker.mjs')]);
    (globalThis as unknown as { pdfjsWorker: unknown }).pdfjsWorker = worker;
    return lib as unknown as PdfJs;
  })();
  return pdfjs;
}

const send = (msg: WorkerResponse) => (self as unknown as Worker).postMessage(msg);

self.onmessage = async (e: MessageEvent<WorkerRequest>) => {
  const req = e.data;
  try {
    if (req.kind === 'parse') {
      const data = await req.file.arrayBuffer();
      const isPdf = /\.pdf$/i.test(req.file.name);
      const outcome = await parseStatement(req.file.name, data, { ...req.options, pdfjs: isPdf ? await loadPdfjs() : undefined });
      send({ kind: 'parsed', id: req.id, outcome });
    } else {
      send({ kind: 'analyzed', id: req.id, analysis: analyze(req.files) });
    }
  } catch (err) {
    send({ kind: 'failed', id: req.id, message: err instanceof Error ? err.message : 'Something went wrong while reading the file.' });
  }
};
