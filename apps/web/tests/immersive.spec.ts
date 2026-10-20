import { test, expect } from '@playwright/test';

test('immersive inventory unlocks the drawer with collected key', async ({ page }) => {
  const pageErrors: string[] = [];
  page.on('pageerror', err => pageErrors.push(err.message));
  await page.goto('/');
 await page.getByRole('button',{name:/Класически инструменти/}).click();
  await page.getByRole('button', { name: /Започни разследването/ }).click();
  await page.getByRole('button', { name: /Интерактивно разследване/ }).click();
  await expect(page.getByRole('heading', { name: 'Интерактивно разследване' })).toBeVisible();
  await page.getByRole('button', { name: 'Разгледай Изтривалка' }).click();
  await expect(page.getByRole('dialog', { name: 'Изтривалка' })).toBeVisible();
  await page.getByRole('dialog').getByRole('button', { name: 'Изследвай' }).click();
  await expect(page.getByRole('button', { name: /Месингов ключ/ })).toBeVisible();
  await page.getByRole('button', { name: /Работен кът/ }).click();
  await page.getByRole('button', { name: 'Разгледай Заключено чекмедже' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Изследвай' }).click();
  await expect(page.getByRole('button', { name: /Фото негатив/ })).toBeVisible();
  expect(pageErrors).toEqual([]);
});

test('police terminal hides records until evidence is discovered', async ({ page }) => {
  await page.goto('/');
 await page.getByRole('button',{name:/Класически инструменти/}).click();
  await page.getByRole('button', { name: /Започни разследването/ }).click();
  await page.getByRole('button', { name: /Интерактивно разследване/ }).click();
  await page.getByRole('button', { name: /Полицейски компютър/ }).click();
  await page.getByRole('textbox', { name: /Търсене в полицейския архив/ }).fill('фактури');
  await page.getByRole('button', { name: /Търси/ }).click();
  await expect(page.getByText('Няма съвпадение сред отключените записи.')).toBeVisible();
  await expect(page.getByText('Проверка на оригинални фактури')).toHaveCount(0);
});

test('mobile menu navigates to immersive investigation', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
 await page.getByRole('button',{name:/Класически инструменти/}).click();
  await page.getByRole('button', { name: /Отвори навигацията/ }).click();
  await page.getByRole('button', { name: /Интерактивно разследване/ }).click();
  await expect(page.getByRole('heading', { name: 'Интерактивно разследване' })).toBeVisible();
  await expect(page.getByText('Необходимо е активно разследване')).toBeVisible();
});
