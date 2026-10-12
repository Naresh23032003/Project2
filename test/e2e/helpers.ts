import { expect, test as base, type Page } from '@playwright/test';
import { join } from 'node:path';

export const fixture = (name: string) => join(process.cwd(), 'test', 'fixtures', name);

/** Every test fails on a console error, page error or CSP violation. */
export const test = base.extend({
  page: async ({ page }, use) => {
    const problems: string[] = [];
    page.on('console', (m) => {
      if (m.type() === 'error') problems.push(`console: ${m.text()}`);
    });
    page.on('pageerror', (e) => problems.push(`pageerror: ${e.message}`));
    await use(page);
    expect(problems).toEqual([]);
  },
});
export { expect };

export async function openApp(page: Page) {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Find the subscriptions');
}

export async function loadSample(page: Page) {
  await openApp(page);
  await page.getByTestId('sample-button').click();
  await expect(page.getByTestId('headline')).toContainText('recurring');
}

export async function loadFiles(page: Page, ...names: string[]) {
  await openApp(page);
  await page.getByTestId('file-input').setInputFiles(names.map(fixture));
}

/** Rupees in the savings readout, as a number. */
export async function savings(page: Page): Promise<number> {
  const text = (await page.getByTestId('savings-status').textContent()) ?? '';
  return Number((/₹([\d,]+(?:\.\d+)?)/.exec(text)?.[1] ?? '0').replace(/,/g, ''));
}
