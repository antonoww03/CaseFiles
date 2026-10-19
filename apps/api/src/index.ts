import express from 'express';
import cors from 'cors';
import { randomUUID } from 'node:crypto';
import { existsSync } from 'node:fs';
import { publicCase, evidence, accusationSchema, messageSchema, evaluate } from './case.js';
import { aiReply, configuredMode, scriptedReply, type InterviewLine } from './interview.js';

type Session = {
  id: string;
  found: Set<string>;
  messages: Record<string, InterviewLine[]>;
  disclosed: Record<string, string[]>;
  lastActive: number;
  interviewCount: number;
  aiCalls: number;
  interviewBusy: boolean;
};
if (existsSync('apps/api/.env')) process.loadEnvFile('apps/api/.env');
const sessions = new Map<string, Session>();
const quotas = new Map<string, { start: number; count: number }>();
const SESSION_TTL_MS = 2 * 60 * 60 * 1000;

function useQuota(key: string, limit: number, durationMs: number): boolean {
  const now = Date.now();
  const entry = quotas.get(key);
  if (!entry || now - entry.start > durationMs) {
    quotas.set(key, { start: now, count: 1 });
    return true;
  }
  if (entry.count >= limit) return false;
  entry.count++;
  return true;
}

function cleanExpired() {
  const now = Date.now();
  for (const [id, session] of sessions) if (now - session.lastActive > SESSION_TTL_MS) sessions.delete(id);
  for (const [key, entry] of quotas) if (now - entry.start > 24 * 60 * 60 * 1000) quotas.delete(key);
}
const app = express();
app.disable('x-powered-by');
app.set('trust proxy', 1);
app.use(cors({ origin: process.env.WEB_ORIGIN || 'http://localhost:5173' }));
app.use(express.json({ limit: '16kb' }));

function getSession(req: express.Request, res: express.Response): Session | undefined {
  const id = req.header('x-case-session');
  const session = id ? sessions.get(id) : undefined;
  if (!session || Date.now() - session.lastActive > SESSION_TTL_MS) {
    if (id) sessions.delete(id);
    res.status(401).json({ error: 'Невалидна или изтекла сесия.' });
    return undefined;
  }
  session.lastActive = Date.now();
  return session;
}

app.get('/api/health', (_req, res) => res.json({ ok: true, mode: configuredMode() }));
app.get('/api/case', (_req, res) => res.json(publicCase));
app.post('/api/session', (req, res) => {
  cleanExpired();
  if (sessions.size >= 500 || !useQuota('new-session:' + req.ip, 10, 60 * 60 * 1000)) {
    return void res.status(429).json({ error: 'Твърде много нови сесии. Опитай по-късно.' });
  }
  const id = randomUUID();
  sessions.set(id, {
    id, found: new Set(), messages: {}, disclosed: {}, lastActive: Date.now(),
    interviewCount: 0, aiCalls: 0, interviewBusy: false
  });
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
app.post('/api/interview', async (req, res) => {
  const session = getSession(req, res);
  if (!session) return;
  const parsed = messageSchema.safeParse(req.body);
  if (!parsed.success) return void res.status(400).json({ error: 'Невалиден въпрос.' });
  const { personId, message, evidenceId } = parsed.data;
  if (evidenceId && !session.found.has(evidenceId)) {
    return void res.status(403).json({ error: 'Уликата още не е открита.' });
  }
  if (session.interviewBusy) return void res.status(429).json({ error: 'Предишният въпрос още се обработва.' });
  if (session.interviewCount >= 80) return void res.status(429).json({ error: 'Лимитът за разпити в тази сесия е достигнат.' });

  session.interviewBusy = true;
  try {
    const disclosed = [...new Set([...(session.disclosed[personId] || []), ...(evidenceId ? [evidenceId] : [])])];
    const history = session.messages[personId] || [];
    const requestedAi = configuredMode() === 'ai-live' && session.aiCalls < 25
      && useQuota('ai-ip:' + req.ip, 60, 60 * 60 * 1000)
      && useQuota('ai-global', 300, 24 * 60 * 60 * 1000);
    let reply: string | null = null;
    if (requestedAi) {
      session.aiCalls++;
      reply = await aiReply({
        personId, question: message, presentedEvidenceId: evidenceId,
        disclosedEvidenceIds: disclosed, history
      });
    }
    const mode = reply ? 'ai-live' : 'scripted-demo';
    reply ??= scriptedReply(personId, message, disclosed);
    const updatedHistory: InterviewLine[] = [...history, { role: 'player', text: message }, { role: 'npc', text: reply }];
    session.messages[personId] = updatedHistory.slice(-40);
    session.disclosed[personId] = disclosed;
    session.interviewCount++;
    if (personId === 'elena') session.found.add('E11');
    if (personId === 'petar') session.found.add('E12');
    res.json({ reply, found: [...session.found], mode });
  } finally {
    session.interviewBusy = false;
  }
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
app.listen(port, () => process.stdout.write('CASEFILES API listening on '+port+' mode='+configuredMode()+'\n'));
