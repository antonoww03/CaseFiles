import {test,expect} from '@playwright/test';

test('detective workflow opens the expanded investigation tools',async({page})=>{
 await page.goto('/');
 await expect(page.getByRole('heading',{name:'Последното обаждане'}).first()).toBeVisible();
 await page.getByRole('button',{name:/Започни разследването/}).click();
 await page.getByRole('button',{name:/Детективски инструменти/}).click();
 await expect(page.getByRole('heading',{name:'Детективски център'})).toBeVisible();
 await expect(page.getByRole('heading',{name:'Криминалистични миниигри'})).toBeVisible();
 await page.getByRole('button',{name:/Карта и свидетели/}).click();
 await expect(page.getByRole('heading',{name:'Карта и нови локации'})).toBeVisible();
 await page.getByRole('button',{name:/Достоверност/}).click();
 await expect(page.getByRole('heading',{name:'Достоверност на информацията'})).toBeVisible();
 await page.getByRole('button',{name:/Постижения/}).click();
 await expect(page.getByRole('heading',{name:'Постижения и игрови напредък'})).toBeVisible();
});

test('responsive sidebar provides access to the expansion on mobile',async({page})=>{
 await page.setViewportSize({width:390,height:844});
 await page.goto('/');
 await page.getByRole('button',{name:/Отвори навигацията/}).click();
 await page.getByRole('button',{name:/Детективски инструменти/}).click();
 await expect(page.getByRole('heading',{name:'Детективски център'})).toBeVisible();
 await expect(page.getByText('Първо започни разследване')).toBeVisible();
});
