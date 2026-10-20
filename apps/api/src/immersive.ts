import { z } from 'zod';

export type ImmersiveState = {
  inventory: string[];
  inspected: string[];
  solved: string[];
  discoveries: string[];
  trust: Record<string, number>;
  dialogue: { personId: string; choiceId: string; reply: string; at: string }[];
  dialogueFlags: string[];
  terminalSearches: number;
};
export const newImmersiveState = (): ImmersiveState => ({
  inventory: [], inspected: [], solved: [], discoveries: [],
  trust: { martin: 40, elena: 45, petar: 55 }, dialogue: [], dialogueFlags: [],
  terminalSearches: 0
});
export const tools = [
  { id: 'brass_key', title: 'Месингов ключ', detail: 'Малък ключ, скрит под изтривалката.', icon: 'key' },
  { id: 'magnifier', title: 'Джобна лупа', detail: 'Оптично увеличение за дребни подробности.', icon: 'search' },
  { id: 'negative', title: 'Фото негатив', detail: 'Полупрозрачен кадър от бюрото.', icon: 'image' },
  { id: 'uv_lamp', title: 'UV фенер', detail: 'Преносим фенер за скрити мастила.', icon: 'light' },
  { id: 'cipher_strip', title: 'Хартиена лента', detail: 'Откъснат фрагмент с незабележими знаци.', icon: 'file' }
] as const;
export const sceneObjects = [
  { id: 'doormat', room: 'hall', title: 'Изтривалка', summary: 'Повдигни ъгъла ѝ.', item: 'brass_key', prerequisite: '', requiresItem: '', x: 49, y: 82 },
  { id: 'bookshelf', room: 'living', title: 'Библиотека', summary: 'Огледай предметите по рафтовете.', item: 'magnifier', prerequisite: '', requiresItem: '', x: 20, y: 44 },
  { id: 'lamp', room: 'living', title: 'Работна лампа', summary: 'Провери стария фенер до фотьойла.', item: 'uv_lamp', prerequisite: '', requiresItem: '', x: 76, y: 65 },
  { id: 'drawer', room: 'study', title: 'Заключено чекмедже', summary: 'Ключалката изглежда запазена.', item: 'negative', prerequisite: '', requiresItem: 'brass_key', x: 76, y: 72 },
  { id: 'papers', room: 'study', title: 'Разпилени бележки', summary: 'Има откъснати листове от документ.', item: 'cipher_strip', prerequisite: 'E04', requiresItem: '', x: 50, y: 70 },
  { id: 'safe', room: 'study', title: 'Метална кутия', summary: 'Отворът има механичен цифров циферблат.', item: '', prerequisite: '', requiresItem: '', x: 85, y: 41 }
] as const;
export const rooms = [
  { id: 'hall', title: 'Антре', subtitle: 'Зона на влизане' },
  { id: 'living', title: 'Всекидневна', subtitle: 'Лични вещи и библиотека' },
  { id: 'study', title: 'Работен кът', subtitle: 'Бюро и документи' }
] as const;
export const combinations = [
  { id: 'photo_detail', first: 'magnifier', second: 'negative', title: 'Разчетен негатив', result: 'В негативa се вижда хартиена папка на бюро. Сам по себе си кадърът не доказва кой я е оставил.' },
  { id: 'uv_marker', first: 'uv_lamp', second: 'cipher_strip', title: 'Скрит знак', result: 'Под UV светлина се виждат символите „3 · 7 · 1“. Може да са код към металната кутия.' }
] as const;
export const safePuzzle = { id: 'safe_dial', name: 'Механична кутия', kind: 'dial', hint: 'Три въртящи се циферблата. Огледай намерените предмети за реда на цифрите.' };
export const interactionSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('inspect'), objectId: z.string().max(32) }),
  z.object({ kind: z.literal('combine'), first: z.string().max(32), second: z.string().max(32) }),
  z.object({ kind: z.literal('puzzle'), puzzleId: z.literal('safe_dial'), digits: z.array(z.number().int().min(0).max(9)).length(3) })
]);
export function interaction(state: ImmersiveState, found: ReadonlySet<string>, data: z.infer<typeof interactionSchema>) {
  if (data.kind === 'inspect') {
    const object = sceneObjects.find(o => o.id === data.objectId);
    if (!object) return { status: 404, message: 'Непознат предмет.' };
    if (object.prerequisite && !found.has(object.prerequisite))
      return { status: 403, message: 'Нужно е да откриеш съответния документ преди огледа.' };
    if (object.requiresItem && !state.inventory.includes(object.requiresItem))
      return { status: 403, message: 'Липсва предмет, с който да отвориш механизма.' };
    if (object.id === 'safe') return { status: 200, message: 'Кутията се отваря чрез трите циферблата в раздел „Пъзели“.' };
    if (!state.inspected.includes(object.id)) state.inspected.push(object.id);
    if (object.item && !state.inventory.includes(object.item)) state.inventory.push(object.item);
    return { status: 200, message: object.item ? 'Добавен предмет в инвентара.' : 'Обектът е разгледан.' };
  }
  if (data.kind === 'combine') {
    if (!state.inventory.includes(data.first) || !state.inventory.includes(data.second) || data.first === data.second)
      return { status: 403, message: 'Двата предмета трябва да са в инвентара.' };
    const combination = combinations.find(c =>
      (c.first === data.first && c.second === data.second) || (c.first === data.second && c.second === data.first));
    if (!combination) return { status: 422, message: 'Тези предмети не образуват смислена комбинация.' };
    if (!state.discoveries.includes(combination.id)) state.discoveries.push(combination.id);
    return { status: 200, message: combination.result };
  }
  if (!state.discoveries.includes('uv_marker'))
    return { status: 403, message: 'Нямаш необходимия контекст, за да разчетеш кода.' };
  if (data.digits.join('') !== '371')
    return { status: 422, message: 'Циферблатът не освобождава ключалката.' };
  if (!state.solved.includes(safePuzzle.id)) state.solved.push(safePuzzle.id);
  return { status: 200, message: 'Металната кутия е отворена. Вътре има бележка за разминаващи се финансови отчети. Не е доказателство за самоличност.' };
}

