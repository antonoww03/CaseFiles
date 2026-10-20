import {test,expect} from '@playwright/test';

test('unique 1.1 scenes, inventory and item inspection flow',async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/');
 await page.getByRole('button',{name:/Започни разследването/}).click();
 await page.getByRole('button',{name:/Влез в разследването/}).click();
 await expect(page.locator('.x11-scene')).toHaveCSS('background-image',/rooms\/living\.svg/);
 await page.getByRole('button',{name:/Detective Vision/}).click();
 await expect(page.getByRole('button',{name:'Взаимодействай с Библиотека'})).toBeVisible();
 await page.getByRole('button',{name:'Взаимодействай с Библиотека'}).click();
 await expect(page.locator('.x11-inventory').getByRole('button',{name:/Джобна лупа/})).toBeVisible();
 await page.getByRole('button',{name:/Карта/}).click();
 await page.locator('.x11-map').getByRole('button',{name:/Антре/}).click();
 await expect(page.locator('.x11-scene')).toHaveCSS('background-image',/rooms\/entrance\.svg/);
 await page.getByRole('button',{name:'Взаимодействай с Изтривалка'}).click();
 await expect(page.locator('.x11-inventory').getByRole('button',{name:/Месингов ключ/})).toBeVisible();
 await page.getByRole('button',{name:/Карта/}).click();
 await page.locator('.x11-map').getByRole('button',{name:/Работен кабинет/}).click();
 await page.locator('.x11-inventory').getByRole('button',{name:/Месингов ключ/}).click();
 await page.getByRole('button',{name:'Взаимодействай с Заключено чекмедже'}).click();
 await expect(page.locator('.x11-inventory').getByRole('button',{name:/Фото негатив/})).toBeVisible();
 expect(errors).toEqual([]);
});

test('investigator board and journal are usable within 1.0 case',async({page})=>{
 await page.goto('/');
 await page.getByRole('button',{name:/Започни разследването/}).click();
 await page.getByRole('button',{name:/Влез в разследването/}).click();
 await page.getByRole('button',{name:'Изследвай E01'}).click();
 await page.getByRole('button',{name:/Събери улика/}).click();
 await page.getByRole('button',{name:'Изследвай E03'}).click();
 await page.getByRole('button',{name:/Събери улика/}).click();
 await page.getByRole('button',{name:/Дневник/}).click();
 await expect(page.getByRole('heading',{name:'Следствен дневник'})).toBeVisible();
 await page.getByRole('navigation',{name:'Игрови раздели'}).getByRole('button',{name:/Досие/}).click();
 await expect(page.getByRole('heading',{name:'Интерактивна дъска на доказателствата'})).toBeVisible();
 await expect(page.locator('.x11-pin')).toHaveCount(2);
});

test('1.1 archive map displays distinctive rooms and gated locations on mobile',async({page})=>{
 await page.setViewportSize({width:390,height:844});
 await page.goto('/');
 await page.getByRole('button',{name:/Избери случай/}).click();
 await page.getByRole('group',{name:'Избор на случай'}).getByRole('button',{name:/Изчезналият архив/}).click();
 await page.getByRole('button',{name:/Започни разследването/}).click();
 await page.getByRole('button',{name:/Влез в разследването/}).click();
 await expect(page.locator('.r10-scene-art')).toHaveCSS('background-image',/rooms\/reading\.svg/);
 await page.getByRole('button',{name:/Карта/}).click();
 await expect(page.locator('.x11-map').getByRole('button',{name:/Сервизен коридор/})).toBeDisabled();
 await page.locator('.x11-map').getByRole('button',{name:/Сървърна/}).click();
 await expect(page.locator('.r10-scene-art')).toHaveCSS('background-image',/rooms\/server\.svg/);
});
