import { createHash } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { expect, test, type TestInfo } from '@playwright/test';

// Source anchors refer to the immutable, production-audited JSX snapshot:
// 46780e627ce1d776d3762aba3112e172b4d3f316.
// Format: repository-relative file:line:tag:ordinal-within-that-line-and-tag.
// Passing tests write evidence. Assertions alone do not automatically count as coverage.
const source = 'apps/web/src/Release10.tsx';
const sha = '46780e627ce1d776d3762aba3112e172b4d3f316';

function checked(info: TestInfo, line: number, tag: string, ordinal: number, action: string, assertion: string) {
  info.annotations.push({
    type: 'cf-ui-verified',
    description: JSON.stringify({
      id: `${source}:${line}:${tag}:${ordinal}`,
      action,
      assertion
    })
  });
}

test.afterEach(async ({}, info) => {
  // Failed, skipped and interrupted tests must NEVER contribute coverage evidence.
  if (info.status !== 'passed') return;
  const records = info.annotations
    .filter(a => a.type === 'cf-ui-verified' && !!a.description)
    .map(a => JSON.parse(a.description!) as { id: string; action: string; assertion: string });
  if (!records.length) return;
  const directory = resolve(process.cwd(), '../../.ui-evidence');
  mkdirSync(directory, { recursive: true });
  const name = createHash('sha256').update(info.titlePath.join('|')).digest('hex').slice(0, 20);
  writeFileSync(resolve(directory, `${name}.json`), JSON.stringify({
    baselineSha: sha,
    test: info.titlePath.join(' > '),
    status: info.status,
    verifiedAt: new Date().toISOString(),
    records
  }, null, 2));
});

test('home case selector changes the active case and survives a reload', async ({ page }, info) => {
  await page.goto('/');
  const resume = page.getByRole('button', { name: 'Продължи', exact: true });
  await expect(resume).toBeDisabled();
  checked(info, 87, 'button', 1, 'disabled-without-session', 'Continue is disabled for an unauthenticated new browser');

  await page.getByRole('button', { name: /Избери случай/ }).click();
  await expect(page.getByRole('group', { name: 'Избор на случай' })).toBeVisible();
  checked(info, 89, 'button', 2, 'open-case-selector', 'The case selection group appears');

  await page.getByRole('group', { name: 'Избор на случай' })
    .getByRole('button', { name: /Изчезналият архив/ }).click();
  await expect(page.locator('.r10-home-copy .r10-eyebrow')).toContainText('002');
  await expect.poll(() => page.evaluate(() => localStorage.getItem('cf10-selected-case'))).toBe('case-002');
  checked(info, 89, 'button', 2, 'choose-case-002', 'Visible selected case and localStorage agree');

  await page.reload();
  await expect(page.locator('.r10-home-copy .r10-eyebrow')).toContainText('002');
  checked(info, 89, 'button', 2, 'case-selection-after-reload', 'Selected case persists across a reload');
});

test('home settings are interactive and persisted independently', async ({ page }, info) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Настройки' }).click();
  const intro = page.getByLabel('Пропускай сюжетните въведения');
  const motion = page.getByLabel('Намалени анимации');
  await expect(intro).toBeVisible();
  await expect(motion).toBeVisible();
  checked(info, 89, 'button', 3, 'open-settings', 'Both setting checkboxes become available');

  await intro.check();
  await expect(intro).toBeChecked();
  await expect.poll(() => page.evaluate(() => localStorage.getItem('cf10-skip-intro'))).toBe('true');
  checked(info, 91, 'input', 1, 'enable-skip-intro', 'Checked setting is stored');

  await motion.check();
  await expect(motion).toBeChecked();
  await expect(page.locator('.r10-home')).toHaveClass(/r10-still/);
  await expect.poll(() => page.evaluate(() => localStorage.getItem('cf10-reduce-motion'))).toBe('true');
  checked(info, 91, 'input', 2, 'enable-reduced-motion', 'Reduced-motion state changes layout and storage');

  await page.reload();
  await page.getByRole('button', { name: 'Настройки' }).click();
  await expect(intro).toBeChecked();
  await expect(motion).toBeChecked();
  checked(info, 91, 'input', 1, 'skip-intro-after-reload', 'Intro preference survives reload');
  checked(info, 91, 'input', 2, 'reduce-motion-after-reload', 'Motion preference survives reload');

  await intro.uncheck();
  await motion.uncheck();
  await expect(intro).not.toBeChecked();
  await expect(motion).not.toBeChecked();
  await expect(page.locator('.r10-home')).not.toHaveClass(/r10-still/);
  checked(info, 91, 'input', 1, 'disable-skip-intro', 'Off state is interactive');
  checked(info, 91, 'input', 2, 'disable-reduced-motion', 'Off state clears reduced motion');
});

