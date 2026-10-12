// Renders public/og.png (1200x630) with the product's own font and palette. Run: node scripts/make-og.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { chromium } from '@playwright/test';

const font = readFileSync('node_modules/@fontsource-variable/bricolage-grotesque/files/bricolage-grotesque-latin-wght-normal.woff2').toString('base64');
const fontExt = readFileSync('node_modules/@fontsource-variable/bricolage-grotesque/files/bricolage-grotesque-latin-ext-wght-normal.woff2').toString('base64');

const html = `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face{font-family:B;src:url(data:font/woff2;base64,${font}) format('woff2-variations');font-weight:200 800;unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+2000-206F,U+20AC,U+2122,U+2212}
@font-face{font-family:B;src:url(data:font/woff2;base64,${fontExt}) format('woff2-variations');font-weight:200 800;unicode-range:U+0100-02BA,U+20A0-20AB,U+20AD-20C0}
*{box-sizing:border-box;margin:0}
body{width:1200px;height:630px;background:#f5f6f8;font-family:B,system-ui,sans-serif;color:#121a33;position:relative;overflow:hidden}
.top{height:104px;background:#c8102e;display:flex;align-items:center;padding:0 72px;gap:18px;color:#fff;font-size:46px;font-weight:700;letter-spacing:-.01em}
h1{font-size:72px;line-height:1.05;font-weight:650;letter-spacing:-.025em}
.col{position:absolute;left:72px;top:150px;width:730px}
.sub{margin-top:26px;width:700px;font-size:32px;line-height:1.3;color:#4a5470;font-weight:500}
.badge{position:absolute;left:72px;bottom:44px;background:#fff;border:1px solid #dde1ea;border-radius:999px;padding:12px 24px;font-size:28px;font-weight:600;display:flex;gap:12px;align-items:center}
.stamp{position:absolute;right:60px;top:200px;width:270px;height:270px;color:#2b3190;transform:rotate(-8deg)}
.pill{position:absolute;right:92px;bottom:60px;background:#0b7a4b;color:#fff;border-radius:16px;padding:14px 26px;font-size:34px;font-weight:700}
</style></head><body>
<div class="top"><svg width="46" height="46" viewBox="0 0 24 24"><path d="M12 2.5c3.2 4.2 6 7.4 6 11a6 6 0 0 1-12 0c0-3.6 2.8-6.8 6-11Z" fill="#ffc72c"/><path d="M9.2 14.2a3 3 0 0 0 2.4 3" fill="none" stroke="#c8102e" stroke-width="1.8" stroke-linecap="round"/></svg>Dripcheck</div>
<div class="col"><h1>Find the subscriptions you forgot you pay for.</h1>
<p class="sub">Drop in a bank statement. See every recurring charge and how to cancel it.</p></div>
<div class="badge"><svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#0b7a4b" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>Runs on your device. Nothing is uploaded.</div>
<svg class="stamp" viewBox="0 0 64 64"><circle cx="32" cy="32" r="29" fill="none" stroke="currentColor" stroke-width="2.4"/><circle cx="32" cy="32" r="24" fill="none" stroke="currentColor" stroke-width="1"/><text x="32" y="25.5" text-anchor="middle" font-size="10.5" font-weight="700" fill="currentColor" font-family="B">Cancel</text><text x="32" y="39" text-anchor="middle" font-size="12" font-weight="700" fill="currentColor" font-family="B">8 Sep</text><path d="M6 46 q5.5-5 11 0 t11 0 t11 0 t11 0 t11 0" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
</body></html>`;

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH ?? '/opt/pw-browsers/chromium' });
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
await page.setContent(html);
await page.evaluate(() => document.fonts.ready);
writeFileSync('public/og.png', await page.screenshot({ type: 'png' }));
await browser.close();
console.log('og image written');
