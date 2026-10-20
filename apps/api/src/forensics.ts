import { z } from 'zod';

export const clipObservations = [
  {
    id: 'elevator', title: 'Камера 04 — асансьор', place: 'Асансьор / партер → етаж 4', start: '01:10', end: '01:14',
    targetEvidence: 'E06', correctSecond: 120,
    frames: [
      { second: 0, clock: '01:10:00', visual: 'Празен асансьор. Вратите са отворени.', details: ['врати', 'етаж'] },
      { second: 60, clock: '01:11:00', visual: 'Вратите се затварят. Силен отблясък закрива част от кадъра.', details: ['отблясък','врати'] },
      { second: 120, clock: '01:12:00', visual: 'Фигура с диагонална презрамка влиза в асансьора.', details: ['презрамка','палто'] },
      { second: 180, clock: '01:13:00', visual: 'Камерата показва спрян асансьор на четвъртия етаж.', details: ['етаж','врати'] },
      { second: 240, clock: '01:14:00', visual: 'Кадърът е празен. Няма други посетители.', details: ['врати','етаж'] }
    ]
  },
  {
    id: 'exit', title: 'Камера 01 — вход', place: 'Вход на сградата', start: '01:27', end: '01:31',
    targetEvidence: 'E07', correctSecond: 120,
    frames: [
      { second: 0, clock: '01:27:00', visual: 'Входната врата е затворена. Коридорът е празен.', details: ['врата','коридор'] },
      { second: 60, clock: '01:28:00', visual: 'Автоматичната врата преминава към затворено положение.', details: ['врата','коридор'] },
      { second: 120, clock: '01:29:00', visual: 'Неясна фигура със светла диагонална презрамка напуска сградата.', details: ['презрамка','врата'] },
      { second: 180, clock: '01:30:00', visual: 'Фигурата вече е извън обхвата на камерата.', details: ['врата','коридор'] },
      { second: 240, clock: '01:31:00', visual: 'Няма движение. Записът завършва.', details: ['врата','коридор'] }
    ]
  }
] as const;

export const documents = [
  {
    id: 'draft', title: 'Чернова на финансов сигнал', category: 'Служебен документ', clueId: 'E09',
    requires: ['E04'], publicSummary: 'Запечатана служебна папка, намерена при огледа.',
    pages: [
      { id: 'header', label: 'Заглавна страница', content: 'До ръководството: сигнал за установени несъответствия. Подготвен от Никола Тодоров.', finding: 'Авторът обмисля подаване на сигнал.' },
      { id: 'table', label: 'Приложение: фактури', content: 'Необходимо е сравнение между оригиналните фактури и служебните записи. Отбелязано за допълнителна проверка.', finding: 'Съществува спор за оригиналните фактури.' },
      { id: 'signature', label: 'Бележка под линия', content: 'Бележка: поискайте оригиналните документи от Мартин Русев преди окончателно подписване.', finding: 'Черновата свързва предстоящата среща с Мартин и фактурите.' }
    ],
    revealPage: 'signature'
  },
  {
    id: 'access', title: 'Регистър на временните пропуски', category: 'Системен доклад', clueId: 'E10',
    requires: ['E05'], publicSummary: 'Извлечение от системата за контрол на достъпа.',
    pages: [
      { id: 'header', label: 'Заявка', content: 'Временен входен код. Регистрирано посещение в жилищна сграда.', finding: 'Кодът е временен.' },
      { id: 'record', label: 'Регистър', content: 'Входен код активиран в 01:09. Уговорено посещение. Системата не идентифицира физически кой е използвал кода.', finding: 'Входният код е използван, но самоличността не е доказана.' }
    ],
    revealPage: 'record'
  }
] as const;

export const observationSchema = z.object({
  second: z.number().int().min(0).max(240),
  detail: z.string().min(2).max(30)
});
export function frameFor(clipId: string, second: number) {
  const clip = clipObservations.find(c => c.id === clipId);
  if (!clip) return null;
  return clip.frames.reduce<(typeof clip.frames)[number]>((last, next) => second >= next.second ? next : last, clip.frames[0]);
}
export function verifyObservation(clipId: string, second: number, detail: string): string | null {
  const clip = clipObservations.find(c => c.id === clipId);
  if (!clip) return null;
  if (Math.abs(second - clip.correctSecond) > 7 || detail !== 'презрамка') return null;
  return clip.targetEvidence;
}
export function documentPage(documentId: string, pageId: string) {
  const document = documents.find(d => d.id === documentId);
  if (!document) return null;
  return document.pages.find(p => p.id === pageId) ?? null;
}

export const hintLevels = [
  { level: 1, title: 'Посока', text: 'Провери помещенията в апартамента и започни с документите от огледа. Разговорът от 01:17 не установява кой е бил на място.' },
  { level: 2, title: 'Съпоставка', text: 'За да получиш всички записи, прегледай камерите в криминалистичния модул и търси общ видим детайл между кадрите.' },
  { level: 3, title: 'Следваща стъпка', text: 'Свържи финансовата чернова със съобщението, а входния код със записа от асансьора. Провери и несъответствията в показанията.' }
] as const;

export const actualCaseTimeline = [
  { time:'00:42', event:'Никола иска от Мартин да донесе оригиналните фактури.' },
  { time:'01:09', event:'Временен код се използва за входа на сградата.' },
  { time:'01:12', event:'Записът от асансьора показва човек с презрамка.' },
  { time:'01:17', event:'Никола разговаря по телефона с Елена.' },
  { time:'01:20–01:25', event:'Ориентировъчен период на смъртта.' },
  { time:'01:28', event:'Вратата се заключва автоматично.' },
  { time:'01:29', event:'Човек с подобна презрамка напуска сградата.' },
  { time:'02:37', event:'Тялото е открито.' }
] as const;
