import { z } from 'zod';

export const people = [
  { id: 'martin', name: 'Мартин Русев', role: 'Колега', initial: 'М', opening: 'Не виждам какво мога да добавя. Бях си вкъщи през нощта.' },
  { id: 'elena', name: 'Елена Вълчева', role: 'Бивша партньорка', initial: 'Е', opening: 'Не сме заедно от месеци. Защо ме разпитвате?' },
  { id: 'petar', name: 'Петър Добрев', role: 'Съсед', initial: 'П', opening: 'Чух шум откъм апартамента, но не погледнах часовника.' }
] as const;

export const evidence = [
  { id: 'E01', title: 'Протокол от огледа', type: 'Документ', detail: 'Апартаментът е намерен заключен. Няма следи от взлом.', source: 'scene', icon: '▤' },
  { id: 'E03', title: 'Последно обаждане', type: 'Телефон', detail: 'В 01:17 е проведен 18-секунден разговор с Елена. Записът не разкрива съдържанието.', source: 'scene', icon: '☎' },
  { id: 'E04', title: 'Съобщение 00:42', type: 'Кореспонденция', detail: 'Никола е поискал от Мартин да донесе оригиналните фактури.', source: 'scene', icon: '✉' },
  { id: 'E08', title: 'Дневник на ключалката', type: 'Системен лог', detail: 'В 01:28 входната врата се затваря и заключва автоматично.', source: 'scene', icon: '⚿' },
  { id: 'E09', title: 'Финансова чернова', type: 'Документ', detail: 'Никола е подготвял сигнал за несъответствия по фактури.', source: 'scene', icon: '▥' },
  { id: 'E05', title: 'Дневник на входния код', type: 'Системен лог', detail: 'В 01:09 временен код отваря входа на сградата.', source: 'lab', icon: '⌁' },
  { id: 'E06', title: 'Камера: асансьор', type: 'Видео', detail: 'В 01:12 човек със светла диагонална презрамка се качва към четвъртия етаж.', source: 'lab', icon: '▣' },
  { id: 'E07', title: 'Камера: вход', type: 'Видео', detail: 'В 01:29 човек със сходна презрамка напуска сградата. Лицето е неясно.', source: 'lab', icon: '▣' },
  { id: 'E10', title: 'Карта на пропуските', type: 'Регистър', detail: 'Временният код е издаден за уговорено посещение. Не доказва самостоятелно самоличност.', source: 'lab', icon: '▦' },
  { id: 'E02', title: 'Съдебномедицинска оценка', type: 'Експертиза', detail: 'Ориентировъчният интервал на смъртта е 01:20–01:25; оценката не е точна до минута.', source: 'lab', icon: '✚' },
  { id: 'E11', title: 'Показания на Елена', type: 'Протокол', detail: 'Първоначално Елена отрича контакт, въпреки че телефонният регистър показва разговор.', source: 'interview', icon: '◈' },
  { id: 'E12', title: 'Показания на Петър', type: 'Протокол', detail: 'Петър посочва приблизително време на шума, но не е сигурен за минутата.', source: 'interview', icon: '◈' }
] as const;

export const publicCase = {
  id: 'case-001',
  title: 'Последното обаждане',
  location: 'София',
  date: '14 октомври 2026',
  briefing: '29-годишният Никола Тодоров е открит мъртъв в апартамент 407 в 02:37. Няма следи от взлом. Последното му обаждане е в 01:17. Трима души са свързани със случая.',
  people
};

export const accusationSchema = z.object({
  suspectId: z.enum(['martin', 'elena', 'petar']),
  motive: z.string().trim().min(12).max(1200),
  evidenceIds: z.array(z.string()).min(3).max(12),
  timeline: z.string().trim().min(12).max(1200)
});
export const messageSchema = z.object({
  personId: z.enum(['martin', 'elena', 'petar']),
  message: z.string().trim().min(1).max(600),
  evidenceId: z.string().optional()
});
export function evaluate(suspectId: string, ids: string[], motive: string, timeline: string, links: string[] = []) {
  const selected = new Set(ids);
  const evidenceGroups = [
    ['E04', 'E09'],
    ['E05', 'E06', 'E10'],
    ['E02', 'E07', 'E08']
  ];
  const hasGroups = evidenceGroups.every(group => group.some(id => selected.has(id)));
  const grounded = motive.trim().length >= 12 && timeline.trim().length >= 12;
  const hasReasoning = links.includes('D01') && ['D02','D03','D05'].some(id => links.includes(id));
  return suspectId !== 'martin'
    ? { status: 'incorrect', title: 'Неправилно обвинение', explanation: 'Избраните доказателства не установяват вина на посочения човек.' }
    : !hasGroups || !grounded || !hasReasoning
      ? { status: 'insufficient', title: 'Недостатъчна обосновка', explanation: 'Нужни са доказателства, обяснения и поне две установени връзки в дъската — за мотив и хронология.' }
      : { status: 'solved', title: 'Случаят е разрешен', explanation: 'Доказателствата подкрепят финансовия мотив, присъствието и ключовите времеви събития.' };
}
