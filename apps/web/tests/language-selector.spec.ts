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
