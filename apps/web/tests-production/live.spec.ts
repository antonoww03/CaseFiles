import {test,expect} from '@playwright/test';
test.beforeEach(async({page})=>{
 await page.addInitScript(()=>window.localStorage.setItem('casefiles-language','bg'));
});
test('real production opens first case, collects evidence and shows Detective Universe',async({page})=>{
 const errors:string[]=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/');
 await expect(page.getByRole('heading',{name:/Истината е/})).toBeVisible();
 await page.getByRole('button',{name:/Започни разследването/}).click();
 await expect(page.getByRole('dialog',{name:'Начало на случая'})).toBeVisible();
 await page.getByRole('button',{name:/Влез в разследването/}).click();
 await expect(page.getByRole('heading',{name:'Апартамент 407'})).toBeVisible();
 await page.getByRole('button',{name:'Изследвай E01'}).click();
 await page.getByRole('button',{name:/Събери улика/}).click();
 await expect(page.getByText('1 УЛИКИ')).toBeVisible(); // The deployed mobile HUD must show discovered evidence.
 if(await page.getByRole('button',{name:'Игрова навигация'}).isVisible())await page.getByRole('button',{name:'Игрова навигация'}).click();
 await page.getByRole('navigation',{name:'Игрови раздели'}).getByRole('button',{name:'Детективски свят'}).click();
 await expect(page.getByRole('heading',{name:'Градът пази своите тайни.'})).toBeVisible();
 await expect(page.getByRole('group',{name:'Карта на разследването'})).toBeVisible();
 await page.getByRole('button',{name:/Партньор и задачи/}).click();
 await expect(page.getByText('Инспектор Алекс Димов')).toBeVisible();
 await page.getByRole('button',{name:/Оперативен брифинг/}).click();
 await expect(page.getByText(/Партньорът:/).first()).toBeVisible();
 await page.reload();
 await expect(page.getByRole('heading',{name:/Истината е/})).toBeVisible();
 expect(errors).toEqual([]);
});
test('real production can start archive mystery and enforce locked forensic missions',async({page})=>{
 const errors:string[]=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/');
 await page.getByRole('button',{name:/Избери случай/}).click();
 await page.getByRole('group',{name:'Избор на случай'}).getByRole('button',{name:/Изчезналият архив/}).click();
 await page.getByRole('button',{name:/Започни разследването/}).click();
 await page.getByRole('button',{name:/Влез в разследването/}).click();
 await expect(page.getByRole('heading',{name:'Читалня',level:1})).toBeVisible();
 if(await page.getByRole('button',{name:'Игрова навигация'}).isVisible())await page.getByRole('button',{name:'Игрова навигация'}).click();
 await page.getByRole('navigation',{name:'Игрови раздели'}).getByRole('button',{name:'Детективски свят'}).click();
 await expect(page.getByRole('heading',{name:/Пловдив · Архивен район/})).toBeVisible();
 await page.getByRole('button',{name:/Партньор и задачи/}).click();
 await expect(page.locator('.u17-card').filter({hasText:'Провери нощните протоколи'}).getByRole('button',{name:/Възложи задача/})).toBeDisabled();
 expect(errors).toEqual([]);
});
test('real production community lobby, procedural room and responsive controls work',async({page})=>{
 const errors:string[]=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/');
 await page.getByRole('button',{name:/Екипна игра \/ нови случаи/}).click();
 await expect(page.getByRole('heading',{name:'Общност на детективите'})).toBeVisible();
 await page.getByRole('button',{name:/Генерирай нов случай/}).click();
 await expect(page.getByRole('heading',{name:/Изчезналата експозиция|Сянка в архива|Последният протокол|Тайният инвентар/})).toBeVisible();
 if((await page.viewportSize())?.width===390){
  const viewport=await page.evaluate(()=>({width:window.innerWidth,scroll:document.documentElement.scrollWidth}));
  expect(viewport.scroll).toBeLessThanOrEqual(viewport.width+4);
 }
 expect(errors).toEqual([]);
});
