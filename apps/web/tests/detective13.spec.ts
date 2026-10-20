import {expect,test} from '@playwright/test';

test('Detective 1.3 opens with locked deductions and contextual first objective',async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/');
 await page.getByRole('button',{name:/Започни разследването/}).click();
 await page.getByRole('button',{name:/Влез в разследването/}).click();
 await expect(page.getByText('ТЕКУЩА СЛЕДСТВЕНА ЦЕЛ')).toBeVisible();
 const nav=page.getByRole('navigation',{name:'Игрови раздели'});
 await nav.getByRole('button',{name:/Детективски режим/}).click();
 await expect(page.getByRole('heading',{name:'Мисли като детектив.'})).toBeVisible();
 await expect(page.getByRole('button',{name:/Никой ли не е влизал/})).toBeDisabled();
 await expect(page.getByText(/Подробният Case Review се отключва/)).toBeVisible();
 expect(errors).toEqual([]);
});

test('Case 002 evidence-gated reasoning supports wrong theories and verifies correct claims',async({page})=>{
 await page.goto('/');
 await page.getByRole('button',{name:/Избери случай/}).click();
 await page.getByRole('group',{name:'Избор на случай'}).getByRole('button',{name:/Изчезналият архив/}).click();
 await page.getByRole('button',{name:/Започни разследването/}).click();
 await page.getByRole('button',{name:/Влез в разследването/}).click();
 await page.getByRole('button',{name:'Изследвай Читалня'}).click();
 await page.getByRole('button',{name:/Събери улика/}).click();
 await page.getByRole('button',{name:'Сървърна',exact:true}).click();
 await page.getByRole('button',{name:'Изследвай Сървърна'}).click();
 await page.getByRole('button',{name:/Събери улика/}).click();
 await page.getByRole('button',{name:'Пост охрана',exact:true}).click();
 await page.getByRole('button',{name:'Изследвай Пост охрана'}).click();
 await page.getByRole('button',{name:/Събери улика/}).click();
 await page.getByRole('navigation',{name:'Игрови раздели'}).getByRole('button',{name:/Детективски режим/}).click();
 const entry=page.getByRole('navigation',{name:'Предизвикателства'}).getByRole('button',{name:/Кой е имал възможност/});
 await expect(entry).toBeEnabled();
 await entry.click();
 await expect(page.getByText(/Кой документ подкрепя съмнение/)).toBeVisible();
 await page.getByRole('group',{name:'Възможни заключения'}).getByRole('button',{name:/Протоколът за затваряне/}).click();
 await page.getByRole('button',{name:/Провери заключението/}).click();
 await expect(page.getByRole('status').filter({hasText:/Нужен е документът/})).toBeVisible();
 await page.getByRole('group',{name:'Възможни заключения'}).getByRole('button',{name:/Разписката за резервния ключ/}).click();
 await page.getByRole('button',{name:/Провери заключението/}).click();
 await expect(page.getByText(/Подписът свързва служител/)).toBeVisible();
 await expect(page.getByRole('navigation',{name:'Предизвикателства'}).getByRole('button',{name:/Кой е имал възможност/})).toContainText('РАЗРЕШЕНО');
});

test('Comparison workspace displays independent found clue images and controls',async({page})=>{
 await page.goto('/');
 await page.getByRole('button',{name:/Избери случай/}).click();
 await page.getByRole('group',{name:'Избор на случай'}).getByRole('button',{name:/Изчезналият архив/}).click();
 await page.getByRole('button',{name:/Започни разследването/}).click();
 await page.getByRole('button',{name:/Влез в разследването/}).click();
 await page.getByRole('button',{name:'Изследвай Читалня'}).click();
 await page.getByRole('button',{name:/Събери улика/}).click();
 await page.getByRole('button',{name:'Сървърна',exact:true}).click();
 await page.getByRole('button',{name:'Изследвай Сървърна'}).click();
 await page.getByRole('button',{name:/Събери улика/}).click();
 await page.getByRole('button',{name:'Пост охрана',exact:true}).click();
 await page.getByRole('button',{name:'Изследвай Пост охрана'}).click();
 await page.getByRole('button',{name:'Сервизен коридор',exact:true}).click();
 await page.getByRole('button',{name:'Изследвай Сервизен коридор'}).click();
 await page.getByRole('button',{name:/Събери улика/}).click();
 await page.getByRole('navigation',{name:'Игрови раздели'}).getByRole('button',{name:/Детективски режим/}).click();
 await page.getByRole('navigation',{name:'Предизвикателства'}).getByRole('button',{name:/Рестарт срещу камера/}).click();
 await page.getByRole('combobox',{name:'Улика 1'}).selectOption('C2');
 await page.getByRole('combobox',{name:'Улика 2'}).selectOption('C4');
 await expect(page.locator('.d13-evidence-pair img')).toHaveCount(2);
 await expect.poll(()=>page.locator('.d13-evidence-pair img').evaluateAll(items=>items.every(item=>(item as HTMLImageElement).complete&&(item as HTMLImageElement).naturalWidth>0))).toBeTruthy();
});

test('responsive screenshot gallery covers all playable tabs at 390px and desktop',async({page},testInfo)=>{
 const pageErrors:string[]=[];page.on('pageerror',e=>pageErrors.push(e.message));
 await page.goto('/');
 await page.getByRole('button',{name:/Започни разследването/}).click();
 await page.getByRole('button',{name:/Влез в разследването/}).click();
 for(const width of [390,1280]){
  await page.setViewportSize({width,height:850});
  const nav=page.getByRole('navigation',{name:'Игрови раздели'});
  for(const [tab,file] of [['Местопрестъпление','scene'],['Досие','evidence'],['Криминалистика','forensics'],['Разпити','interviews'],['Телефон','phone'],['Детективски режим','detective'],['Финал','ending']] as const){
   if(width===390)await page.getByRole('button',{name:'Игрова навигация'}).click();
   await nav.getByRole('button',{name:tab,exact:true}).click();
   const screenshot=await page.screenshot({fullPage:false,animations:'disabled'});
   await testInfo.attach('case001-'+width+'-'+file,{body:screenshot,contentType:'image/png'});
   const broken=await page.locator('img:visible').evaluateAll(images=>images.filter(img=>!(img as HTMLImageElement).complete||(img as HTMLImageElement).naturalWidth===0).map(img=>img.getAttribute('src')));
   expect(broken).toEqual([]);
  }
 }
 expect(pageErrors).toEqual([]);
});
