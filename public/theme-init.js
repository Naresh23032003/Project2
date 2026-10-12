// Runs before first paint so the saved theme does not flash. Kept as a file because the CSP forbids inline scripts.
try {
  const t = localStorage.getItem('dripcheck:theme');
  if (t === 'light' || t === 'dark') document.documentElement.setAttribute('data-theme', t);
} catch {
  /* storage blocked: follow the system theme */
}
