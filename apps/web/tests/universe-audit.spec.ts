import { expect, test } from '@playwright/test';

async function enterCaseOne(page: import('@playwright/test').Page) {
  await page.goto('/');
  await page.getByRole('button', { name: /Започни разследването/ }).click();
  await page.getByRole('button', { name: /Влез в разследването/ }).click();
  await page.getByRole('navigation', { name: 'Игрови раздели' }).getByRole('button', { name: 'Детективски свят' }).click();
  await expect(page.getByRole('heading', { name: 'Градът пази своите тайни.' })).toBeVisible();
}

test('Universe map travel, return-to-station gate, and main-case navigation produce their destinations', async ({ page }) => {
  await enterCaseOne(page);
  const map = page.getByRole('group', { name: 'Карта на разследването' });
  const currentStation = map.getByRole('button', { name: 'Пътувай до Полицейско управление' });
  const apartmentPin = map.getByRole('button', { name: 'Пътувай до Апартамент 407' });
  await expect(currentStation).toBeDisabled();
  await expect(apartmentPin).toBeEnabled();

  await page.route('**/api/universe/case-001/action', async route => {
    if (route.request().method() === 'POST') await new Promise(resolve => setTimeout(resolve, 350));
    await route.continue();
  });
  const travelRequest = page.waitForRequest(request => request.url().endsWith('/api/universe/case-001/action') && request.method() === 'POST');
  await apartmentPin.click();
  await travelRequest;
  await expect(apartmentPin).toBeDisabled();
  await expect(page.locator('.u17-stats')).toContainText('Апартамент 407');
  await page.unroute('**/api/universe/case-001/action');

  await page.getByRole('group', { name: 'Раздели на детективския свят' }).getByRole('button', { name: 'Партньор и задачи' }).click();
  const returnToStation = page.getByRole('button', { name: 'Към щаба' });
  await expect(returnToStation).toBeEnabled();
  await returnToStation.click();
  await expect(page.locator('.u17-stats')).toContainText('Полицейско управление');
  await expect(returnToStation).toBeDisabled();

  await page.getByRole('group', { name: 'Раздели на детективския свят' }).getByRole('button', { name: 'Интерактивен град' }).click();
  await page.getByRole('button', { name: 'Огледай основния случай' }).click();
  await expect(page.locator('.r10-stage-title h1')).toHaveText('Апартамент 407');
});

test('Universe people approach gate, conversation, map shortcut, classic interview, and wait update state', async ({ page }) => {
  await enterCaseOne(page);
  const modes = page.getByRole('group', { name: 'Раздели на детективския свят' });
  await modes.getByRole('button', { name: 'Живи заподозрени' }).click();
  const martin = page.locator('.u17-card').filter({ hasText: 'Мартин Русев' });
  const approach = martin.getByLabel('Подход към разговора');
  const talk = martin.getByRole('button', { name: 'Проведи разговор' });
  await expect(approach).toHaveValue('empathy');
  await expect(talk).toBeEnabled();
  await approach.selectOption('verify');
  await expect(martin).toContainText('Нужни са още: E04, E09');
  await expect(talk).toBeDisabled();
  await approach.selectOption('empathy');
  await expect(talk).toBeEnabled();
  await talk.click();
  await expect(martin.locator('.u17-transcript')).toContainText('Мартин признава, че конфликтът го е притеснил.');
  await expect(martin).toContainText('Разговорът е проведен');

  await page.getByRole('button', { name: 'Следващ игрови час' }).click();
  await expect(page.locator('.u17-clock')).toContainText('ХОД 2/60');
  await page.getByRole('button', { name: 'Отвори картата' }).click();
  await expect(page.getByRole('group', { name: 'Карта на разследването' })).toBeVisible();
  await modes.getByRole('button', { name: 'Живи заподозрени' }).click();
  await page.getByRole('button', { name: 'Класически разпити' }).click();
  await expect(page.getByText('РАЗПИТ / АКТИВЕН ПРОТОКОЛ')).toBeVisible();
});
