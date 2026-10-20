import {test,expect} from '@playwright/test';

test('Case 002 interrogation choice locks a consequential narrative branch',async({page})=>{
 await page.goto('/');
 await page.getByRole('button',{name:/Избери случай/}).click();
 await page.getByRole('group',{name:'Избор на случай'}).getByRole('button',{name:/Изчезналият архив/}).click();
 await page.getByRole('button',{name:/Започни разследването/}).click();
 await page.getByRole('button',{name:/Влез в разследването/}).click();
 await page.getByRole('navigation',{name:'Игрови раздели'}).getByRole('button',{name:/Разпити/}).click();
 await expect(page.getByRole('heading',{name:/Решаващи избори в архива/})).toBeVisible();
 await page.getByRole('button',{name:/Притисни Борис без документи/}).click();
 await expect(page.getByText(/Борис отказва по-нататъшни въпроси/)).toBeVisible();
 await expect(page.getByRole('button',{name:/Притисни Борис без документи/})).toBeDisabled();
});
