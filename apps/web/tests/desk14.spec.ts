import {expect,test} from '@playwright/test';

test('case one investigation desk respects spoilers and opens linked tools',async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/');
 await page.getByRole('button',{name:/Започни разследването/}).click();
 await page.getByRole('button',{name:/Влез в разследването/}).click();
 await page.getByRole('navigation',{name:'Игрови раздели'}).getByRole('button',{name:'Следствено бюро'}).click();
 await expect(page.getByRole('heading',{name:'Профили, преса и архив'})).toBeVisible();
 await expect(page.getByText('Нямаш достатъчно доказателства').first()).toBeVisible();
 await expect(page.getByRole('button',{name:'Достъпно след успешно разследване'})).toBeDisabled();
 await expect(page.getByText('Изчезналият архив',{exact:true}).first()).toBeVisible();
 await page.getByRole('button',{name:/Проверка на противоречия/}).click();
 await expect(page.getByRole('heading',{name:'Мисли като детектив.'})).toBeVisible();
 expect(errors).toEqual([]);
});

test('case two reveals staged article only after clues, without publishing a verdict',async({page})=>{
 await page.goto('/');
 await page.getByRole('button',{name:/Избери случай/}).click();
 await page.getByRole('group',{name:'Избор на случай'}).getByRole('button',{name:/Изчезналият архив/}).click();
 await page.getByRole('button',{name:/Започни разследването/}).click();
 await page.getByRole('button',{name:/Влез в разследването/}).click();
 const nav=page.getByRole('navigation',{name:'Игрови раздели'});
 await nav.getByRole('button',{name:'Следствено бюро'}).click();
 await expect(page.getByText('Разследващите проверяват нови следи')).toHaveCount(0);
 await nav.getByRole('button',{name:/Местопрестъпление/}).click();
 await page.getByRole('button',{name:'Изследвай Читалня'}).click();
 await page.getByRole('button',{name:/Събери улика/}).click();
 await page.getByRole('button',{name:'Сървърна',exact:true}).click();
 await page.getByRole('button',{name:'Изследвай Сървърна'}).click();
 await page.getByRole('button',{name:/Събери улика/}).click();
 await page.getByRole('button',{name:'Пост охрана',exact:true}).click();
 await page.getByRole('button',{name:'Изследвай Пост охрана'}).click();
 await page.getByRole('button',{name:/Събери улика/}).click();
 await nav.getByRole('button',{name:'Следствено бюро'}).click();
 await expect(page.getByRole('heading',{name:'Разследващите проверяват нови следи'})).toBeVisible();
 await expect(page.getByRole('button',{name:'Достъпно след успешно разследване'})).toBeDisabled();
});
