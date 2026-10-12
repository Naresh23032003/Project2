// Writes the landing screen's HTML into dist/index.html. Run after `vite build` and the ssr build.
import { readFileSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { join } from 'node:path';

const { renderLanding } = await import(pathToFileURL(join(process.cwd(), 'dist-ssr', 'prerender.js')).href);
const file = join(process.cwd(), 'dist', 'index.html');
const html = readFileSync(file, 'utf8');
if (!html.includes('<div id="root"></div>')) throw new Error('dist/index.html has no empty #root to fill');
writeFileSync(file, html.replace('<div id="root"></div>', `<div id="root">${renderLanding()}</div>`));
console.log('prerendered the landing screen into dist/index.html');