test('dossier selector changes both displayed case and stored selection', async ({ page }, info) => {
  await page.goto('/');
  const dossiers = page.locator('.r10-home-files button');
  await expect(dossiers).toHaveCount(2);
  await dossiers.nth(1).click();
  await expect(page.locator('.r10-home-copy .r10-eyebrow')).toContainText('002');
  await expect.poll(() => page.evaluate(() => localStorage.getItem('cf10-selected-case'))).toBe('case-002');
  checked(info, 90, 'button', 1, 'select-second-dossier', 'Second dossier updates selected case');

  await dossiers.nth(0).click();
  await expect(page.locator('.r10-home-copy .r10-eyebrow')).toContainText('001');
  await expect.poll(() => page.evaluate(() => localStorage.getItem('cf10-selected-case'))).toBe('case-001');
  checked(info, 90, 'button', 1, 'select-first-dossier', 'First dossier reverses case selection');
});

test('Case 001 sound toggle, room selection and navigation have observable effects', async ({ page }, info) => {
  await page.goto('/');
  await page.getByRole('button', { name: /Започни разследването/ }).click();
  await page.getByRole('button', { name: /Влез в разследването/ }).click();
  await expect(page.getByRole('heading', { name: 'Апартамент 407' })).toBeVisible();

  await page.getByRole('button', { name: 'Включи звука' }).click();
  await expect(page.getByRole('button', { name: 'Изключи звука' })).toBeVisible();
  checked(info, 183, 'button', 2, 'enable-audio', 'Accessible control updates to disable-audio state');
  await page.getByRole('button', { name: 'Изключи звука' }).click();
  await expect(page.getByRole('button', { name: 'Включи звука' })).toBeVisible();
  checked(info, 183, 'button', 2, 'disable-audio', 'Sound control returns to its default state');

  await page.locator('.r10-room-select').getByRole('button', { name: 'Работен кабинет' }).click();
  await expect(page.locator('.r10-scene-info h3')).toContainText('Работен кабинет');
  checked(info, 193, 'button', 1, 'change-room', 'The selected room heading updates');

  await page.getByRole('button', { name: 'Изследвай E04' }).click();
  await expect(page.locator('.r10-scene-info small')).toContainText('оригиналите');
  checked(info, 196, 'button', 1, 'inspect-alternate-clue', 'Room-specific clue detail appears without collection');

  const nav = page.getByRole('navigation', { name: 'Игрови раздели' });
  await nav.getByRole('button', { name: 'Досие', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Следствено досие' })).toBeVisible();
  checked(info, 185, 'button', 1, 'navigate-to-evidence', 'Evidence section is visible');

  await nav.getByRole('button', { name: 'Телефон', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Телефонът на Никола' })).toBeVisible();
  checked(info, 185, 'button', 1, 'navigate-to-phone', 'Phone section is visible');

  await nav.getByRole('button', { name: 'Разпити', exact: true }).click();
  await expect(page.getByRole('heading', { name: /Очите не лъжат/ })).toBeVisible();
  checked(info, 185, 'button', 1, 'navigate-to-interview', 'Interview section is visible');
});
