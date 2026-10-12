import { renderToString } from 'react-dom/server';
import { Landing } from './ui/Landing';
import { MappingDialog } from './ui/MappingDialog';
import { PasswordDialog } from './ui/PasswordDialog';
import { Shell } from './ui/Shell';

/** The landing screen as static HTML, written into index.html at build time so the first paint doesn't wait for JavaScript. */
export function renderLanding(): string {
  return renderToString(
    <Shell
      dialogs={
        <>
          <PasswordDialog entry={null} onSubmit={() => undefined} onSkip={() => undefined} />
          <MappingDialog entry={null} onSubmit={() => undefined} onSkip={() => undefined} />
        </>
      }
    >
      <Landing onFiles={() => undefined} onSample={() => undefined} />
    </Shell>,
  );
}
