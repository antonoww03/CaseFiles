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

  const nav = page.locator('.r10-navigation');
  await nav.getByRole('button', { name: 'Разпити' }).click();
  await expect(page.getByRole('textbox', { name: 'Въпрос към заподозрения' })).toHaveCount(0);
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

  // Four clues and three selected evidence items are insufficient until two
  // independent archive puzzles are server-confirmed as solved.
  await nav.getByRole('button', { name: 'Финал' }).click();
  const accuse = page.getByRole('button', { name: 'Подай окончателно обвинение' });
  const evidence = (clue: string) => page.getByRole('checkbox', { name: new RegExp(`^${clue} —`) });
  await evidence('C2').check();
  await evidence('C3').check();
  await evidence('C4').check();
  await expect(accuse).toBeDisabled();

  await nav.getByRole('button', { name: 'Криминалистика' }).click();
  const lock = page.locator('.r10-puzzle').filter({ hasText: 'Сервизният код' });
  await lock.getByRole('textbox', { name: 'Отговор за Сервизният код' }).fill('2339');
  await lock.getByRole('button', { name: 'Провери' }).click();
  await expect(lock.getByText('✓ Потвърден анализ')).toBeVisible();
  await nav.getByRole('button', { name: 'Финал' }).click();
  await expect(accuse).toBeDisabled();

  await nav.getByRole('button', { name: 'Криминалистика' }).click();
  const film = page.locator('.r10-puzzle').filter({ hasText: 'Два кадъра' });
  await film.getByRole('textbox', { name: 'Отговор за Два кадъра' }).fill('2347-2352');
  await film.getByRole('button', { name: 'Провери' }).click();
  await expect(film.getByText('✓ Потвърден анализ')).toBeVisible();
  await nav.getByRole('button', { name: 'Финал' }).click();
  await expect(accuse).toBeEnabled();

  await nav.getByRole('button', { name: 'Криминалистика' }).click();

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

  // The dependency gate above left three checked items; reset to the original
  // zero-selection state before reusing the threshold assertions below.
  await evidence('C2').uncheck();
  await evidence('C3').uncheck();
  await evidence('C4').uncheck();
  await expect(accuse).toBeDisabled();
  await evidence('C2').check();
  await evidence('C3').check();
  await expect(accuse).toBeDisabled();
  await evidence('C4').check();
  await expect(accuse).toBeEnabled();
  await evidence('C6').check();
  await evidence('C4').uncheck();
  await expect(accuse).toBeEnabled();
  await evidence('C4').check();
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
  const nav = page.locator('.r10-navigation');
  await expect(toggle).toBeVisible();
  await toggle.click();
  await expect(nav).toHaveClass(/open/);
  await nav.getByRole('button', { name: 'Детективски свят' }).click();
  await expect(page.getByRole('heading', { name: 'Градът пази своите тайни.' })).toBeVisible();
  await expect(nav).not.toHaveClass(/open/);
});

