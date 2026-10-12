import { Footer } from './Footer';
import { HeaderView } from './Header';

type Props = { theme?: 'light' | 'dark'; onToggleTheme?: () => void; header?: React.ReactNode; dialogs?: React.ReactNode; children: React.ReactNode };

/** The frame around every screen. The live app and the build-time prerender both use it, so their markup cannot drift apart. */
export function Shell({ theme = 'light', onToggleTheme = () => undefined, header, dialogs, children }: Props) {
  return (
    <>
      <a
        href="#main"
        className="skip-link"
        onClick={(e) => {
          e.preventDefault();
          const main = document.getElementById('main');
          main?.setAttribute('tabindex', '-1');
          main?.focus();
        }}
      >
        Skip to the content
      </a>
      {header ?? <HeaderView theme={theme} onToggle={onToggleTheme} />}
      <div tabIndex={-1} className="shell-body">{children}</div>
      <Footer />
      {dialogs}
    </>
  );
}