export const dialogueOptions = [
  { id: 'martin_intro', personId: 'martin', label: 'Попитай спокойно за работния ден', needs: [] as string[], requiresTrust: 0, delta: 9, reply: 'Работихме върху фактури. Не харесвах напрежението, но опитвахме да приключим задачите.' },
  { id: 'martin_threat', personId: 'martin', label: 'Обвини го без доказателства', needs: [] as string[], requiresTrust: 0, delta: -23, reply: 'Няма да обсъждам спекулации. Искам да видя доказателствата ви.' },
  { id: 'martin_facts', personId: 'martin', label: 'Предяви съобщението за фактурите', needs: ['E04'], requiresTrust: 32, delta: 6, reply: 'Да, получих съобщението. Той настояваше да донеса оригиналите, но това не доказва какво се е случило.' },
  { id: 'martin_conflict', personId: 'martin', label: 'Сравни съобщението с черновата', needs: ['E04','E09'], requiresTrust: 45, delta: -4, reply: 'Спорът съществуваше. Не исках тази чернова да се появява пред ръководството.' },
  { id: 'elena_empathy', personId: 'elena', label: 'Попитай с разбиране за отношенията', needs: [] as string[], requiresTrust: 0, delta: 13, reply: 'Раздялата беше трудна. Не съм искала да се връщам към този разговор.' },
  { id: 'elena_call', personId: 'elena', label: 'Предяви регистъра на обажданията', needs: ['E03'], requiresTrust: 45, delta: 2, reply: 'Да, говорихме. Пропуснах го при първия разпит, защото ме беше страх от погрешен извод.' },
  { id: 'petar_noise', personId: 'petar', label: 'Попитай за чутия шум', needs: [] as string[], requiresTrust: 0, delta: 7, reply: 'Чух шум от съседния апартамент, но часът е приблизителен.' },
  { id: 'petar_time', personId: 'petar', label: 'Сравни времето с дневника на вратата', needs: ['E08'], requiresTrust: 50, delta: 3, reply: 'Не мога да кажа дали шумът е бил преди или след заключването.' }
] as const;
export const dialogueSchema = z.object({ choiceId: z.string().min(2).max(40) });
export function chooseDialogue(state: ImmersiveState, found: ReadonlySet<string>, choiceId: string) {
  const choice = dialogueOptions.find(d => d.id === choiceId);
  if (!choice) return { status: 404, message: 'Невалиден избор.' };
  if (choice.needs.some(id => !found.has(id))) return { status: 403, message: 'Липсват доказателства за този въпрос.' };
  const currentTrust = state.trust[choice.personId] ?? 40;
  if (currentTrust < choice.requiresTrust) return { status: 403, message: 'Свидетелят не желае да обсъжда темата. Възстанови доверието.' };
  if (state.dialogueFlags.includes(choice.id)) return { status: 409, message: 'Този разговор вече е проведен.' };
  if (state.dialogue.length >= 32) return { status: 429, message: 'Лимитът за допълнителни разговори е достигнат.' };
  state.trust[choice.personId] = Math.min(100, Math.max(0, currentTrust + choice.delta));
  state.dialogueFlags.push(choice.id);
  state.dialogue.push({ personId: choice.personId, choiceId: choice.id, reply: choice.reply, at: new Date().toISOString() });
  return { status: 200, message: choice.reply };
}

