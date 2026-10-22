import { expect, test } from '@playwright/test';

test('Case 002 interview suspect selection follows clue gates and returns the selected alibi', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /Избери случай/ }).click();
  await page.getByRole('group', { name: 'Избор на случай' }).getByRole('button', { name: /Изчезналият архив/ }).click();
  await page.getByRole('button', { name: /Започни разследването/ }).click();
  await page.getByRole('button', { name: /Влез в разследването/ }).click();

  const nav = page.locator('.r10-navigation');
  await nav.getByRole('button', { name: 'Разпити' }).click();
  const cards = page.locator('.r10-suspects');
  const ask = page.getByRole('button', { name: 'Задай въпрос' });
  const boris = cards.getByRole('button', { name: /Борис Генов/ });
  const raya = cards.getByRole('button', { name: /Рая Милева/ });
  const teodor = cards.getByRole('button', { name: /Теодор Колев/ });
  await expect(boris).toHaveClass(/active/);
  await expect(raya).not.toHaveClass(/active/);
  await expect(teodor).not.toHaveClass(/active/);
  await expect(ask).toBeDisabled();

  await raya.click();
  await expect(raya).toHaveClass(/active/);
  await expect(page.locator('.r10-interview-form h3')).toHaveText('Рая Милева');
  await expect(ask).toBeDisabled();

  const collect = async (room: string, hotspot: string) => {
    await nav.getByRole('button', { name: /Местопрестъпление/ }).click();
    await page.getByRole('button', { name: room, exact: true }).click();
    await page.getByRole('button', { name: hotspot }).click();
    await page.getByRole('button', { name: /Събери улика/ }).click();
    await expect(page.getByRole('button', { name: 'Открито' })).toBeDisabled();
  };
  await collect('Читалня', 'Изследвай Читалня');
  await nav.getByRole('button', { name: 'Разпити' }).click();
  await expect(ask).toBeDisabled();
  await collect('Сървърна', 'Изследвай Сървърна');
  await nav.getByRole('button', { name: 'Разпити' }).click();
  await expect(ask).toBeEnabled();

  await teodor.click();
  await expect(teodor).toHaveClass(/active/);
  await expect(raya).not.toHaveClass(/active/);
  await expect(page.locator('.r10-interview-form h3')).toHaveText('Теодор Колев');
  await ask.click();
  await expect(page.locator('.r10-interview-form')).toContainText('Поддържал е сървъра от другия край на сградата.');

  await raya.click();
  await expect(raya).toHaveClass(/active/);
  await expect(page.locator('.r10-interview-form')).not.toContainText('Поддържал е сървъра от другия край на сградата.');
  await ask.click();
  await expect(page.locator('.r10-interview-form')).toContainText('Била е в реставрационното ателие до 23:30; протоколът има пропуснат час.');
});
