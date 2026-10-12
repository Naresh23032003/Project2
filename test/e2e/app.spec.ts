import { expect, loadSample, openApp, savings, test } from './helpers';

test.describe('sample data and marking', () => {
  test('one click shows a headline and a list', async ({ page }) => {
    await loadSample(page);
    await expect(page.getByTestId('headline')).toHaveText(/You're paying ₹[\d,]+ a year for \d+ recurring things\./);
    expect(await page.getByTestId('item-row').count()).toBeGreaterThanOrEqual(5);
    await expect(page.getByText('made-up sample data')).toBeVisible();
  });

  test('marking Cancel lands a stamp and raises the savings, clearing it lowers them', async ({ page }) => {
    await loadSample(page);
    expect(await savings(page)).toBe(0);
    const first = page.getByTestId('item-row').first();
    await first.getByRole('radio', { name: 'Cancel' }).click();
    await expect(first.locator('svg.stamp')).toBeVisible();
    await expect.poll(() => savings(page)).toBeGreaterThan(1000);
    await first.getByRole('radio', { name: 'Cancel' }).click();
    await expect(first.locator('svg.stamp')).toHaveCount(0);
    await expect.poll(() => savings(page)).toBe(0);
  });

  test('Not a subscription takes an item out of the total', async ({ page }) => {
    await loadSample(page);
    const before = (await page.getByTestId('headline').textContent()) ?? '';
    await page.getByTestId('item-row').first().getByRole('radio', { name: 'Not a subscription' }).click();
    await expect(page.getByTestId('headline')).not.toHaveText(before);
  });

  test('a filter narrows the list and can be cleared', async ({ page }) => {
    await loadSample(page);
    const all = await page.getByTestId('item-row').count();
    await page.getByRole('button', { name: /^Stopped/ }).click();
    await expect(page.getByTestId('item-row')).toHaveCount(1);
    await page.getByRole('button', { name: /^All/ }).click();
    await expect(page.getByTestId('item-row')).toHaveCount(all);
  });

  test('price changes are called out in plain words', async ({ page }) => {
    await loadSample(page);
    await expect(page.getByTestId('price-alerts')).toContainText('Spotify went from ₹119 to ₹139 in April.');
  });

  test('the details panel shows the reason, the charges and a verified cancel guide', async ({ page }) => {
    await loadSample(page);
    await page.getByRole('button', { name: 'Netflix', exact: true }).click();
    const drawer = page.getByTestId('drawer');
    await expect(drawer).toContainText('Why we think so');
    await expect(drawer).toContainText('The charges we found');
    await expect(page.getByTestId('verify')).toContainText('Checked against the official help page');
    await expect(drawer.getByRole('link', { name: /official help page/ })).toHaveAttribute('href', /help\.netflix\.com/);
    await page.keyboard.press('Escape');
    await expect(drawer).toBeHidden();
  });

  test('other recurring payments stay collapsed and can move up', async ({ page }) => {
    await loadSample(page);
    const other = page.getByTestId('other-recurring');
    await expect(other).not.toHaveAttribute('open', '');
    const rowsBefore = await page.getByTestId('item-row').count();
    await other.locator('summary').click();
    await other.getByRole('button', { name: 'This is a subscription' }).first().click();
    await expect(page.getByTestId('item-row')).toHaveCount(rowsBefore + 1);
  });

  test('downloads a CSV with every item and the choice made', async ({ page }) => {
    await loadSample(page);
    await page.getByTestId('item-row').first().getByRole('radio', { name: 'Cancel' }).click();
    const [download] = await Promise.all([page.waitForEvent('download'), page.getByTestId('export-csv').click()]);
    expect(download.suggestedFilename()).toBe('dripcheck-recurring.csv');
    const body = await (await download.createReadStream()).toArray();
    const csv = Buffer.concat(body as Buffer[]).toString('utf8');
    expect(csv.split('\n')[0]).toContain('Service,Type,How often');
    expect(csv).toContain('Netflix');
    expect(csv).toContain(',Cancel,');
  });

  test('makes a totals-only share card, names off by default', async ({ page }) => {
    await loadSample(page);
    await page.getByTestId('share-open').click();
    await expect(page.getByRole('img', { name: /Share card/ })).toBeVisible();
    await expect(page.getByLabel('Include the names of the services')).not.toBeChecked();
    const [download] = await Promise.all([page.waitForEvent('download'), page.getByTestId('share-download').click()]);
    expect(download.suggestedFilename()).toBe('dripcheck-share.png');
  });

  test('copy summary puts plain text on the clipboard', async ({ page, context, browserName }, info) => {
    test.skip(info.project.name === 'mobile' || browserName !== 'chromium', 'clipboard permission is desktop only');
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await loadSample(page);
    await page.getByRole('button', { name: 'Copy summary' }).click();
    await expect(page.getByText('Summary copied')).toBeVisible();
    const text = await page.evaluate(() => navigator.clipboard.readText());
    expect(text).toMatch(/recurring things/);
    expect(text).toContain('Nothing was uploaded');
  });

  test('Start over goes back to the drop zone', async ({ page }) => {
    await loadSample(page);
    await page.getByTestId('start-over').click();
    await expect(page.getByTestId('dropzone')).toBeVisible();
  });
});

test.describe('remembering choices', () => {
  test('stores nothing until asked, then only the choices, and forgets on request', async ({ page }) => {
    await loadSample(page);
    await page.getByTestId('item-row').first().getByRole('radio', { name: 'Cancel' }).click();
    expect(await page.evaluate(() => Object.keys(localStorage).filter((k) => k.startsWith('dripcheck:choices') || k === 'dripcheck:optin'))).toEqual([]);

    await page.getByTestId('remember').check();
    const stored = await page.evaluate(() => localStorage.getItem('dripcheck:choices'));
    expect(stored).toMatch(/cancel/);
    expect(stored).not.toMatch(/NETFLIX|UPI|HDFC/i);

    await page.reload();
    await page.getByTestId('sample-button').click();
    await expect.poll(() => savings(page)).toBeGreaterThan(1000);

    await page.getByTestId('forget').click();
    expect(await page.evaluate(() => localStorage.getItem('dripcheck:choices'))).toBeNull();
    expect(await page.evaluate(() => localStorage.getItem('dripcheck:optin'))).toBeNull();
  });
});

test.describe('theme and keyboard', () => {
  test('the theme toggle flips the page and is remembered', async ({ page }) => {
    await openApp(page);
    await page.getByRole('button', { name: /Switch to dark theme/ }).click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  });

  test('the whole flow works from the keyboard with visible focus', async ({ page }, info) => {
    test.skip(info.project.name === 'mobile', 'keyboard flow is a desktop concern');
    await openApp(page);
    let focused = false;
    for (let i = 0; i < 20 && !focused; i++) {
      await page.keyboard.press('Tab');
      focused = await page.getByTestId('sample-button').evaluate((el) => el === document.activeElement);
    }
    expect(focused).toBe(true);
    const ring = await page.getByTestId('sample-button').evaluate((el) => getComputedStyle(el).outlineWidth);
    expect(ring).toBe('3px');
    await page.keyboard.press('Enter');
    await expect(page.getByTestId('headline')).toContainText('recurring');

    const keep = page.getByTestId('item-row').first().getByRole('radio', { name: 'Keep' });
    await keep.focus();
    await page.keyboard.press('ArrowRight');
    await expect(page.getByTestId('item-row').first().getByRole('radio', { name: 'Cancel' })).toBeChecked();
    await expect.poll(() => savings(page)).toBeGreaterThan(1000);
  });

  test('the skip link moves focus to the content', async ({ page }, info) => {
    test.skip(info.project.name === 'mobile', 'desktop keyboard');
    await openApp(page);
    await page.keyboard.press('Tab');
    await expect(page.getByRole('link', { name: 'Skip to the content' })).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.locator('main')).toBeFocused();
  });
});

test.describe('pages', () => {
  test('privacy and guides pages load and link back', async ({ page }) => {
    await page.goto('/#/privacy');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('How we know nothing leaves your device');
    await expect(page.getByText("connect-src 'self'")).toBeVisible();
    await page.goto('/#/guides');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Cancel guides');
    await expect(page.locator('.guide-list > li')).toHaveCount(30);
    await expect(page.getByText('Not verified').first()).toBeVisible();
  });

  test('the privacy badge is on the first screen', async ({ page }) => {
    await openApp(page);
    await expect(page.getByTestId('privacy-badge')).toBeVisible();
    await expect(page.getByTestId('privacy-badge')).toHaveText('Runs on your device. Nothing is uploaded.');
  });
});