export const policeRecords = [
  { id: 'R-101', category: 'Достъп', title: 'Временен входен код', requires: ['E05'], body: 'В 01:09 е използван временен код. Системата не идентифицира физически посетителя.' },
  { id: 'R-102', category: 'Видео', title: 'Камера — асансьор', requires: ['E06'], body: 'В 01:12 е засечена фигура с диагонална презрамка, без надеждно лицево разпознаване.' },
  { id: 'R-103', category: 'Финанси', title: 'Проверка на оригинални фактури', requires: ['E04','E09'], body: 'Документална кореспонденция и подготвяна чернова за финансови несъответствия.' },
  { id: 'R-104', category: 'Телефон', title: 'Телефонен регистър 01:17', requires: ['E03'], body: 'Обаждане с Елена с продължителност 18 секунди, без съхранено съдържание.' },
  { id: 'R-105', category: 'Сигурност', title: 'Регистър на ключалката', requires: ['E08'], body: '01:28 — автоматично затваряне. Няма потвърдено ръчно заключване.' },
  { id: 'R-106', category: 'Медицина', title: 'Ориентировъчна оценка', requires: ['E02'], body: 'Интервал 01:20–01:25; оценката съдържа неопределеност.' }
] as const;
export const searchSchema = z.object({ query: z.string().trim().min(2).max(80) });
export function searchRecords(found: ReadonlySet<string>, query: string) {
  const term = query.toLocaleLowerCase('bg-BG');
  return policeRecords.filter(r => r.requires.every(e => found.has(e)) &&
    (r.title + ' ' + r.category + ' ' + r.body).toLocaleLowerCase('bg-BG').includes(term));
}

export function immersiveSnapshot(state: ImmersiveState, found: ReadonlySet<string>) {
  return {
    rooms,
    objects: sceneObjects.map(o => ({
      id: o.id, room: o.room, title: o.title, summary: o.summary, x: o.x, y: o.y,
      inspected: state.inspected.includes(o.id),
      locked: !!o.prerequisite && !found.has(o.prerequisite),
      requiresItem: o.requiresItem || null
    })),
    inventory: tools.filter(t => state.inventory.includes(t.id)),
    combinations: combinations.filter(c => state.discoveries.includes(c.id)).map(c => ({
      id: c.id, title: c.title, result: c.result
    })),
    dial: { ...safePuzzle, unlocked: state.discoveries.includes('uv_marker'), solved: state.solved.includes('safe_dial') },
    trust: state.trust,
    dialogues: dialogueOptions.map(d => ({
      id: d.id, personId: d.personId, label: d.label,
      available: d.needs.every(id => found.has(id)) && (state.trust[d.personId] ?? 40) >= d.requiresTrust,
      done: state.dialogueFlags.includes(d.id),
      needs: d.needs
    })),
    history: state.dialogue,
    terminalSearches: state.terminalSearches
  };
}
