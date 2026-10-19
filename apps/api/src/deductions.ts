export type Deduction = {
  id: string;
  title: string;
  explanation: string;
  evidenceIds: readonly [string, string];
};

export const deductions: readonly Deduction[] = [
  {
    id: 'D01',
    title: 'Финансов мотив',
    explanation: 'Съобщението за оригинални фактури съвпада с подготвения сигнал за финансови несъответствия.',
    evidenceIds: ['E04', 'E09']
  },
  {
    id: 'D02',
    title: 'Съвпадение на присъствието',
    explanation: 'Входният код и записът от асансьора очертават възможно влизане на посетител в 01:09–01:12.',
    evidenceIds: ['E05', 'E06']
  },
  {
    id: 'D03',
    title: 'Възможно напускане',
    explanation: 'Автоматичното заключване предхожда появата на фигура пред входа; затворената врата не доказва липса на посетител.',
    evidenceIds: ['E07', 'E08']
  },
  {
    id: 'D04',
    title: 'Противоречие в показанията',
    explanation: 'Първоначалното отрицание на Елена не съвпада с телефонния регистър. Това не доказва участие в убийството.',
    evidenceIds: ['E03', 'E11']
  },
  {
    id: 'D05',
    title: 'Интервал на събитията',
    explanation: 'Приблизителният час на смъртта попада между засеченото пристигане и евентуалното напускане.',
    evidenceIds: ['E02', 'E06']
  }
];

export function findDeduction(first: string, second: string): Deduction | undefined {
  if (first === second) return undefined;
  return deductions.find(item => item.evidenceIds.includes(first) && item.evidenceIds.includes(second));
}
