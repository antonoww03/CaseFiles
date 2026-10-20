import {test,expect} from '@playwright/test';

test('0.9 unified mode joins scene inventory drawer and smartphone',async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/');
 await page.getByRole('button',{name:/Започни разследването/}).click();
 await page.getByRole('button',{name:/Играй CASEFILES 0.9/}).click();
 await expect(page.getByRole('heading',{name:'Единен игрови режим'})).toBeVisible();
 await expect(page.getByRole('heading',{name:'Антре'})).toBeVisible();
 await page.getByRole('button',{name:'Огледай Изтривалка'}).click();
 await expect(page.getByRole('dialog',{name:'Оглед на Изтривалка'})).toBeVisible();
 await page.getByRole('dialog').getByRole('button',{name:/Изследвай/}).click();
 await page.getByRole('button',{name:/Инвентар \(1\)/}).click();
 await expect(page.getByRole('button',{name:/Месингов ключ/})).toBeVisible();
 await page.getByRole('button',{name:/Към Всекидневна/}).click();
 await page.getByRole('button',{name:/Към Кабинет/}).click();
 await page.getByRole('button',{name:'Огледай Заключено чекмедже'}).click();
 await expect(page.getByRole('dialog',{name:'Оглед на Заключено чекмедже'})).toBeVisible();
 await page.getByRole('dialog').getByRole('button',{name:/Изследвай/}).click();
 await expect(page.getByText(/Добавен предмет в инвентара/)).toBeVisible();
 expect(errors).toEqual([]);
});

test('0.9 lab and guided mission HUD are accessible',async({page})=>{
 await page.goto('/');
 await page.getByRole('button',{name:/Започни разследването/}).click();
 await page.getByRole('button',{name:/Играй CASEFILES 0.9/}).click();
 await page.getByRole('navigation',{name:'Бърза игрова навигация'}).getByRole('button',{name:/Лаборатория/}).click();
 await expect(page.getByRole('heading',{name:'Криминалистични миниигри'})).toBeVisible();
 await expect(page.getByRole('button',{name:/Скъсаното писмо/})).toBeDisabled();
 await page.getByRole('navigation',{name:'Бърза игрова навигация'}).getByRole('button',{name:/Мисии/}).click();
 await expect(page.getByRole('heading',{name:'Следствени цели'})).toBeVisible();
 await expect(page.getByRole('heading',{name:'Настройки и достъпност'})).toBeVisible();
 await expect(page.getByText('Разследването продължава')).toBeVisible();
});

test('0.9 mobile navigates phone map and detective vision without runtime errors',async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.setViewportSize({width:390,height:844});
 await page.goto('/');
 await page.getByRole('button',{name:/Започни разследването/}).click();
 await page.getByRole('button',{name:/Отвори навигацията/}).click();
 await page.getByRole('button',{name:/Играй CASEFILES 0.9/}).click();
 await page.getByRole('button',{name:/Detective Vision/}).click();
 await expect(page.getByText(/В този режим виждаш кои обекти/)).toBeVisible();
 await page.getByRole('navigation',{name:'Бърза игрова навигация'}).getByRole('button',{name:/Карта/}).click();
 await expect(page.getByRole('heading',{name:'Карта на разследванията'})).toBeVisible();
 await page.getByRole('navigation',{name:'Бърза игрова навигация'}).getByRole('button',{name:/Телефон/}).click();
 await expect(page.getByRole('heading',{name:'Телефонът на Никола'})).toBeVisible();
 expect(errors).toEqual([]);
});
