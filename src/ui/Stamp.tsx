import { formatDate } from '../engine/labels';

type Props = { date: string; fresh?: boolean; className?: string };

/** The postmark that lands when an item is marked Cancel. Decorative: the radio button carries the state. */
export function Stamp({ date, fresh, className = '' }: Props) {
  const short = formatDate(date).split(' ').slice(0, 2).join(' ');
  return (
    <svg className={`stamp ${className}`} data-fresh={fresh ? 'true' : 'false'} viewBox="0 0 64 64" aria-hidden="true" focusable="false">
      <circle cx="32" cy="32" r="29" fill="none" stroke="currentColor" strokeWidth="3" />
      <circle cx="32" cy="32" r="24" fill="none" stroke="currentColor" strokeWidth="1.2" />
      <text x="32" y="25.5" textAnchor="middle" fontSize="10.5" fontWeight="700" fill="currentColor" fontFamily="inherit">Cancel</text>
      <text x="32" y="39" textAnchor="middle" fontSize="12" fontWeight="700" fill="currentColor" fontFamily="inherit">{short}</text>
      <path d="M6 46 q5.5-5 11 0 t11 0 t11 0 t11 0 t11 0" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

export function LogoMark() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M12 2.5c3.2 4.2 6 7.4 6 11a6 6 0 0 1-12 0c0-3.6 2.8-6.8 6-11Z" fill="#ffc72c" />
      <path d="M9.2 14.2a3 3 0 0 0 2.4 3" fill="none" stroke="#c8102e" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
