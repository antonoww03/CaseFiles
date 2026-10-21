import { expect, test } from '@playwright/test';

test('Case 002 interview becomes actionable after two clues and reveals the selected alibi', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /Избери случай/ }).click();
  await page.getByRole('group', { name: 'Избор на случай' }).getByRole('button', { name: /Изчезналият архив/ }).click();
  await page.getByRole('button', { name: /Започни разследването/ }).click();
  await page.getByRole('button', { name: /Влез в разследването/ }).click();

  const collect = async (room: string, hotspot: string) => {
    await page.getByRole('button', { name: room, exact: true }).click();
    await page.getByRole('button', { name: hotspot }).click();
    await page.getByRole('button', { name: /Събери улика/ }).click();
  };

  await collect('Читалня', 'Изследвай Читалня'); // C1
  await collect('Сървърна', 'Изследвай Сървърна'); // C2

  const nav = page.getByRole('navigation', { name: 'Игрови раздели' });
  await nav.getByRole('button', { name: 'Разпити' }).click();
  const ask = page.getByRole('button', { name: 'Задай въпрос' });
  await expect(ask).toBeEnabled();
  await ask.click();

  // The default Case 002 suspect is Boris; a successful click must call the API
  // and replace the idle prompt with his server-provided alibi.
  await expect(page.getByText(/Твърди, че е напуснал архива преди полунощ/)).toBeVisible();

  await nav.getByRole('button', { name: /Местопрестъпление/ }).click();
  await collect('Пост охрана', 'Изследвай Пост охрана'); // C3
  await collect('Сервизен коридор', 'Изследвай Сервизен коридор'); // C4
  await collect('Служебен асансьор', 'Изследвай Служебен асансьор'); // C5
  await collect('Реставрационно ателие', 'Изследвай Реставрационно ателие'); // C6

  await nav.getByRole('button', { name: 'Криминалистика' }).click();
  const lock = page.locator('.r10-puzzle').filter({ hasText: 'Сервизният код' });
  await lock.getByRole('textbox', { name: 'Отговор за Сервизният код' }).fill('2339');
  await lock.getByRole('button', { name: 'Провери' }).click();
  await expect(lock.getByText('✓ Потвърден анализ')).toBeVisible();

  const film = page.locator('.r10-puzzle').filter({ hasText: 'Два кадъра' });
  await film.getByRole('textbox', { name: 'Отговор за Два кадъра' }).fill('2347-2352');
  await film.getByRole('button', { name: 'Провери' }).click();
  await expect(film.getByText('✓ Потвърден анализ')).toBeVisible();

  const ledger = page.locator('.r10-puzzle').filter({ hasText: 'Следата на договора' });
  await ledger.getByRole('combobox', { name: 'Отговор за Следата на договора' }).selectOption('boris');
  await ledger.getByRole('button', { name: 'Провери' }).click();
  await expect(ledger.getByText('✓ Потвърден анализ')).toBeVisible();

  await nav.getByRole('button', { name: 'Финал' }).click();
  const suspect = page.getByRole('combobox', { name: 'Обвинен заподозрян' });
  await expect(suspect).toBeVisible();
  await expect(suspect).toHaveValue('boris');
  await suspect.selectOption('raya');
  await expect(suspect).toHaveValue('raya');

  const accuse = page.getByRole('button', { name: 'Подай окончателно обвинение' });
  await expect(accuse).toBeDisabled();
  for (const clue of ['C2', 'C3', 'C4', 'C6']) {
    await page.getByRole('checkbox', { name: new RegExp(`^${clue} —`) }).check();
  }
  await expect(accuse).toBeEnabled();
  await accuse.click();
  await expect(page.getByRole('status')).toContainText('Обвинението е оспорено');

  await suspect.selectOption('boris');
  await accuse.click();
  await expect(page.getByRole('heading', { name: 'Разследването е приключено' })).toBeVisible();
  await expect(page.getByText('CASE CLOSED / CONTESTED')).toBeVisible();
});

test('Case 002 mobile navigation opens, selects a section, and closes after navigation', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.getByRole('button', { name: /Избери случай/ }).click();
  await page.getByRole('group', { name: 'Избор на случай' }).getByRole('button', { name: /Изчезналият архив/ }).click();
  await page.getByRole('button', { name: /Започни разследването/ }).click();
  await page.getByRole('button', { name: /Влез в разследването/ }).click();

  const toggle = page.getByRole('button', { name: 'Игрова навигация' });
  const nav = page.getByRole('navigation', { name: 'Игрови раздели' });
  await expect(toggle).toBeVisible();
  await toggle.click();
  await expect(nav).toHaveClass(/open/);
  await nav.getByRole('button', { name: 'Детективски свят' }).click();
  await expect(page.getByRole('heading', { name: 'Градът пази своите тайни.' })).toBeVisible();
  await expect(nav).not.toHaveClass(/open/);
});
