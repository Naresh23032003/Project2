import { expect, fixture, loadFiles, openApp, test } from './helpers';

const HEADLINE = /You're paying ₹[\d,]+ a year for \d+ recurring/;

test.describe('real file formats', () => {
  for (const [file, label] of [
    ['hdfc.csv', 'an HDFC style CSV'],
    ['icici.xlsx', 'an ICICI style XLSX'],
    ['sbi.xls', 'an SBI style XLS'],
    ['axis.csv', 'an Axis style CSV'],
    ['kotak.xlsx', 'a Kotak style XLSX'],
  ] as const) {
    test(`reads ${label}`, async ({ page }) => {
      await loadFiles(page, file);
      await expect(page.getByTestId('headline')).toContainText('recurring');
      await expect(page.getByTestId('headline')).toHaveText(/You're paying|We didn't find/);
    });
  }

  test('reads several files at once and merges them', async ({ page }) => {
    await loadFiles(page, 'axis.csv', 'card.csv');
    await expect(page.getByTestId('headline')).toHaveText(HEADLINE);
    await expect(page.getByTestId('item-row').filter({ hasText: 'Netflix' })).toHaveCount(1);
  });

  test('adds a second statement from the results screen', async ({ page }) => {
    await loadFiles(page, 'axis.csv');
    await expect(page.getByTestId('headline')).toBeVisible();
    await page.getByLabel('Add more statement files').setInputFiles(fixture('card.csv'));
    await expect(page.getByTestId('item-row').filter({ hasText: 'Netflix' })).toHaveCount(1);
  });

  test('reads a text PDF', async ({ page }) => {
    await loadFiles(page, 'hdfc-text.pdf');
    await expect(page.getByTestId('headline')).toHaveText(/You're paying ₹3,816 a year for 2 recurring things\./);
  });

  test('asks for a password, rejects a wrong one and opens with the right one', async ({ page }) => {
    await loadFiles(page, 'hdfc-password.pdf');
    await expect(page.getByRole('heading', { name: 'This PDF is password protected' })).toBeVisible();
    await page.getByTestId('pdf-password').fill('not it');
    await page.getByTestId('pdf-password-submit').click();
    await expect(page.getByText("That password didn't work")).toBeVisible();
    await page.getByTestId('pdf-password').fill('01011990');
    await page.getByTestId('pdf-password-submit').click();
    await expect(page.getByTestId('headline')).toHaveText(/₹3,816 a year/);
  });

  test('a password can be skipped', async ({ page }) => {
    await loadFiles(page, 'hdfc-password.pdf');
    await page.getByRole('button', { name: 'Skip this file' }).click();
    await expect(page.getByText('Needs a password')).toBeVisible();
  });

  test('explains a scanned PDF and points to the CSV route', async ({ page }) => {
    await loadFiles(page, 'scanned.pdf');
    await expect(page.getByText('A scanned PDF is a picture of a statement')).toBeVisible();
    await page.getByRole('link', { name: /how, bank by bank/i }).click();
    await expect(page.getByRole('heading', { name: 'Get a CSV or Excel statement from your bank' })).toBeVisible();
  });

  test('sends an unknown layout through column mapping', async ({ page }) => {
    await loadFiles(page, 'unknown-format.csv');
    await expect(page.getByRole('heading', { name: 'Which column is which?' })).toBeVisible();
    await expect(page.getByRole('table', { name: 'First rows of the file' })).toBeVisible();
    await page.getByTestId('mapping-submit').click();
    await expect(page.getByTestId('headline')).toHaveText(HEADLINE);
  });

  test('says plainly when a file type is not supported', async ({ page }) => {
    await openApp(page);
    await page.getByTestId('file-input').setInputFiles({ name: 'notes.docx', mimeType: 'application/octet-stream', buffer: Buffer.from('hello') });
    await expect(page.getByText('That file type is not supported')).toBeVisible();
    await expect(page.getByTestId('dropzone')).toBeVisible();
  });

  test('keeps working when some files cannot be read', async ({ page }) => {
    await loadFiles(page, 'hdfc.csv', 'scanned.pdf');
    await expect(page.getByTestId('headline')).toHaveText(HEADLINE);
    await expect(page.getByText(/1 of 2 files could not be read/)).toBeVisible();
  });

  test('a statement with nothing recurring gets an honest answer', async ({ page }) => {
    await openApp(page);
    const csv = 'Date,Description,Debit,Credit\n01/04/2024,CHAI POINT,40,\n09/04/2024,BOOK STORE,420,\n21/05/2024,TAXI,310,\n';
    await page.getByTestId('file-input').setInputFiles({ name: 'few.csv', mimeType: 'text/csv', buffer: Buffer.from(csv) });
    await expect(page.getByTestId('headline')).toHaveText("We didn't find a clear subscription.");
    await expect(page.getByText(/too few months/)).toBeVisible();
  });
});
