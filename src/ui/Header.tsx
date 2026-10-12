import { Lock, Moon, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';
import { LogoMark } from './Stamp';

function currentTheme(): 'light' | 'dark' {
  const set = document.documentElement.getAttribute('data-theme');
  if (set === 'light' || set === 'dark') return set;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function Header() {
  const [theme, setTheme] = useState<'light' | 'dark'>(currentTheme);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const on = () => setTheme(currentTheme());
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);

  const toggle = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    try {
      localStorage.setItem('dripcheck:theme', next);
    } catch {
      /* the choice just won't be remembered */
    }
    setTheme(next);
  };

  return (
    <header className="app-header on-red">
      <div className="page">
        <a className="wordmark" href="#/">
          <LogoMark />
          Dripcheck
        </a>
        <nav aria-label="Main" style={{ display: 'flex', gap: 4 }}>
          <a className="header-link" href="#/guides">Cancel guides</a>
          <a className="header-link" href="#/privacy">Privacy</a>
        </nav>
        <span className="header-spacer" />
        <a className="badge-privacy" href="#/privacy" data-testid="privacy-badge">
          <Lock aria-hidden="true" />
          Runs on your device. Nothing is uploaded.
        </a>
        <button type="button" className="icon-btn" onClick={toggle} aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}>
          {theme === 'dark' ? <Sun aria-hidden="true" /> : <Moon aria-hidden="true" />}
        </button>
      </div>
    </header>
  );
}
