import { test, expect } from '@playwright/test';

test('CASEFILES exposes solo cases and no multiplayer room endpoints', async ({ page, request }) => {
  await page.goto('/');
  await expect(page.getByRole('button', { name: /Екипна игра|Екипно разследване|Присъедини се към приятели/ })).toHaveCount(0);
  await expect(page.getByRole('button', { name: /Започни разследването/ })).toBeVisible();
  await page.getByRole('button', { name: 'Избери случай' }).click();
  const picker = page.getByRole('group', { name: 'Избор на случай' });
  await expect(picker.getByRole('button', { name: /CASE 001/ })).toBeVisible();
  await expect(picker.getByRole('button', { name: /CASE 002/ })).toBeVisible();

  const status = await request.get('http://127.0.0.1:3001/api/community/status');
  expect(status.status()).toBe(404);
  const rooms = await request.get('http://127.0.0.1:3001/api/community/rooms');
  expect(rooms.status()).toBe(404);
});
