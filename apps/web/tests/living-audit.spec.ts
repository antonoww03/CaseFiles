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

test('Living experts, confrontations and one-time decisions expose dependency and irreversible states', async ({ page, request }) => {
  const api = 'http://127.0.0.1:3001/api';
  const created = await request.post(`${api}/session`);
  expect(created.status()).toBe(201);
  const { sessionId } = await created.json() as { sessionId: string };
  const headers = { 'x-case-session': sessionId };
  for (const id of ['E02', 'E03', 'E04']) {
    const found = await request.post(`${api}/discover/${id}`, { headers, data: {} });
    expect(found.status(), `isolated fixture discovery ${id}`).toBe(200);
  }
  const e09 = await request.post(`${api}/forensics/documents/draft/inspect`, { headers, data: { pageId: 'signature' } });
  expect(e09.status()).toBe(200);
  expect((await e09.json() as { clueId: string }).clueId).toBe('E09');

  await page.addInitScript(id => localStorage.setItem('casefiles-demo-session', id), sessionId);
  await page.goto('/');
  await page.getByRole('button', { name: /Класически инструменти/ }).click();
  await page.getByRole('button', { name: /Продължи разследването/ }).click();
  await page.getByRole('button', { name: /Живо разследване/ }).click();
  const nav = page.getByRole('navigation', { name: 'Разширени разследвания' });
  await nav.getByRole('button', { name: 'Разследване' }).click();

  const medical = page.locator('.liv-card').filter({ hasText: 'Съдебномедицинска експертиза' });
  const appoint = medical.getByRole('button', { name: 'Назначи експертиза' });
  await expect(appoint).toBeEnabled();
  await expect(page.locator('.liv-card').filter({ hasText: 'Видео идентификация' }).getByRole('button')).toBeDisabled();
  await appoint.click();
  await expect(page.getByRole('status')).toContainText('Експертизата е назначена');
  const checkExpert = medical.getByRole('button', { name: 'Провери резултата' });
  await expect(checkExpert).toBeEnabled();

  const contact = page.locator('.liv-card').filter({ hasText: 'Елена ↔ телефонен регистър' });
  const invoices = page.locator('.liv-card').filter({ hasText: 'Мартин ↔ финансови документи' });
  const confront = (card: ReturnType<typeof page.locator>) => card.getByRole('button', { name: 'Съпостави показанията' });
  await expect(confront(contact)).toBeDisabled();
  await expect(confront(invoices)).toBeEnabled();

  const policies = page.locator('.liv-grid.three').last();
  const decision = (title: string) => policies.locator('.liv-card').filter({ hasText: title }).getByRole('button');
  for (const title of ['Спазвай процедурата', 'Разпространи обвинения', 'Използвай натиск']) await expect(decision(title)).toBeEnabled();
  await decision('Използвай натиск').click();
  await expect(page.getByRole('status')).toContainText('затвори една линия на разпит');
  await expect(decision('Използвай натиск')).toBeDisabled();
  await expect(invoices.getByText('ЗАТВОРЕНА ЛИНИЯ')).toBeVisible();
  await expect(confront(invoices)).toBeDisabled();

  const interview = await request.post(`${api}/interview`, {
    headers,
    data: { personId: 'elena', message: 'Какво чу по телефона?', scriptedOnly: true, interviewStyle: 'neutral' }
  });
  expect(interview.status()).toBe(200);
  await decision('Спазвай процедурата').click();
  await expect(contact.getByRole('button', { name: 'Съпостави показанията' })).toBeEnabled();
  await expect(page.locator('.liv-overview')).toContainText('50 / 100');
  await contact.getByRole('button', { name: 'Съпостави показанията' }).click();
  await expect(contact).toContainText('Елена признава разговора');
  await expect(contact.getByRole('button', { name: 'Съпостави показанията' })).toBeDisabled();

  await checkExpert.click();
  await expect(medical).toContainText('Интервалът 01:20–01:25 е приблизителен');
  await expect(medical.getByRole('button', { name: 'Готово' })).toBeDisabled();
  await decision('Разпространи обвинения').click();
  await expect(page.getByRole('status')).toContainText('намали репутацията');
  await expect(decision('Спазвай процедурата')).toBeDisabled();
  await expect(decision('Разпространи обвинения')).toBeDisabled();
  await expect(page.locator('.liv-overview')).toContainText('25 / 100');
});
