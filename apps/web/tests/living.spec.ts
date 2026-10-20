import { test, expect } from '@playwright/test';

test('CASEFILES 0.7 warrants and forensic clock are gated by evidence',async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/');
 await page.getByRole('button',{name:/Започни разследването/}).click();
 await page.getByRole('button',{name:/Живо разследване/}).click();
 await expect(page.getByRole('heading',{name:'Разрешения за обиск'})).toBeVisible();
 await expect(page.getByRole('button',{name:/Поискай заповед/}).first()).toBeDisabled();
 await expect(page.getByText('ФАЗА 1 / 5')).toBeVisible();
 expect(errors).toEqual([]);
});

test('CASEFILES 0.7 playable second case has independent evidence',async({page})=>{
 await page.goto('/');
 await page.getByRole('button',{name:/Започни разследването/}).click();
 await page.getByRole('button',{name:/Живо разследване/}).click();
 await page.getByRole('button',{name:/Библиотека със случаи/}).click();
 await expect(page.getByRole('heading',{name:'Библиотека с криминални случаи'})).toBeVisible();
 await page.getByRole('button',{name:/Изчезналият архив/}).click();
 await expect(page.getByRole('heading',{name:'Изчезналият архив'})).toBeVisible();
 await expect(page.getByRole('heading',{name:'Откриване на доказателства'})).toBeVisible();
 await expect(page.getByText('Открити следи: 0/6')).toBeVisible();
});

test('CASEFILES 0.7 mobile navigation provides editor and library',async({page})=>{
 await page.setViewportSize({width:390,height:844});
 await page.goto('/');
 await page.getByRole('button',{name:/Отвори навигацията/}).click();
 await page.getByRole('button',{name:/Живо разследване/}).click();
 await expect(page.getByRole('heading',{name:'Живо разследване'})).toBeVisible();
 await page.getByRole('button',{name:/Библиотека със случаи/}).click();
 await expect(page.getByText('Първо започни игрова сесия')).toBeVisible();
});
