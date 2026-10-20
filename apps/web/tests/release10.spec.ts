import {test,expect} from '@playwright/test';

test('1.0 boots into cinematic title screen and preserves classic tools',async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/');
 await expect(page.getByRole('heading',{name:/Истината е/})).toBeVisible();
 await expect(page.getByRole('button',{name:/Започни разследването/})).toBeVisible();
 await page.getByRole('button',{name:/Избери случай/}).click();
 await expect(page.getByRole('group',{name:'Избор на случай'}).getByRole('button')).toHaveCount(2);
 await page.getByRole('button',{name:/Класически инструменти/}).click();
 await expect(page.getByRole('heading',{name:'Последното обаждане'})).toBeVisible();
 await page.getByRole('button',{name:/Главно меню 1.0/}).click();
 await expect(page.getByRole('heading',{name:/Истината е/})).toBeVisible();
 expect(errors).toEqual([]);
});

test('Case 001 cinematic intro leads to scene exploration and collected evidence',async({page})=>{
 await page.goto('/');
 await page.getByRole('button',{name:/Започни разследването/}).click();
 await expect(page.getByRole('dialog',{name:'Начало на случая'})).toBeVisible();
 await page.getByRole('button',{name:/Влез в разследването/}).click();
 await expect(page.getByRole('heading',{name:'Апартамент 407'})).toBeVisible();
 await page.getByRole('button',{name:'Изследвай E01'}).click();
 await page.getByRole('button',{name:/Събери улика/}).click();
 await expect(page.getByText('1 УЛИКИ')).toBeVisible();
 await page.getByRole('navigation',{name:'Игрови раздели'}).getByRole('button',{name:/Досие/}).click();
 await expect(page.getByRole('heading',{name:'Следствено досие'})).toBeVisible();
 await expect(page.getByRole('heading',{name:'Протокол от огледа'})).toBeVisible();
});

test('Case 002 is playable from new main menu and locks final until puzzles',async({page})=>{
 await page.goto('/');
 await page.getByRole('button',{name:/Избери случай/}).click();
 await page.getByRole('group',{name:'Избор на случай'}).getByRole('button',{name:/Изчезналият архив/}).click();
 await page.getByRole('button',{name:/Започни разследването/}).click();
 await expect(page.getByRole('dialog',{name:'Начало на случая'})).toBeVisible();
 await page.getByRole('button',{name:/Влез в разследването/}).click();
 await expect(page.getByRole('heading',{name:'Читалня'})).toBeVisible();
 await page.getByRole('button',{name:/Изследвай Читалня/}).click();
 await page.getByRole('button',{name:/Събери улика/}).click();
 await expect(page.getByText('1 НАМЕРЕНИ')).toBeVisible();
 await page.getByRole('navigation',{name:'Игрови раздели'}).getByRole('button',{name:/Криминалистика/}).click();
 await expect(page.getByRole('heading',{name:'Пъзелите на архива'})).toBeVisible();
 await expect(page.getByRole('button',{name:'Провери'}).first()).toBeDisabled();
 await page.getByRole('navigation',{name:'Игрови раздели'}).getByRole('button',{name:/Финал/}).click();
 await expect(page.getByRole('button',{name:/Подай окончателно обвинение/})).toBeDisabled();
});

test('1.0 mobile navigation and cinematic menu settings work',async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.setViewportSize({width:390,height:844});
 await page.goto('/');
 await page.getByRole('button',{name:/Настройки/}).click();
 await page.getByRole('checkbox',{name:/Намалени анимации/}).check();
 await page.getByRole('button',{name:/Започни разследването/}).click();
 await page.getByRole('button',{name:/Влез в разследването/}).click();
 await page.getByRole('button',{name:'Игрова навигация'}).click();
 await page.getByRole('navigation',{name:'Игрови раздели'}).getByRole('button',{name:/Разпити/}).click();
 await expect(page.getByRole('heading',{name:/Очите не лъжат/})).toBeVisible();
 expect(errors).toEqual([]);
});
