import AxeBuilder from '@axe-core/playwright';
import type { Page } from '@playwright/test';
import { expect, fixture, loadSample, openApp, test } from './helpers';

const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

async function scan(page: Page, label: string) {
  const { violations } = await new AxeBuilder({ page }).withTags(TAGS).analyze();
  const bad = violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
  const summary = violations.map((v) => `${v.impact} ${v.id}: ${v.nodes.slice(0, 2).map((n) => n.target.join(' ')).join(' | ')}`);
  expect(bad.map((v) => v.id), `${label}: ${summary.join('; ')}`).toEqual([]);
  // Minor and moderate findings are listed too, because zero is the goal.
  expect(summary, label).toEqual([]);
}

for (const scheme of ['light', 'dark'] as const) {
  test.describe(`axe in ${scheme} mode`, () => {
    test.use({ colorScheme: scheme });

    test('landing', async ({ page }) => {
      await openApp(page);
      await scan(page, 'landing');
    });

    test('results, with an item marked Cancel', async ({ page }) => {
      await loadSample(page);
      await page.getByTestId('item-row').first().getByRole('radio', { name: 'Cancel' }).click();
      await scan(page, 'results');
    });

    test('details panel', async ({ page }) => {
      await loadSample(page);
      await page.getByRole('button', { name: 'Netflix', exact: true }).click();
      await expect(page.getByTestId('drawer')).toBeVisible();
      await scan(page, 'drawer');
    });

    test('share card dialog', async ({ page }) => {
      await loadSample(page);
      await page.getByTestId('share-open').click();
      await expect(page.getByTestId('share-download')).toBeVisible();
      await scan(page, 'share');
    });

    test('password dialog', async ({ page }) => {
      await openApp(page);
      await page.getByTestId('file-input').setInputFiles(fixture('hdfc-password.pdf'));
      await expect(page.getByTestId('pdf-password')).toBeVisible();
      await scan(page, 'password');
    });

    test('column mapping dialog', async ({ page }) => {
      await openApp(page);
      await page.getByTestId('file-input').setInputFiles(fixture('unknown-format.csv'));
      await expect(page.getByRole('heading', { name: 'Which column is which?' })).toBeVisible();
      await scan(page, 'mapping');
    });

    test('scanned PDF error', async ({ page }) => {
      await openApp(page);
      await page.getByTestId('file-input').setInputFiles(fixture('scanned.pdf'));
      await expect(page.getByText('A scanned PDF is a picture')).toBeVisible();
      await scan(page, 'scanned');
    });

    test('privacy page', async ({ page }) => {
      await page.goto('/#/privacy');
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      await scan(page, 'privacy');
    });

    test('guides page', async ({ page }) => {
      await page.goto('/#/guides');
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      await scan(page, 'guides');
    });
  });
}
