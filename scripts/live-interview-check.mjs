import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

if (!process.env.OPENAI_API_KEY?.trim()) {
  process.stdout.write('AI_E2E skipped: no key configured\n');
  process.exit(0);
}
const root = fileURLToPath(new URL('../', import.meta.url));
const port = 39678;
const origin = 'http://127.0.0.1:' + port;
const child = spawn(process.execPath, ['apps/api/dist/index.js'], {
  cwd: root,
  env: { ...process.env, PORT: String(port) },
  stdio: 'ignore'
});
async function request(path, method='GET', body, token) {
  const response = await fetch(origin + '/api' + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { 'x-case-session': token } : {}) },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    signal: AbortSignal.timeout(24000)
  });
  const data = await response.json();
  return { status: response.status, data };
}
async function ready() {
  for (let i=0;i<45;i++) {
    try { const response = await request('/health'); if (response.status===200) return response.data; }
    catch {}
    await new Promise(resolve=>setTimeout(resolve,200));
  }
  throw new Error('API was not ready');
}
try {
  const health = await ready();
  assert.equal(health.mode, 'ai-live', 'Expected configured AI mode');
  const created = await request('/session','POST');
  assert.equal(created.status,201);
  const token = created.data.sessionId;
  const first = await request('/interview','POST',{
    personId:'martin',
    message:'Разкажете ми какво правихте между 00:30 и 02:00 часа.'
  },token);
  assert.equal(first.status,200,'First interview failed');
  process.stdout.write('AI_E2E first mode='+first.data.mode+' reply='+JSON.stringify(first.data.reply?.slice(0,350))+'\n');
  assert.equal(first.data.mode,'ai-live','First interview fell back to scripted');
  assert.ok(first.data.reply?.trim().length>=8);
  const discovery = await request('/discover/E04','POST',{},token);
  assert.equal(discovery.status,200);
  const second = await request('/interview','POST',{
    personId:'martin',
    message:'Как тогава ще обясните съобщението за оригиналните фактури?',
    evidenceId:'E04'
  },token);
  assert.equal(second.status,200);
  process.stdout.write('AI_E2E evidence mode='+second.data.mode+' reply='+JSON.stringify(second.data.reply?.slice(0,350))+'\n');
  assert.equal(second.data.mode,'ai-live','Evidence interview fell back to scripted');
  assert.ok(second.data.reply?.trim().length>=8);
  const restored = await request('/session','GET',undefined,token);
  assert.equal(restored.status,200);
  assert.equal(restored.data.messages.martin?.length,4);
  process.stdout.write('AI_E2E passed: two real AI replies, evidence and history\n');
} catch (error) {
  process.stderr.write('AI_E2E FAILED: '+(error instanceof Error?error.message:String(error))+'\n');
  process.exitCode=1;
} finally {
  child.kill('SIGTERM');
}
