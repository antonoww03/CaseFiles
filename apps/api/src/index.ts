import express from 'express';
import cors from 'cors';
import { randomUUID } from 'node:crypto';
import { existsSync } from 'node:fs';
import { publicCase, evidence, accusationSchema, messageSchema, evaluate } from './case.js';
import { aiReply, configuredMode, scriptedReply, type InterviewLine } from './interview.js';
import { deductions, findDeduction } from './deductions.js';
import { suspects, contradictions, noteSchema, availableContradictions, scoreCase } from './gameplay.js';
import { initializeStorage, persistentStorageEnabled, restoreSession, saveSession, type StoredSession } from './storage.js';

type Session = StoredSession;
if (existsSync('apps/api/.env')) process.loadEnvFile('apps/api/.env');
const sessions = new Map<string, Session>();
const quotas = new Map<string, { start: number; count: number }>();
const SESSION_TTL_MS = 14 * 24 * 60 * 60 * 1000;

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
app.use('/api', async (req, res, next) => {
  const id = req.header('x-case-session');
  if (!id || sessions.has(id) || !persistentStorageEnabled()) return void next();
  try {
    const saved = await restoreSession(id);
    if (saved) sessions.set(id, saved);
    next();
  } catch {
    res.status(503).json({ error: 'Временно не можем да възстановим сесията.' });
  }
});

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

app.get('/api/health', (_req, res) => res.json({ ok: true, mode: configuredMode() === 'ai-live' ? 'ai-configured' : 'scripted-demo', storage: persistentStorageEnabled() ? 'postgres' : 'memory' }));
app.get('/api/case', (_req, res) => res.json(publicCase));
app.post('/api/session', async (req, res) => {
  cleanExpired();
  if (sessions.size >= 500 || !useQuota('new-session:' + req.ip, 10, 60 * 60 * 1000)) {
    return void res.status(429).json({ error: 'Твърде много нови сесии. Опитай по-късно.' });
  }
  const id = randomUUID();
  sessions.set(id, {
    id, found: new Set(), links: new Set(), notes: [], verified: new Set(), messages: {}, disclosed: {}, lastActive: Date.now(),
    interviewCount: 0, aiCalls: 0, interviewBusy: false
  });
  try { await saveSession(sessions.get(id)!); } catch {
    sessions.delete(id);
    return void res.status(503).json({ error: 'Сесията не можа да бъде записана.' });
  }
  res.status(201).json({ sessionId: id, found: [] });
});
app.get('/api/session', (req, res) => {
  const session = getSession(req, res);
  if (session) res.json({ found: [...session.found], links: [...session.links], notes: session.notes, verified: [...session.verified], messages: session.messages });
});
app.get('/api/suspects', (req, res) => {
  const session = getSession(req, res);
  if (!session) return;
  res.json(suspects.map(person => ({
    ...person,
    relevantIds: person.relevantIds.filter(id => session.found.has(id)),
    interviewCount: Math.floor((session.messages[person.id] || []).length / 2)
  })));
});

app.get('/api/notes', (req, res) => {
  const session = getSession(req, res);
  if (session) res.json(session.notes);
});

app.post('/api/notes', async (req, res) => {
  const session = getSession(req, res);
  if (!session) return;
  const parsed = noteSchema.safeParse(req.body);
  if (!parsed.success) return void res.status(400).json({ error: 'Бележката е невалидна или прекалено дълга.' });
  if (session.notes.length >= 35) return void res.status(429).json({ error: 'Лимит от 35 бележки.' });
  const note = { ...parsed.data, id: randomUUID(), updatedAt: new Date().toISOString() };
  session.notes.push(note);
  try { await saveSession(session); }
  catch { session.notes.pop(); return void res.status(503).json({ error: 'Неуспешно запазване.' }); }
  res.status(201).json({ note, notes: session.notes });
});

app.put('/api/notes/:id', async (req, res) => {
  const session = getSession(req, res);
  if (!session) return;
  const parsed = noteSchema.safeParse(req.body);
  if (!parsed.success) return void res.status(400).json({ error: 'Невалидна бележка.' });
  const index = session.notes.findIndex(n => n.id === req.params.id);
  if (index < 0) return void res.status(404).json({ error: 'Бележката липсва.' });
  const previous = session.notes[index];
  session.notes[index] = { ...parsed.data, id: previous.id, updatedAt: new Date().toISOString() };
  try { await saveSession(session); }
  catch { session.notes[index] = previous; return void res.status(503).json({ error: 'Неуспешно запазване.' }); }
  res.json({ note: session.notes[index], notes: session.notes });
});

app.delete('/api/notes/:id', async (req, res) => {
  const session = getSession(req, res);
  if (!session) return;
  const index = session.notes.findIndex(n => n.id === req.params.id);
  if (index < 0) return void res.status(404).json({ error: 'Бележката липсва.' });
  const previous = [...session.notes];
  session.notes.splice(index, 1);
  try { await saveSession(session); }
  catch { session.notes = previous; return void res.status(503).json({ error: 'Неуспешно изтриване.' }); }
  res.json({ notes: session.notes });
});

