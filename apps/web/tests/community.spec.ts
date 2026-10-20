import { test, expect } from '@playwright/test';

test('community lobby, randomized room and join by invitation code',async({page,browser})=>{
  await page.goto('/');
  await page.getByRole('button',{name:/Екипна игра \/ нови случаи/}).click();
  await expect(page.getByRole('heading',{name:'Общност на детективите'})).toBeVisible();
  await page.getByRole('button',{name:/Генерирай нов случай/}).click();
  await expect(page.getByRole('heading',{name:/Изчезналата експозиция|Сянка в архива|Последният протокол|Тайният инвентар/})).toBeVisible();
  const header=await page.locator('.community-room-title small').innerText();
  const code=header.split(':')[1]?.trim()||'';
  expect(code).toMatch(/^[A-F0-9]{10}$/);
  const guest=await browser.newContext();
  try{
    const other=await guest.newPage();
    await other.goto('/');
    await other.getByRole('button',{name:/Екипна игра \/ нови случаи/}).click();
    await other.getByRole('textbox',{name:'Име на детектива'}).fill('Гост детектив');
    await other.getByPlaceholder(/A1B2C3D4E5/).fill(code);
    await other.getByRole('button',{name:/Влез в разследването/}).click();
    await expect(other.getByText('Гост детектив')).toBeVisible();
    await page.locator('.community-clues button').first().click();
    await expect.poll(async()=>{
      await other.locator('.community-team button').click();
      return await other.locator('.community-clues article.discovered').count();
    },{timeout:15000}).toBe(1);
  }finally{await guest.close();}
});

test('community editor and detective profile are usable without game session',async({page})=>{
  await page.goto('/');
  await page.getByRole('button',{name:/Екипна игра \/ нови случаи/}).click();
  await page.getByRole('button',{name:'Профил'}).click();
  await page.getByRole('button',{name:'Създай профил'}).click();
  await expect(page.getByText(/Ниво 1/)).toBeVisible();
  await page.getByRole('button',{name:'Редактор'}).click();
  await expect(page.getByRole('heading',{name:/Създай и публикувай/})).toBeVisible();
  await page.getByRole('button',{name:/Публикувай в общността/}).click();
  await expect(page.getByText(/Публикуван случай/)).toBeVisible();
  await expect(page.getByText('Мистерията на нощния архив',{exact:true}).first()).toBeVisible();
});