test('Evidence Board supports clue dragging, server-confirmed pairs, and invalid-pair feedback', async ({ page, request }) => {
  const api = 'http://127.0.0.1:3001/api';
  const created = await request.post(`${api}/session`);
  expect(created.status()).toBe(201);
  const { sessionId } = await created.json() as { sessionId: string };
  const headers = { 'x-case-session': sessionId };
  for (const id of ['E01', 'E03']) {
    const result = await request.post(`${api}/discover/${id}`, { headers, data: {} });
    expect(result.status(), `local test fixture discovery ${id}`).toBe(200);
  }
  const interview = await request.post(`${api}/interview`, {
    headers,
    data: { personId: 'elena', message: 'Какво чу по телефона?', scriptedOnly: true, interviewStyle: 'neutral' }
  });
  expect(interview.status()).toBe(200);
  expect((await interview.json() as { found: string[] }).found).toContain('E11');

  await page.addInitScript(id => localStorage.setItem('casefiles-demo-session', id), sessionId);
  const restored = page.waitForResponse(response => response.url().endsWith('/api/session') && response.request().method() === 'GET' && response.status() === 200);
  await page.goto('/');
  await restored;
  await page.getByRole('button', { name: /Класически инструменти/ }).click();
  await page.getByRole('navigation', { name: 'Навигация по разследването' })
    .getByRole('button', { name: /Връзки/ })
    .click();
  await expect(page.getByRole('heading', { name: 'Визуална дъска' })).toBeVisible();

  const board = page.locator('.v03-board');
  const pin = (id: string) => board.locator('.v03-board-pin').filter({ hasText: new RegExp(`^${id} ·`) });
  const verify = board.getByRole('button', { name: 'Провери логиката' });
  await expect(pin('E01')).toBeVisible();
  await expect(pin('E03')).toBeVisible();
  await expect(pin('E11')).toBeVisible();
  await expect(verify).toBeDisabled();

  await pin('E03').dragTo(pin('E11'));
  await expect(board.locator('.v03-board-pin.selected')).toHaveCount(2);
  await expect(verify).toBeEnabled();
  await verify.click();
  await expect(board.getByRole('status')).toContainText('Установена връзка: Противоречие в показанията');
  await expect(board.locator('.v03-board-toolbar')).toContainText('3 КАРТИ / 1 ВРЪЗКИ');

  await pin('E01').click();
  await pin('E03').click();
  await verify.click();
  await expect(board.getByRole('status')).toContainText('Няма доказуема връзка между тези две улики');
});

test('Case 002 suspect interviews recover from error and expose each scripted alibi', async ({ page, request }) => {
  const api = 'http://127.0.0.1:3001/api';
  const created = await request.post(`${api}/session`);
  expect(created.status()).toBe(201);
  const { sessionId } = await created.json() as { sessionId: string };
  const headers = { 'x-case-session': sessionId };
  for (const id of ['C1', 'C2']) {
    const result = await request.post(`${api}/living/case/action`, {
      headers,
      data: { caseId: 'case-002', action: 'discover', id }
    });
    expect(result.status(), `local Case 002 fixture discovery ${id}`).toBe(200);
  }

  await page.addInitScript(id => {
    localStorage.setItem('casefiles-demo-session', id);
    localStorage.setItem('cf10-selected-case', 'case-002');
    localStorage.setItem('cf10-skip-intro', 'true');
  }, sessionId);
  const restored = page.waitForResponse(response => response.url().endsWith('/api/session') && response.request().method() === 'GET' && response.status() === 200);
  await page.goto('/');
  await restored;
  await page.getByRole('button', { name: 'Продължи' }).click();
  const nav = page.locator('.r10-navigation');
  await nav.getByRole('button', { name: 'Разпити' }).click();
  const ask = page.getByRole('button', { name: 'Задай въпрос' });
  await expect(ask).toBeEnabled();

  let injectedFailure = false;
  let delayedSuccess = false;
  await page.route('**/api/living/case/action', async route => {
    const body = route.request().postDataJSON() as { action?: string };
    if (body.action !== 'interview') return route.continue();
    if (!injectedFailure) {
      injectedFailure = true;
      return route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ error: 'Тестова временна грешка.' }) });
    }
    if (!delayedSuccess) {
      delayedSuccess = true;
      await new Promise(resolve => setTimeout(resolve, 450));
    }
    return route.continue();
  });

  const raya = page.getByRole('button', { name: /Рая Милева/ });
  await raya.click();
  await expect(raya).toHaveClass(/active/);
  await ask.click();
  await expect(page.getByRole('status')).toContainText('Тестова временна грешка.');

  const rayaRequest = page.waitForRequest(req => req.url().endsWith('/api/living/case/action') && req.method() === 'POST');
  await ask.click();
  const pending = await rayaRequest;
  await expect(ask).toBeDisabled();
  await expect(page.getByText('Била е в реставрационното ателие до 23:30; протоколът има пропуснат час.')).toBeVisible();

  const teodor = page.getByRole('button', { name: /Теодор Колев/ });
  await teodor.click();
  await expect(teodor).toHaveClass(/active/);
  await expect(page.getByText('Била е в реставрационното ателие до 23:30; протоколът има пропуснат час.')).toHaveCount(0);
  await ask.click();
  await expect(page.getByText('Поддържал е сървъра от другия край на сградата.')).toBeVisible();

  const boris = page.getByRole('button', { name: /Борис Генов/ });
  await boris.click();
  await expect(boris).toHaveClass(/active/);
  await ask.click();
  await expect(page.getByText('Твърди, че е напуснал архива преди полунощ и не е имал достъп до фонда.')).toBeVisible();
  expect(pending.postDataJSON()).toMatchObject({ caseId: 'case-002', action: 'interview', id: 'raya' });
});

