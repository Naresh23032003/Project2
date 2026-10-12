import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const vercel = JSON.parse(readFileSync('vercel.json', 'utf8')) as { headers: { source: string; headers: { key: string; value: string }[] }[] };
const csp = vercel.headers.find((h) => h.source === '/(.*)')?.headers.find((h) => h.key === 'Content-Security-Policy')?.value ?? '';
const directive = (name: string) => csp.split(';').map((d) => d.trim()).find((d) => d.startsWith(name + ' ')) ?? '';

describe('content security policy', () => {
  it('only allows connections to the site itself', () => {
    expect(directive('connect-src')).toBe("connect-src 'self'");
    expect(directive('default-src')).toBe("default-src 'none'");
  });

  it('allows no inline styles, eval, or remote scripts, fonts, images or frames', () => {
    expect(csp).not.toMatch(/unsafe-inline|unsafe-eval|https?:|\*/);
    expect(directive('frame-ancestors')).toBe("frame-ancestors 'none'");
    expect(directive('form-action')).toBe("form-action 'none'");
    expect(directive('object-src')).toBe("object-src 'none'");
  });

  it('allows exactly one inline script, the theme initialiser, by its hash', () => {
    const hash = createHash('sha256').update(readFileSync('public/theme-init.js')).digest('base64');
    expect(directive('script-src')).toBe(`script-src 'self' 'sha256-${hash}'`);
  });

  it('sets the other security headers', () => {
    const keys = vercel.headers.find((h) => h.source === '/(.*)')?.headers.map((h) => h.key) ?? [];
    expect(keys).toEqual(expect.arrayContaining(['X-Content-Type-Options', 'Referrer-Policy', 'Permissions-Policy', 'Cross-Origin-Opener-Policy', 'X-Frame-Options']));
  });
});
