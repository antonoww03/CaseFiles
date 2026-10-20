import {test,expect} from '@playwright/test';

test('Director Cut 1.2 exposes the opening scene, close-ups and a meaningful choice',async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/');
 await page.getByRole('button',{name:/Започни разследването/}).click();
 await page.getByRole('button',{name:/Влез в разследването/}).click();
 await expect(page.getByRole('heading',{name:'Сюжетен режисьор'})).toBeVisible();
 await page.getByRole('button',{name:/Гледай/}).click();
 await expect(page.getByRole('dialog',{name:'Кинематографична сцена'})).toBeVisible();
 await page.getByRole('button',{name:/Продължи историята/}).click();
 await page.getByRole('button',{name:'Изследвай E03'}).click();
 await page.getByRole('button',{name:'Детайлен оглед'}).click();
 await expect(page.getByRole('dialog',{name:'Детайлен оглед на предмет'})).toBeVisible();
 await page.getByRole('slider',{name:/Завъртане/}).fill('90');
 await page.getByRole('button',{name:'Затвори близкия план'}).click();
 await page.getByRole('button',{name:'Събери улика'}).click();
 await expect(page.getByRole('button',{name:/Запази телефона като доказателство/})).toBeVisible();
 await page.getByRole('button',{name:/Запази телефона като доказателство/}).click();
 await expect(page.getByRole('button',{name:/Изискай незабавни обяснения/})).toBeDisabled();
 expect(errors).toEqual([]);
});

test('All six original Director Cut suspect portraits have accessible labels',async({page})=>{
 await page.goto('/');
 await page.getByRole('button',{name:/Започни разследването/}).click();
 await page.getByRole('button',{name:/Влез в разследването/}).click();
 await page.getByRole('navigation',{name:'Игрови раздели'}).getByRole('button',{name:/Разпити/}).click();
 await expect(page.getByRole('img',{name:/Илюстриран портрет на Мартин Русев/})).toBeVisible();
 await expect(page.getByRole('img',{name:/Илюстриран портрет на Елена Вълчева/})).toBeVisible();
 await expect(page.getByRole('img',{name:/Илюстриран портрет на Петър Добрев/})).toBeVisible();
});

test('Case 002 has independent story prologue on mobile, without changing main menu',async({page})=>{
 await page.setViewportSize({width:390,height:844});
 await page.goto('/');
 await page.getByRole('button',{name:/Избери случай/}).click();
 await page.getByRole('group',{name:'Избор на случай'}).getByRole('button',{name:/Изчезналият архив/}).click();
 await page.getByRole('button',{name:/Започни разследването/}).click();
 await page.getByRole('button',{name:/Влез в разследването/}).click();
 await expect(page.getByRole('heading',{name:'Сюжетен режисьор'})).toBeVisible();
 await page.getByRole('button',{name:/Гледай/}).click();
 await expect(page.getByRole('dialog',{name:'Кинематографична сцена'})).toBeVisible();
 await expect(page.getByRole('heading',{name:/Нощният архив/})).toBeVisible();
});
