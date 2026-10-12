import { Info } from 'lucide-react';
import { DropZone } from './DropZone';

type Props = { onFiles: (files: File[]) => void; onSample: () => void; problem?: React.ReactNode };

export function Landing({ onFiles, onSample, problem }: Props) {
  return (
    <main className="page landing" id="main">
      <h1 className="display">Find the subscriptions you forgot you pay for.</h1>
      <p className="lead">
        Drop in a bank or card statement. Dripcheck lists every recurring charge, what it costs you a year, and how to cancel it.
        It all runs on your device.
      </p>

      {problem}
      <DropZone onFiles={onFiles} onSample={onSample} />

      <p className="notice" style={{ marginTop: 16 }}>
        <Info aria-hidden="true" />
        <span>Use at least 3 months of statements. 6 to 12 months also catches the yearly ones.</span>
      </p>

      <div className="facts">
        <section>
          <h2>Nothing leaves your device</h2>
          <p>
            Your statement is read inside this browser tab. There's no server to send it to. Turn off your Wi-Fi and try it.{' '}
            <a href="#/privacy">See how to check this yourself.</a>
          </p>
        </section>
        <section>
          <h2>Every result shows its reason</h2>
          <p>No black box. Each charge says why it was flagged, like "charged around the 5th each month, 7 months in a row".</p>
        </section>
        <section>
          <h2>You decide</h2>
          <p>Mark each one Keep, Cancel or Not a subscription. Dripcheck never cancels anything. It shows you how.</p>
        </section>
      </div>

      <p className="hint" style={{ marginTop: 40, maxWidth: '62ch' }}>
        Reads exports from HDFC, SBI, ICICI, Axis and Kotak, plus most card statements. If your file has another layout, you'll be asked
        which column is which. Not sure where to find the file?{' '}
        <a href="#/guides#download">Here's how to download one from your bank.</a>
      </p>
    </main>
  );
}