test('Forensic workbench verifies video frames and gates document pages on discovered clues', async ({ page, request }) => {
  const api = 'http://127.0.0.1:3001/api';
  const created = await request.post(`${api}/session`);
  expect(created.status()).toBe(201);
  const { sessionId } = await created.json() as { sessionId: string };
  const headers = { 'x-case-session': sessionId };
  const clue = await request.post(`${api}/discover/E04`, { headers, data: {} });
  expect(clue.status()).toBe(200);

  await page.addInitScript(id => {
    localStorage.setItem('casefiles-demo-session', id);
    localStorage.setItem('cf10-selected-case', 'case-001');
    localStorage.setItem('cf10-skip-intro', 'true');
  }, sessionId);
  const restored = page.waitForResponse(response => response.url().endsWith('/api/session') && response.request().method() === 'GET' && response.status() === 200);
  await page.goto('/');
  await restored;
  await page.getByRole('button', { name: 'Продължи' }).click();
  const nav = page.locator('.r10-navigation');
  await nav.getByRole('button', { name: 'Криминалистика' }).click();

  const lab = page.locator('.f04-lab');
  const seek = lab.locator('#f04-video-seek');
  const detail = lab.getByLabel('НАБЛЮДАВАН ДЕТАЙЛ');
  const analyze = lab.getByRole('button', { name: 'Потвърди наблюдението' });
  await expect(lab.getByText('01:10:00')).toBeVisible();
  await expect(analyze).toBeDisabled();
  await seek.focus();
  await seek.press('ArrowRight');
  await expect(lab.getByText('01:11:00')).toBeVisible();
  await detail.selectOption('врати');
  await expect(analyze).toBeEnabled();
  await analyze.click();
  await expect(lab.getByRole('status')).toContainText('Това наблюдение не е достатъчно');

  await seek.press('ArrowRight');
  await expect(lab.getByText('01:12:00')).toBeVisible();
  await lab.getByRole('button', { name: 'Назад с един кадър' }).click();
  await expect(lab.getByText('01:11:00')).toBeVisible();
  await lab.getByRole('button', { name: 'Напред с един кадър' }).click();
  await expect(lab.getByText('01:12:00')).toBeVisible();
  await detail.selectOption('презрамка');
  await analyze.click();
  await expect(lab.getByRole('status')).toContainText('добавено в досието');
  await expect(lab.getByRole('button', { name: /Камера 04/ }).locator('.f04-dot')).toHaveClass(/done/);

  await lab.getByRole('button', { name: 'Анализ на документи' }).click();
  const draft = lab.getByRole('button', { name: /Чернова на финансов сигнал/ });
  const access = lab.getByRole('button', { name: /Регистър на временните пропуски/ });
  await expect(draft).toBeEnabled();
  await expect(access).toBeDisabled();
  await draft.click();
  await lab.getByRole('button', { name: /СТР\. 3/ }).click();
  await expect(lab.getByRole('heading', { name: 'Бележка под линия' })).toBeVisible();
  await lab.getByRole('button', { name: 'Анализирай страницата' }).click();
  await expect(lab.getByRole('status')).toContainText('Разчетена ключова следа E09');

  const unlock = await request.post(`${api}/discover/E05`, { headers, data: {} });
  expect(unlock.status()).toBe(200);
  await lab.getByRole('button', { name: 'Видеозаписи' }).click();
  await lab.getByRole('button', { name: /Камера 01 — вход/ }).click();
  await seek.focus();
  await seek.press('ArrowRight');
  await seek.press('ArrowRight');
  await expect(lab.getByText('01:29:00')).toBeVisible();
  await detail.selectOption('презрамка');
  await analyze.click();
  await expect(lab.getByRole('status')).toContainText('добавено в досието');

  await lab.getByRole('button', { name: 'Анализ на документи' }).click();
  await expect(access).toBeEnabled();
  await access.click();
  await lab.getByRole('button', { name: /СТР\. 2/ }).click();
  await expect(lab.getByRole('heading', { name: 'Регистър' })).toBeVisible();
  await lab.getByRole('button', { name: 'Анализирай страницата' }).click();
  await expect(lab.getByRole('status')).toContainText('Разчетена ключова следа E10');
});

