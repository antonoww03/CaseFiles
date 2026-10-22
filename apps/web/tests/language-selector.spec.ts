import {test,expect} from '@playwright/test';

test('six choices, English UI, Bulgarian preserved and preference persists',async({page})=>{
 await page.goto('/');
 const picker=page.getByRole('combobox',{name:'Избери език'});
 await expect(picker.locator('option')).toHaveCount(6);
 await picker.selectOption('en');
 await expect(page.getByRole('heading',{name:/The truth is/})).toBeVisible();
 await expect(page.getByRole('button',{name:/Start investigation/})).toBeVisible();
 await expect(page.locator('html')).toHaveAttribute('lang','en');
 await page.reload();
 await expect(page.getByRole('combobox',{name:'Choose language'})).toHaveValue('en');
 await expect(page.getByRole('heading',{name:/The truth is/})).toBeVisible();
 await page.getByRole('combobox',{name:'Choose language'}).selectOption('bg');
 await expect(page.getByRole('heading',{name:/Истината е/})).toBeVisible();
 await expect(page.locator('html')).toHaveAttribute('lang','bg');
 for(const [code,button] of [['de','Ermittlung starten'],['fr',"Commencer l'enquête"],['pl','Rozpocznij śledztwo'],['es','Iniciar investigación']] as const){
  await page.locator('.cf-language-selector select').selectOption(code);
  await expect(page.getByRole('button',{name:button})).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('lang',code);
 }
});

test('changing language during investigation does not discard discovered evidence',async({page})=>{
 await page.goto('/');
 await page.getByRole('combobox',{name:'Избери език'}).selectOption('en');
 await page.getByRole('button',{name:/Start investigation/}).click();
 await page.getByRole('button',{name:'Join investigation'}).click();
 await expect(page.getByRole('heading',{name:'Apartment 407'})).toBeVisible();
 await page.getByRole('button',{name:'Inspect E01'}).click();
 await page.getByRole('button',{name:'Collect evidence'}).click();
 await expect(page.getByText('1 CLUES')).toBeVisible();
 await page.locator('.r10-navigation-language select').selectOption('fr');
 await expect(page.getByText('1 INDICES')).toBeVisible();
 await page.reload();
 await expect(page.locator('html')).toHaveAttribute('lang','fr');
 await page.getByRole('button',{name:/Continuer/}).click();
 await expect(page.getByText('1 INDICES')).toBeVisible();
});


test('language switch during an active case preserves evidence progress and locale across reload',async({page})=>{
 await page.goto('/');
 await page.locator('.cf-language-selector select').first().selectOption('en');
 await page.getByRole('button',{name:'Start investigation'}).click();
 await expect(page.getByRole('dialog',{name:'Case introduction'})).toBeVisible();
 await page.getByRole('button',{name:'Join investigation'}).click();
 await expect(page.getByRole('heading',{name:'Apartment 407'})).toBeVisible();
 await page.getByRole('button',{name:'Inspect E01'}).click();
 await page.getByRole('button',{name:'Collect evidence'}).click();
 await expect(page.locator('.r10-header-right').getByText('1 CLUES')).toBeVisible();
 await page.locator('.cf-language-selector select').last().selectOption('fr');
 await expect(page.locator('html')).toHaveAttribute('lang','fr');
 await expect(page.locator('.r10-header-right').getByText('1 INDICES')).toBeVisible();
 await page.reload();
 await expect(page.locator('html')).toHaveAttribute('lang','fr');
 await expect(page.getByRole('heading',{name:/La vérité est/})).toBeVisible();
 await page.getByRole('button',{name:'Continuer'}).click();
 await expect(page.locator('.r10-header-right').getByText('1 INDICES')).toBeVisible();
});


test('Co-op players with different locales see translated built-in story but share one evidence state',async({page,browser})=>{
 await page.goto('/');
 await page.locator('.cf-language-selector select').first().selectOption('bg');
 await page.getByRole('button',{name:/Екипна игра \/ нови случаи/}).click();
 await page.getByRole('button',{name:'Генерирай нов случай'}).click();
 const roomTitle=await page.locator('.community-room-title h3').innerText();
 expect(['Изчезналата експозиция','Сянка в архива','Последният протокол','Тайният инвентар']).toContain(roomTitle);
 const roomCode=(await page.locator('.community-room-title small').innerText()).split(':')[1]?.trim()||'';
 expect(roomCode).toMatch(/^[A-F0-9]{10}$/);
 const guest=await browser.newContext();
 try{
  const other=await guest.newPage();
  await other.goto('/');
  await other.locator('.cf-language-selector select').first().selectOption('en');
  await other.getByRole('button',{name:/Co-op \/ new cases/}).click();
  await other.locator('.community-layout input[maxlength="32"]').first().fill('Guest Investigator');
  await other.locator('input[maxlength="10"]').fill(roomCode);
  await other.getByRole('button',{name:'Join investigation'}).click();
  await expect(other.locator('.community-room-title h3')).toHaveText(/The Missing Exhibit|Shadow in the Archive|The Final Report|The Secret Inventory/);
  await expect(other.locator('.community-room-title h3')).not.toHaveText(roomTitle);
  await other.locator('.community-clues button').first().click();
  await expect.poll(async()=>{
   await page.locator('.community-team button').click();
   return page.locator('.community-clues article.discovered').count();
  },{timeout:15000}).toBe(1);
  await expect(other.locator('html')).toHaveAttribute('lang','en');
  await expect(page.locator('html')).toHaveAttribute('lang','bg');
 }finally{await guest.close();}
});
