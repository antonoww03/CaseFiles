import {test,expect} from '@playwright/test';

test('0.9 unified mode joins scene inventory drawer and smartphone',async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/');
 await page.getByRole('button',{name:/Класически инструменти/}).click();
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
 await page.getByRole('button',{name:/Класически инструменти/}).click();
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
 await page.getByRole('button',{name:/Класически инструменти/}).click();
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

test('0.9 forensic puzzles validate dependencies, wrong answers, controls, and confirmed results',async({page,request})=>{
 const api='http://127.0.0.1:3001/api';
 const created=await request.post(`${api}/session`);
 expect(created.status()).toBe(201);
 const {sessionId}=await created.json() as {sessionId:string};
 const headers={'x-case-session':sessionId};
 for(const id of ['E01','E03','E04','E05','E08']){
  const response=await request.post(`${api}/discover/${id}`,{headers,data:{}});
  expect(response.status(),`local fixture discovery ${id}`).toBe(200);
 }
 const camera=await request.post(`${api}/forensics/clips/elevator/analyze`,{headers,data:{second:120,detail:'презрамка'}});
 expect(camera.status(),'local fixture obtains E06 through the forensic camera workflow').toBe(200);
 const interview=await request.post(`${api}/interview`,{headers,data:{personId:'elena',message:'Какво чу по телефона?',scriptedOnly:true,interviewStyle:'neutral'}});
 expect(interview.status(),'local fixture obtains interview evidence through scripted interview').toBe(200);
 await page.addInitScript(id=>localStorage.setItem('casefiles-demo-session',id),sessionId);
 await page.goto('/');
 await page.getByRole('button',{name:/Класически инструменти/}).click();
 await page.getByRole('button',{name:/Продължи разследването/}).click();
 await page.getByRole('button',{name:/Играй CASEFILES 0.9/}).click();
 const nav=page.getByRole('navigation',{name:'Бърза игрова навигация'});
 await nav.getByRole('button',{name:'Лаборатория'}).click();
 const workbench=page.locator('.g9-workbench');
 await expect(page.getByRole('heading',{name:'Криминалистични миниигри'})).toBeVisible();
 const puzzle=(name:string)=>page.locator('.g9-puzzle-tabs').getByRole('button',{name,exact:false});
 await expect(puzzle('Наслагване на отпечатъци')).toBeEnabled();
 await expect(puzzle('CCTV — засечи детайла')).toBeEnabled();

 await puzzle('Скъсаното писмо').click();
 const fragments=workbench.locator('.g9-fragments button');
 await expect(fragments).toHaveCount(3);
 await expect(workbench.getByRole('button',{name:/Провери решението/})).toBeEnabled();
 await workbench.getByRole('button',{name:'Подсказка'}).click();
 await expect(workbench.locator('.g9-hint')).toContainText('след две грешни проверки');
 await workbench.getByRole('button',{name:'Подсказка'}).click();
 await workbench.getByRole('button',{name:/Провери решението/}).click();
 await expect(page.getByRole('status')).toContainText('Това решение не съвпада');
 await workbench.getByRole('button',{name:/Провери решението/}).click();
 await expect(page.getByRole('status')).toContainText('Това решение не съвпада');
 await workbench.getByRole('button',{name:'Подсказка'}).click();
 await expect(workbench.locator('.g9-hint')).toContainText('оригиналите и фактурите');
 await fragments.nth(0).getByText('→').click();
 await expect(fragments.nth(0)).toContainText('Провери');
 await fragments.nth(2).getByText('←').click();
 await expect(fragments.nth(1)).toContainText('оригиналните');
 await workbench.getByRole('button',{name:/Провери решението/}).click();
 await expect(workbench.getByText('РЕШЕНО ✓')).toBeVisible();
 await expect(page.getByRole('status')).toContainText('Възстановеният документ');

 await puzzle('Наслагване на отпечатъци').click();
 await workbench.getByRole('button',{name:'Образец B'}).click();
 await expect(workbench.getByRole('button',{name:'Образец B'})).toHaveClass(/active/);
 await workbench.getByRole('button',{name:'Завърти 90°'}).click();
 await expect(workbench.getByText('ОБРАЗЕЦ B / 90°')).toBeVisible();
 await workbench.getByRole('button',{name:/Провери решението/}).click();
 await expect(workbench.getByText('РЕШЕНО ✓')).toBeVisible();

 await puzzle('CCTV — засечи детайла').click();
 const seek=workbench.getByLabel('Време във видеозаписа');
 await seek.evaluate((node)=>{
  const input=node as HTMLInputElement;
  const setter=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value')?.set;
  setter?.call(input,'120');
  input.dispatchEvent(new Event('input',{bubbles:true}));
  input.dispatchEvent(new Event('change',{bubbles:true}));
 });
 await expect(workbench.locator('.g9-cctv')).toContainText('Фигура с презрамка');
 await workbench.getByRole('button',{name:'Презрамка'}).click();
 await workbench.getByRole('button',{name:/Провери решението/}).click();
 await expect(workbench.getByText('РЕШЕНО ✓')).toBeVisible();
 await expect(page.getByRole('status')).toContainText('Не може да се извлече самоличност');

 await puzzle('Две свидетелски версии').click();
 await workbench.getByRole('button',{name:'Отричането на разговора'}).click();
 await workbench.getByRole('button',{name:/Провери решението/}).click();
 await expect(workbench.getByText('РЕШЕНО ✓')).toBeVisible();
 await expect(page.getByRole('status')).toContainText('противоречие');

 await puzzle('Шифър на сейфа').click();
 for(let i=0;i<3;i++)await workbench.getByRole('button',{name:'Увеличи код 1'}).click();
 for(let i=0;i<7;i++)await workbench.getByRole('button',{name:'Увеличи код 2'}).click();
 await workbench.getByRole('button',{name:'Увеличи код 3'}).click();
 await expect(workbench.locator('.g9-dials')).toContainText('371');
 await workbench.getByRole('button',{name:/Провери решението/}).click();
 await expect(page.getByRole('status')).toContainText('Не е разчетена UV следата');

 await puzzle('Реконструкция на нощта').click();
 const order=workbench.locator('.g9-reconstruction button');
 await expect(order).toHaveCount(4);
 await workbench.getByRole('button',{name:/Провери решението/}).click();
 await expect(page.getByRole('status')).toContainText('Това решение не съвпада');
 for(let i=0;i<3;i++)await order.filter({hasText:'Временен входен код'}).getByText('↑').click();
 await expect(order.nth(0)).toContainText('Временен входен код');
 await order.nth(0).getByText('↑').click();
 await expect(order.nth(0)).toContainText('Временен входен код');
 for(let i=0;i<2;i++)await order.filter({hasText:'Асансьорът'}).getByText('↑').click();
 await expect(order.nth(1)).toContainText('Асансьорът');
 const bottomTitle=await order.nth(3).locator('strong').textContent();
 await order.nth(3).getByText('↓').click();
 await expect(order.nth(3)).toContainText(bottomTitle||'');
 await expect(order.nth(3)).toContainText('Автоматично заключване');
 await workbench.getByRole('button',{name:/Провери решението/}).click();
 await expect(workbench.getByText('РЕШЕНО ✓')).toBeVisible();
 await expect(page.getByRole('status')).toContainText('доказателствена последователност');
});