test('Legacy Case 002 gates clues and interview, then validates selected evidence and suspect', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /Класически инструменти/ }).click();
  await page.getByRole('button', { name: /Започни разследването/ }).click();
  await page.getByRole('button', { name: /Живо разследване/ }).click();
  await page.getByRole('button', { name: /Библиотека със случаи/ }).click();
  const caseCard = page.locator('.liv-case').filter({ hasText: 'Изчезналият архив' });
  await caseCard.click();
  await expect(page.getByText('Открити следи: 0/6')).toBeVisible();

  const clue = (id: string) => page.locator('.liv-card').filter({ hasText: new RegExp(`^${id} ·`) });
  const investigate = (id: string) => clue(id).getByRole('button', { name: 'Изследвай материала' });
  await expect(investigate('C4')).toBeDisabled();
  const accusation = page.getByRole('button', { name: 'Обвини заподозрения' });
  await expect(accusation).toBeDisabled();
  await investigate('C2').click();
  await investigate('C3').click();
  await expect(page.getByText('Открити следи: 2/6')).toBeVisible();
  await expect(investigate('C4')).toBeEnabled();

  const raya = page.locator('.liv-grid.three .liv-card').filter({ hasText: 'Рая Милева' });
  await expect(raya.getByRole('button', { name: 'Попитай за алибито' })).toBeEnabled();
  await raya.getByRole('button', { name: 'Попитай за алибито' }).click();
  await expect(raya).toContainText('Била е в реставрационното ателие до 23:30');
  await investigate('C4').click();

  const suspect = page.getByRole('combobox', { name: 'Посочи заподозрян' });
  await suspect.selectOption('boris');
  const court = page.locator('.liv-court');
  const evidenceRows = court.locator('.liv-evidence-picker label');
  await expect(evidenceRows).toHaveCount(3);
  await expect(evidenceRows.locator('strong').nth(0)).toHaveText('C2');
  await expect(evidenceRows.locator('strong').nth(1)).toHaveText('C3');
  await expect(evidenceRows.locator('strong').nth(2)).toHaveText('C4');
  for (const id of ['C2', 'C3', 'C4']) {
    const index = ['C2', 'C3', 'C4'].indexOf(id);
    await evidenceRows.nth(index).locator('input[type="checkbox"]').check();
  }
  await expect(accusation).toBeEnabled();
  await accusation.click();
  await expect(court.locator('.liv-verdict')).toContainText('Случаят е разрешен');
  await expect(court.locator('.liv-verdict')).toContainText(/Борис/);
});

