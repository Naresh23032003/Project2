import { expect, openApp, test } from './helpers';

test('works with the network switched off after the first load', async ({ page, context }, info) => {
  test.skip(info.project.name === 'mobile', 'the offline check runs once, on desktop');
  await openApp(page);
  await page.evaluate(() => navigator.serviceWorker.ready.then(() => undefined));
  // Reload once so the page is controlled by the service worker, which then serves everything.
  await page.reload();
  await expect.poll(() => page.evaluate(() => navigator.serviceWorker.controller !== null)).toBe(true);

  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Find the subscriptions');
  await page.getByTestId('sample-button').click();
  await expect(page.getByTestId('headline')).toContainText('recurring');
  await page.getByTestId('item-row').first().getByRole('radio', { name: 'Cancel' }).click();
  await expect.poll(async () => (await page.getByTestId('savings-status').textContent()) ?? '').not.toContain('₹0 a year');

  await page.goto('/#/guides');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Cancel guides');
  await context.setOffline(false);
});
