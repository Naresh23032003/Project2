// Renders the PNG icons from public/favicon.svg with the Chromium that Playwright already has.
// Run: node scripts/make-icons.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { chromium } from '@playwright/test';

const svg = readFileSync('public/favicon.svg', 'utf8');
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH ?? '/opt/pw-browsers/chromium' });
const page = await browser.newPage();

async function png(size, out, { padding = 0, fullBleed = false } = {}) {
  await page.setViewportSize({ width: size, height: size });
  const inner = size - padding * 2;
  const markup = fullBleed ? svg.replace('rx="14"', 'rx="0"') : svg;
  await page.setContent(`<body style="margin:0;background:${fullBleed ? '#c8102e' : 'transparent'}"><div style="width:${size}px;height:${size}px;display:grid;place-items:center"><div style="width:${inner}px;height:${inner}px">${markup.replace('<svg ', '<svg width="100%" height="100%" ')}</div></div></body>`);
  writeFileSync(out, await page.screenshot({ omitBackground: !fullBleed, type: 'png' }));
}

await png(192, 'public/icon-192.png');
await png(512, 'public/icon-512.png');
await png(180, 'public/apple-touch-icon.png', { fullBleed: true });
await browser.close();
console.log('icons written');
