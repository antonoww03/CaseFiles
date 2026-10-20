import {expect,test} from '@playwright/test';

test('1.5 partner and 1.6 city are reachable from case one game',async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/');
 await page.getByRole('button',{name:/Започни разследването/}).click();
 await page.getByRole('button',{name:/Влез в разследването/}).click();
 const nav=page.getByRole('navigation',{name:'Игрови раздели'});
 await nav.getByRole('button',{name:'Детективски свят'}).click();
 await expect(page.getByRole('heading',{name:'Градът пази своите тайни.'})).toBeVisible();
 await expect(page.getByRole('group',{name:'Карта на разследването'})).toBeVisible();
 await expect(page.getByRole('button',{name:'Пътувай до Служебен архив'})).toBeDisabled();
 await page.getByRole('button',{name:/Партньор и задачи/}).click();
 await expect(page.getByText('Инспектор Алекс Димов')).toBeVisible();
 await expect(page.getByRole('button',{name:/Оперативен брифинг/})).toBeEnabled();
 await page.getByRole('button',{name:/Оперативен брифинг/}).click();
 await expect(page.getByText(/оперативен брифинг|Партньорът:/i).first()).toBeVisible();
 await page.getByRole('button',{name:/Живи заподозрени/}).click();
 await expect(page.getByRole('heading',{name:'Говори с хората на място'})).toBeVisible();
 expect(errors).toEqual([]);
});

test('1.7 world progress remains case-scoped and evidence gates assignments',async({page})=>{
 await page.goto('/');
 await page.getByRole('button',{name:/Избери случай/}).click();
 await page.getByRole('group',{name:'Избор на случай'}).getByRole('button',{name:/Изчезналият архив/}).click();
 await page.getByRole('button',{name:/Започни разследването/}).click();
 await page.getByRole('button',{name:/Влез в разследването/}).click();
 const nav=page.getByRole('navigation',{name:'Игрови раздели'});
 await nav.getByRole('button',{name:'Детективски свят'}).click();
 await expect(page.getByRole('heading',{name:/Пловдив · Архивен район/})).toBeVisible();
 await page.getByRole('button',{name:/Партньор и задачи/}).click();
 const mission=page.locator('.u17-card').filter({hasText:'Провери нощните протоколи'});
 await expect(mission.getByRole('button',{name:/Възложи задача/})).toBeDisabled();
 await nav.getByRole('button',{name:/Местопрестъпление/}).click();
 await page.getByRole('button',{name:'Изследвай Читалня'}).click();
 await page.getByRole('button',{name:/Събери улика/}).click();
 await nav.getByRole('button',{name:'Детективски свят'}).click();
 await page.getByRole('button',{name:/Партньор и задачи/}).click();
 await expect(page.locator('.u17-card').filter({hasText:'Провери нощните протоколи'}).getByRole('button',{name:/Възложи задача/})).toBeEnabled();
 await page.locator('.u17-card').filter({hasText:'Провери нощните протоколи'}).getByRole('button',{name:/Възложи задача/}).click();
 await expect(page.getByText(/Задачата е възложена/)).toBeVisible();
 await page.getByRole('button',{name:/Интерактивен град/}).click();
 await page.getByRole('button',{name:/Изчакай 20 игрови минути/}).click();
 await page.getByRole('button',{name:/Партньор и задачи/}).click();
 await expect(page.getByText(/В 23:05 фондът е бил отбелязан/)).toBeVisible();
});
