import { z } from 'zod';
import { evidence } from './case.js';

export const noteSchema = z.object({
  title: z.string().trim().min(2).max(100),
  body: z.string().trim().min(1).max(2000),
  category: z.enum(['hypothesis','lead','question']).default('hypothesis')
});
export type Note = z.infer<typeof noteSchema> & { id: string; updatedAt: string };

export const suspects = [
  {
    id: 'martin', name: 'Мартин Русев', age: 34, occupation: 'Колега на Никола',
    relationship: 'Работили са заедно по финансови документи.',
    alibi: 'Твърди, че през нощта е бил у дома.',
    personality: 'Сдържан; избягва директни въпроси за работа.',
    portrait: 'MR', color: 'amber',
    relevantIds: ['E04', 'E05', 'E09', 'E10']
  },
  {
    id: 'elena', name: 'Елена Вълчева', age: 27, occupation: 'Бивша партньорка',
    relationship: 'Разделили са се няколко месеца по-рано.',
    alibi: 'Твърди, че не е посещавала апартамента.',
    personality: 'Предпазлива по лични теми.',
    portrait: 'EV', color: 'rose',
    relevantIds: ['E03', 'E11']
  },
  {
    id: 'petar', name: 'Петър Добрев', age: 45, occupation: 'Съсед',
    relationship: 'Живее в съседство с апартамент 407.',
    alibi: 'Казва, че е чул шум, но не помни точния час.',
    personality: 'Несигурен за часовете; внимателен в показанията.',
    portrait: 'PD', color: 'slate',
    relevantIds: ['E12', 'E08']
  }
] as const;

export const contradictions = [
  {
    id: 'C01', personId: 'elena', title: 'Отреченият разговор',
    statement: 'Елена първоначално отрича контакт с Никола.',
    finding: 'Телефонният регистър показва разговор в 01:17. Това е противоречие в показанията, но само по себе си не доказва вина.',
    evidenceIds: ['E03','E11'], kind: 'contradiction'
  },
  {
    id: 'C02', personId: 'martin', title: 'Неизяснено алиби',
    statement: 'Мартин твърди, че е бил вкъщи през нощта.',
    finding: 'Уговорката за документи и активиран временен код изискват допълнителна проверка. Кодът не доказва кой го е използвал.',
    evidenceIds: ['E04','E05','E10'], kind: 'lead'
  }
] as const;

export function availableContradictions(found: Set<string>) {
  return contradictions.map(c => ({
    ...c,
    ready: c.evidenceIds.every(id => found.has(id)),
    supporting: c.evidenceIds.filter(id => found.has(id))
  }));
}

export function scoreCase(args: {
  found: Set<string>;
  links: Set<string>;
  interviews: Record<string, unknown[]>;
  verified: Set<string>;
  verdict: string;
}) {
  const evidencePoints = Math.round(Math.min(args.found.size, evidence.length) / evidence.length * 30);
  const deductionPoints = Math.round(Math.min(args.links.size, 5) / 5 * 25);
  const interviewPoints = Math.min(Object.values(args.interviews).filter(lines => lines.length >= 2).length, 3) * 5;
  const verificationPoints = Math.min(args.verified.size, 2) * 7.5;
  const resolutionPoints = args.verdict === 'solved' ? 15 : 0;
  const raw = evidencePoints + deductionPoints + interviewPoints + verificationPoints + resolutionPoints;
  const total = args.verdict === 'solved' ? Math.round(raw) : Math.min(Math.round(raw), 49);
  return {
    total,
    rank: total >= 90 ? 'Легендарен следовател' : total >= 70 ? 'Старши детектив' : total >= 50 ? 'Детектив' : 'Стажант следовател',
    categories: [
      { name: 'Събрани доказателства', earned: evidencePoints, max: 30 },
      { name: 'Логически връзки', earned: deductionPoints, max: 25 },
      { name: 'Проведени разпити', earned: interviewPoints, max: 15 },
      { name: 'Проверени алибита', earned: verificationPoints, max: 15 },
      { name: 'Заключение', earned: resolutionPoints, max: 15 }
    ]
  };
}
