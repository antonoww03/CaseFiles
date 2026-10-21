import { expect, test } from '@playwright/test';

test('Living finance and court controls enforce gates, selection and accepted argumentation', async ({ page, request }) => {
  const api = 'http://127.0.0.1:3001/api';
  const created = await request.post(`${api}/session`);
  expect(created.status()).toBe(201);
  const { sessionId } = await created.json() as { sessionId: string };
  const headers = { 'x-case-session': sessionId };

  for (const id of ['E01', 'E03', 'E04', 'E05']) {
    const found = await request.post(`${api}/discover/${id}`, { headers, data: {} });
    expect(found.status(), `isolated fixture discovery ${id}`).toBe(200);
  }
  for (const [document, pageId, clueId] of [['draft', 'signature', 'E09'], ['access', 'record', 'E10']] as const) {
    const inspected = await request.post(`${api}/forensics/documents/${document}/inspect`, { headers, data: { pageId } });
    expect(inspected.status(), `fixture forensic extraction ${clueId}`).toBe(200);
    expect((await inspected.json() as { clueId: string }).clueId).toBe(clueId);
  }
  for (const id of ['office', 'basement']) {
    const warrant = await request.post(`${api}/living/action`, { headers, data: { kind: 'warrant', id } });
    expect(warrant.status(), `fixture warrant ${id}`).toBe(200);
  }
  for (let i = 0; i < 2; i++) {
    const expert = await request.post(`${api}/living/action`, { headers, data: { kind: 'expert', id: 'financial' } });
    expect(expert.status()).toBe(200);
  }

  await page.addInitScript(id => localStorage.setItem('casefiles-demo-session', id), sessionId);
  await page.goto('/');
  await page.getByRole('button', { name: /Класически инструменти/ }).click();
  await page.getByRole('button', { name: /Продължи разследването/ }).click();
  await page.getByRole('button', { name: /Живо разследване/ }).click();
  await page.getByRole('navigation', { name: 'Разширени разследвания' }).getByRole('button', { name: 'Финанси и съд' }).click();

  const transaction = page.locator('.liv-transfer').filter({ hasText: /€4800/ });
  const inspect = transaction.getByRole('button', { name: 'Изследвай' });
  await expect(transaction).toContainText('Детайлите изискват служебно разрешение.');
  await expect(inspect).toBeEnabled();
  await inspect.click();
  await expect(transaction).toContainText('Плащане без посочено приложение към фактурата.');
  await expect(transaction).toContainText('Необичаен поток');
  await expect(transaction.getByRole('button', { name: 'Анализирано' })).toBeDisabled();

  const court = page.locator('.liv-court');
  const financialRoute = court.getByRole('button', { name: 'Финансов мотив' });
  const temporalRoute = court.getByRole('button', { name: 'Времева реконструкция' });
  await expect(financialRoute).toHaveClass(/active/);
  await temporalRoute.click();
  await expect(temporalRoute).toHaveClass(/active/);
  await expect(financialRoute).not.toHaveClass(/active/);
  await financialRoute.click();
  await expect(financialRoute).toHaveClass(/active/);

  const rows = court.locator('.liv-evidence-picker label');
  await expect(rows).toHaveCount(6);
  const fixtureEvidenceIds = ['E01', 'E03', 'E04', 'E05', 'E09', 'E10'];
  await expect(rows.locator('strong')).toHaveText(fixtureEvidenceIds);
  const checkbox = (id: string) => rows.nth(fixtureEvidenceIds.indexOf(id)).locator('input[type="checkbox"]');
  const present = court.getByRole('button', { name: 'Представи аргументацията' });
  await expect(present).toBeDisabled();
  await checkbox('E04').check();
  await checkbox('E09').check();
  await expect(present).toBeDisabled();
  await checkbox('E05').check();
  await expect(present).toBeEnabled();
  await checkbox('E05').uncheck();
  await expect(present).toBeDisabled();
  await checkbox('E10').check();
  await expect(present).toBeEnabled();
  await present.click();
  await expect(court.locator('.liv-verdict')).toContainText('Приети доказателства');
  await expect(court.locator('.liv-verdict')).toContainText(/финансовия път/);
});