app.get('/api/contradictions', (req, res) => {
  const session = getSession(req, res);
  if (!session) return;
  res.json(availableContradictions(session.found).map(c => ({
    ...c, verified: session.verified.has(c.id),
    finding: session.verified.has(c.id) ? c.finding : null
  })));
});

app.post('/api/contradictions/:id', async (req, res) => {
  const session = getSession(req, res);
  if (!session) return;
  const match = contradictions.find(c => c.id === req.params.id);
  if (!match) return void res.status(404).json({ error: 'Неизвестно противоречие.' });
  if (match.evidenceIds.some(id => !session.found.has(id))) {
    return void res.status(403).json({ error: 'Необходими са всички подкрепящи улики.' });
  }
  session.verified.add(match.id);
  try { await saveSession(session); }
  catch { session.verified.delete(match.id); return void res.status(503).json({ error: 'Неуспешно запазване.' }); }
  res.json({ finding: match, verified: [...session.verified] });
});

app.get('/api/evidence', (req, res) => {
  const session = getSession(req, res);
  if (!session) return;
  res.json(evidence.filter(item => session.found.has(item.id)));
});
app.post('/api/discover/:id', async (req, res) => {
  const session = getSession(req, res);
  if (!session) return;
  const item = evidence.find(item => item.id === req.params.id);
  if (!item) return void res.status(404).json({ error: 'Неизвестна улика.' });
  if (item.source === 'interview') return void res.status(403).json({ error: 'Тази улика се придобива чрез разпит.' });
  session.found.add(item.id);
  try { await saveSession(session); } catch { return void res.status(503).json({ error: 'Неуспешно запазване на уликата.' }); }
  res.json({ evidence: item, found: [...session.found] });
});
app.get('/api/deductions', (req, res) => {
  const session = getSession(req, res);
  if (!session) return;
  res.json(deductions.filter(item => session.links.has(item.id)));
});

app.post('/api/deductions', async (req, res) => {
  const session = getSession(req, res);
  if (!session) return;
  const first = typeof req.body?.firstId === 'string' ? req.body.firstId : '';
  const second = typeof req.body?.secondId === 'string' ? req.body.secondId : '';
  if (!session.found.has(first) || !session.found.has(second)) {
    return void res.status(403).json({ error: 'Можеш да свързваш само вече открити доказателства.' });
  }
  const deduction = findDeduction(first, second);
  if (!deduction) return void res.status(422).json({ error: 'Няма доказуема връзка между тези две улики.' });
  session.links.add(deduction.id);
  try { await saveSession(session); } catch { return void res.status(503).json({ error: 'Неуспешно запазване на логическата връзка.' }); }
  res.json({ deduction, links: [...session.links] });
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
    await saveSession(session);
    res.json({ reply, found: [...session.found], mode });
  } catch {
    res.status(503).json({ error: 'Разпитът не можа да бъде запазен.' });
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
  const verdict = evaluate(suspectId, evidenceIds, motive, timeline, [...session.links]);
  const score = scoreCase({ found: session.found, links: session.links, interviews: session.messages, verified: session.verified, verdict: verdict.status });
  res.json({ ...verdict, score });
});
app.use((_req, res) => res.status(404).json({ error: 'Няма такъв маршрут.' }));
const port = Number(process.env.PORT || 3001);
initializeStorage().then(storageMode => {
  app.listen(port, () => process.stdout.write('CASEFILES API listening on '+port+' mode='+configuredMode()+' storage='+storageMode+'\n'));
}).catch(() => {
  process.stderr.write('CASEFILES_STORAGE_INIT_FAILED\n');
  process.exitCode = 1;
});

if (process.env.CASEFILES_RUNTIME_PROBE === 'yes') {
  void (async () => {
    const first = await aiReply({
      personId: 'martin',
      question: 'Разкажете какво правихте от 00:30 до 02:00.',
      disclosedEvidenceIds: [],
      history: []
    });
    process.stdout.write('CASEFILES_RUNTIME_AI_TEST first=' + (first ? 'PASS' : 'FAIL') + '\n');
    if (first) {
      const second = await aiReply({
        personId: 'martin',
        question: 'Защо ви е писал Никола за оригиналните фактури?',
        presentedEvidenceId: 'E04',
        disclosedEvidenceIds: ['E04'],
        history: [{ role: 'player', text: 'Разкажете какво правихте от 00:30 до 02:00.' }, { role: 'npc', text: first }]
      });
      process.stdout.write('CASEFILES_RUNTIME_AI_TEST evidence=' + (second ? 'PASS' : 'FAIL') + '\n');
    }
  })();
}
