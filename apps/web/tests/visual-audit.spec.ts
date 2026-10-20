import {expect,test} from '@playwright/test';

const rooms=['living','desk','entrance','medical','reading','server','security','hall','lift','studio'];
const objects=['lamp','bookshelf','doormat','drawer','papers','safe','phone','evidence','terminal','logbook','cctv','cart','contract','footprint'];
const props=['phone','documents','negative','film','key','archive'];

test('all room, item, dossier and prop artwork files load as valid SVG',async({request})=>{
 const paths=[
  ...rooms.map(id=>'/art/rooms/'+id+'.svg'),
  ...objects.map(id=>'/art/objects/'+id+'.svg'),
  ...props.map(id=>'/art/props/'+id+'.svg'),
  '/art/apartment-noir.svg','/art/archive-noir.svg','/favicon.svg'
 ];
 for(const path of paths){
  const res=await request.get(path);
  expect(res.ok(),path+' failed to load').toBeTruthy();
  const svg=await res.text();
  expect(svg,path+' contains no actual vector paths').toContain('<svg');
  expect(svg,path+' missing shapes').toMatch(/<(path|rect|circle|ellipse)/);
 }
});

test('lamp and other scene objects are actual visible artwork, not detached floating icons',async({page})=>{
 const errors:string[]=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/');
 await page.getByRole('button',{name:/Започни разследването/}).click();
 await page.getByRole('button',{name:/Влез в разследването/}).click();
 const room=page.locator('.x11-scene');
 await expect(room).toHaveCSS('background-image',/rooms\/living\.svg/);
 for(const label of ['Работна лампа','Библиотека']){
  const object=page.getByRole('button',{name:'Взаимодействай с '+label});
  await expect(object).toBeVisible();
  const artwork=object.locator('img.cf-object-art');
  await expect(artwork).toHaveAttribute('src',/\/art\/objects\/(lamp|bookshelf)\.svg/);
  await expect.poll(()=>artwork.evaluate((img:HTMLImageElement)=>img.complete&&img.naturalWidth>0)).toBeTruthy();
  const box=await artwork.boundingBox();const scene=await room.boundingBox();
  expect(box).toBeTruthy();expect(scene).toBeTruthy();
  expect(box!.x+box!.width/2).toBeGreaterThan(scene!.x);
  expect(box!.x+box!.width/2).toBeLessThan(scene!.x+scene!.width);
  expect(box!.y+box!.height/2).toBeGreaterThan(scene!.y);
  expect(box!.y+box!.height/2).toBeLessThan(scene!.y+scene!.height);
 }
 await page.getByRole('button',{name:'Взаимодействай с Работна лампа'}).click();
 await expect(page.locator('.x11-scene').getByRole('button',{name:'Взаимодействай с Работна лампа'})).toHaveClass(/done/);
 expect(errors).toEqual([]);
});

test('evidence, interviews, phone, forensics and final tab render without broken artwork',async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/');
 await page.getByRole('button',{name:/Започни разследването/}).click();
 await page.getByRole('button',{name:/Влез в разследването/}).click();
 const nav=page.getByRole('navigation',{name:'Игрови раздели'});
 for(const [tab,heading] of [
  [/Досие/,/Следствено досие/],
  [/Криминалистика/,/Криминалистика 407/],
  [/Разпити/,/Очите не лъжат/],
  [/Телефон/,/Телефонът на Никола/],
  [/Финал/,/Последното решение/]
 ] as const){
  await nav.getByRole('button',{name:tab}).click();
  await expect(page.getByRole('heading',{name:heading})).toBeVisible();
  const broken=await page.locator('img:visible').evaluateAll(images=>images.filter(img=>!(img as HTMLImageElement).complete||(img as HTMLImageElement).naturalWidth===0).map(img=>img.getAttribute('src')));
  expect(broken).toEqual([]);
 }
 expect(errors).toEqual([]);
});

test('case two has specific visible documents, computer and surveillance objects on mobile',async({page})=>{
 await page.setViewportSize({width:390,height:844});
 await page.goto('/');
 await page.getByRole('button',{name:/Избери случай/}).click();
 await page.getByRole('group',{name:'Избор на случай'}).getByRole('button',{name:/Изчезналият архив/}).click();
 await page.getByRole('button',{name:/Започни разследването/}).click();
 await page.getByRole('button',{name:/Влез в разследването/}).click();
 const scene=page.locator('.r10-scene-art');
 await expect(scene).toHaveCSS('background-image',/rooms\/reading\.svg/);
 await expect(scene.locator('.cf-object-art')).toHaveAttribute('src','/art/objects/contract.svg');
 await page.getByRole('button',{name:'Сървърна',exact:true}).click();
 await expect(scene).toHaveCSS('background-image',/rooms\/server\.svg/);
 await expect(scene.locator('.cf-object-art')).toHaveAttribute('src','/art/objects/terminal.svg');
 await page.getByRole('button',{name:'Пост охрана',exact:true}).click();
 await expect(scene).toHaveCSS('background-image',/rooms\/security\.svg/);
 await expect(scene.locator('.cf-object-art')).toHaveAttribute('src','/art/objects/logbook.svg');
});
