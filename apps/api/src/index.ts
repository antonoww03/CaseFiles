import express from 'express';
import cors from 'cors';
import { randomUUID } from 'node:crypto';
import { publicCase, evidence, accusationSchema, messageSchema, evaluate } from './case.js';

type Session = { id: string; found: Set<string>; messages: Record<string, { role: string; text: string }[]> };
const sessions = new Map<string, Session>();
const app = express();
app.disable('x-powered-by');
app.use(cors({ origin: process.env.WEB_ORIGIN || 'http://localhost:5173' }));
app.use(express.json({ limit: '16kb' }));

function getSession(req: express.Request, res: express.Response): Session | undefined {
  const id = req.header('x-case-session');
  const session = id ? sessions.get(id) : undefined;
  if (!session) res.status(401).json({ error: 'Невалидна или изтекла сесия.' });
  return session;
}

app.get('/api/health', (_req, res) => res.json({ ok: true, mode: 'scripted-demo' }));
app.get('/api/case', (_req, res) => res.json(publicCase));
app.post('/api/session', (_req, res) => {
  const id = randomUUID();
  sessions.set(id, { id, found: new Set(), messages: {} });
  res.status(201).json({ sessionId: id, found: [] });
});
app.get('/api/session', (req, res) => {
  const session = getSession(req, res);
  if (session) res.json({ found: [...session.found], messages: session.messages });
});
app.get('/api/evidence', (req, res) => {
  const session = getSession(req, res);
  if (!session) return;
  res.json(evidence.filter(item => session.found.has(item.id)));
});
app.post('/api/discover/:id', (req, res) => {
  const session = getSession(req, res);
  if (!session) return;
  const item = evidence.find(item => item.id === req.params.id);
  if (!item) return void res.status(404).json({ error: 'Неизвестна улика.' });
  if (item.source === 'interview') return void res.status(403).json({ error: 'Тази улика се придобива чрез разпит.' });
  session.found.add(item.id);
  res.json({ evidence: item, found: [...session.found] });
});
app.post('/api/interview', (req, res) => {
  const session = getSession(req, res);
  if (!session) return;
  const parsed = messageSchema.safeParse(req.body);
  if (!parsed.success) return void res.status(400).json({ error: 'Невалиден въпрос.' });
  const { personId, message, evidenceId } = parsed.data;
  if (evidenceId && !session.found.has(evidenceId)) return void res.status(403).json({ error: 'Уликата още не е открита.' });
  const normalized = message.toLocaleLowerCase('bg');
  let reply = '';
  if (personId === 'martin') {
    reply = evidenceId === 'E04' || evidenceId === 'E05' || evidenceId === 'E10'
      ? 'Добре, бяхме се уговорили за фактурите. Може да съм бил там за кратко, но това не означава, че съм му причинил нещо.'
      : normalized.includes('фактур') || normalized.includes('работ')
      ? 'Имахме служебно несъгласие. Това не е престъпление.'
      : 'Казах ви, бях вкъщи. Не виждам защо се съмнявате в мен.';
  } else if (personId === 'elena') {
    reply = evidenceId === 'E03'
      ? 'Да, говорихме по телефона. Първоначално не го споменах, защото беше личен разговор. Чух, че при него има колега.'
      : normalized.includes('обаж') || normalized.includes('телефон')
      ? 'Не искам да обсъждам личните ни отношения. Какво общо има това?'
      : 'Не съм била в апартамента през нощта.';
    session.found.add('E11');
  } else {
    reply = normalized.includes('час') || normalized.includes('шум')
      ? 'Чух спор, някъде след един часа. Не мога да твърдя точната минута.'
      : 'Не съм видял кой е излизал. Повиках помощ, когато не получих отговор.';
    session.found.add('E12');
  }
  const history = session.messages[personId] ?? [];
  history.push({ role: 'player', text: message }, { role: 'npc', text: reply });
  session.messages[personId] = history.slice(-40);
  res.json({ reply, found: [...session.found], mode: 'scripted-demo' });
});
app.post('/api/accusation', (req, res) => {
  const session = getSession(req, res);
  if (!session) return;
  const parsed = accusationSchema.safeParse(req.body);
  if (!parsed.success) return void res.status(400).json({ error: 'Попълни заподозрян, мотив, хронология и поне три улики.' });
  const { suspectId, motive, timeline, evidenceIds } = parsed.data;
  if (evidenceIds.some(id => !session.found.has(id))) return void res.status(403).json({ error: 'Можеш да използваш само открити улики.' });
  res.json(evaluate(suspectId, evidenceIds, motive, timeline));
});
app.use((_req, res) => res.status(404).json({ error: 'Няма такъв маршрут.' }));
const port = Number(process.env.PORT || 3001);
app.listen(port, () => process.stdout.write('CASEFILES API listening on '+port+'\n'));
