import { afterEach, describe, expect, it, vi } from 'vitest';
import { aiReply, configuredMode, scriptedReply } from './interview.js';

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe('interview engine', () => {
  it('uses scripted mode without a key', () => {
    vi.stubEnv('OPENAI_API_KEY', '');
    expect(configuredMode()).toBe('scripted-demo');
    expect(scriptedReply('martin', 'Къде бяхте?', [])).toContain('вкъщи');
    expect(scriptedReply('martin', 'Къде бяхте?', ['E04'])).toContain('уговорка');
  });

  it('does not contact AI without a key', async () => {
    vi.stubEnv('OPENAI_API_KEY', '');
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const reply = await aiReply({
      personId: 'elena', question: 'Защо?', disclosedEvidenceIds: [], history: []
    });
    expect(reply).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('builds a limited, structured AI request with only disclosed evidence', async () => {
    vi.stubEnv('OPENAI_API_KEY', 'test-secret-for-mock');
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        status: 'completed',
        output: [{ type: 'message', content: [{ type: 'output_text', text: JSON.stringify({ reply: 'Говорихме, но това беше лично.' }) }] }]
      })
    }));
    vi.stubGlobal('fetch', fetchMock);
    const reply = await aiReply({
      personId: 'elena',
      question: 'Защо отрекохте телефонния разговор?',
      presentedEvidenceId: 'E03',
      disclosedEvidenceIds: ['E03'],
      history: []
    });
    expect(reply).toBe('Говорихме, но това беше лично.');
    const request = fetchMock.mock.calls[0] as unknown as [string, { body: string; headers: Record<string,string> }];
    expect(request[0]).toBe('https://api.openai.com/v1/responses');
    expect(request[1].headers.Authorization).toBe('Bearer test-secret-for-mock');
    const body = JSON.parse(request[1].body);
    expect(body.store).toBe(false);
    expect(body.text.format.type).toBe('json_schema');
    expect(body.max_output_tokens).toBeLessThanOrEqual(300);
    const message = JSON.parse(body.input[0].content);
    expect(message.alreadyPresentedEvidence).toHaveLength(1);
    expect(message.alreadyPresentedEvidence[0].id).toBe('E03');
  });

  it('falls back cleanly if AI is unavailable', async () => {
    vi.stubEnv('OPENAI_API_KEY', 'test-key');
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false })));
    const result = await aiReply({ personId: 'petar', question: 'Какво чухте?', disclosedEvidenceIds: [], history: [] });
    expect(result).toBeNull();
  });
});
