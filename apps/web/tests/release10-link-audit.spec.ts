import { expect, test } from '@playwright/test';

test('Release 1.0 evidence link controls enforce empty, duplicate, invalid, loading and confirmed states', async ({ page, request }) => {
  const api = 'http://127.0.0.1:3001/api';
  const created = await request.post(`${api}/session`);
  expect(created.status()).toBe(201);
  const { sessionId } = await created.json() as { sessionId: string };
  const headers = { 'x-case-session': sessionId };
  for (const id of ['E01', 'E04']) {
    const response = await request.post(`${api}/discover/${id}`, { headers, data: {} });
    expect(response.status(), `isolated fixture discovery ${id}`).toBe(200);
  }
  const document = await request.post(`${api}/forensics/documents/draft/inspect`, {
    headers,
    data: { pageId: 'signature' }
  });
  expect(document.status()).toBe(200);
  expect((await document.json() as { clueId: string }).clueId).toBe('E09');

  await page.addInitScript(id => {
    localStorage.setItem('casefiles-demo-session', id);
    localStorage.setItem('cf10-selected-case', 'case-001');
    localStorage.setItem('cf10-skip-intro', 'true');
  }, sessionId);
  const restored = page.waitForResponse(response => response.url().endsWith('/api/session') && response.request().method() === 'GET' && response.status() === 200);
  await page.goto('/');
  await restored;
  await page.getByRole('button', { name: 'Продължи' }).click();
  const nav = page.getByRole('navigation', { name: 'Игрови раздели' });
  await nav.getByRole('button', { name: 'Досие' }).click();
  await expect(page.getByRole('heading', { name: 'Следствено досие' })).toBeVisible();

  const first = page.getByRole('combobox', { name: 'Първо доказателство' });
  const second = page.getByRole('combobox', { name: 'Второ доказателство' });
  const verify = page.getByRole('button', { name: 'Провери връзката' });
  await expect(first).toHaveValue('');
  await expect(second).toHaveValue('');
  await expect(verify).toBeDisabled();

  await first.selectOption('E04');
  await second.selectOption('E04');
  await expect(verify).toBeDisabled();
  await second.selectOption('E01');
  await expect(verify).toBeEnabled();
  await verify.click();
  await expect(page.getByRole('status')).toContainText('Няма доказуема връзка между тези две улики');

  await second.selectOption('E09');
  await page.route('**/api/deductions', async route => {
    if (route.request().method() === 'POST') {
      const body = route.request().postDataJSON() as { firstId?: string; secondId?: string };
      if (body.firstId === 'E04' && body.secondId === 'E09') await new Promise(resolve => setTimeout(resolve, 450));
    }
    await route.continue();
  });
  const pending = page.waitForRequest(req => req.url().endsWith('/api/deductions') && req.method() === 'POST');
  await verify.click();
  await pending;
  await expect(verify).toBeDisabled();
  await expect(page.getByRole('status')).toContainText('Потвърдена логическа връзка: Финансов мотив');
  await expect(page.locator('.r10-known-links')).toContainText('D01 / Финансов мотив');
});
