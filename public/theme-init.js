// Runs before first paint so the saved theme does not flash. The build inlines this file into index.html,
// and vercel.json allows it by its hash. Change this file and the hash must change too (test/unit/csp.test.ts checks).
try {
  const t = localStorage.getItem('dripcheck:theme');
  if (t === 'light' || t === 'dark') document.documentElement.setAttribute('data-theme', t);
} catch {
  /* storage blocked: follow the system theme */
}
