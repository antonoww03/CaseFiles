import {expect,test} from '@playwright/test';

test('2.5D scene has navigable rooms and controls',async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/');
 await page.getByRole('button',{name:/Класически инструменти/}).click();
 await page.getByRole('button',{name:/Започни разследването/}).click();
 await page.getByRole('button',{name:/Кинематографичен свят/}).click();
 await expect(page.getByRole('heading',{name:'Местопрестъпление 407'})).toBeVisible();
 await page.getByRole('button',{name:'Приближи'}).click();
 await expect(page.getByText('2.5D · 1.1×')).toBeVisible();
 await page.getByRole('button',{name:/Кабинет/}).click();
 await expect(page.getByRole('button',{name:/Огледай Заключено чекмедже/})).toBeVisible();
 expect(errors).toEqual([]);
});

test('cinematic phone gates records and detective profile shows server progress',async({page})=>{
 await page.goto('/');
 await page.getByRole('button',{name:/Класически инструменти/}).click();
 await page.getByRole('button',{name:/Започни разследването/}).click();
 await page.getByRole('button',{name:/Кинематографичен свят/}).click();
 await page.getByRole('button',{name:/Телефон на Никола/}).click();
 await expect(page.getByRole('heading',{name:'Телефонът на Никола'})).toBeVisible();
 await expect(page.getByText('Заключен архив — необходими улики').first()).toBeVisible();
 await page.getByRole('button',{name:/Моят детектив/}).click();
 await expect(page.getByRole('heading',{name:'Профил на детектива'})).toBeVisible();
 await expect(page.getByText('Детектив · Ниво 1')).toBeVisible();
});

test('case 002 chapters and visual story creator open on mobile',async({page})=>{
 await page.setViewportSize({width:390,height:844});
 await page.goto('/');
 await page.getByRole('button',{name:/Класически инструменти/}).click();
 await page.getByRole('button',{name:/Започни разследването/}).click();
 await page.getByRole('button',{name:/Отвори навигацията/}).click();
 await page.getByRole('button',{name:/Кинематографичен свят/}).click();
 await page.getByRole('button',{name:/Изчезналият архив/}).click();
 await expect(page.getByText('ГЛАВА 1')).toBeVisible();
 await page.getByRole('button',{name:/Отвори навигацията/}).click();
 await page.getByRole('button',{name:/Живо разследване/}).click();
 await page.getByRole('button',{name:/Редактор на истории/}).click();
 await expect(page.getByRole('heading',{name:'Визуален редактор на криминални истории'})).toBeVisible();
 await expect(page.getByRole('textbox',{name:'Начален брифинг'})).toBeVisible();
});
