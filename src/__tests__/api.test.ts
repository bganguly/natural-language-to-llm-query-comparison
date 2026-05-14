import { describe, it, expect, vi, beforeEach } from 'vitest';
import { callProvider } from '../api.ts';

const SUCCESS_PAYLOAD = { sql: 'SELECT 1', explanation: 'returns one row' };

describe('callProvider — OpenAI', () => {
  beforeEach(() => { vi.resetAllMocks(); });

  it('calls the OpenAI endpoint', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: async () =>
        JSON.stringify({ choices: [{ message: { content: JSON.stringify(SUCCESS_PAYLOAD) } }] }),
    });

    const result = await callProvider({
      model: 'gpt-4o',
      apiKey: 'sk-test',
      systemPrompt: 'be a SQL expert',
      nlQuery: 'show all employers',
      providerName: 'OpenAI',
    });

    expect(result.sql).toBe('SELECT 1');
    expect(result.explanation).toBe('returns one row');
    expect(vi.mocked(fetch)).toHaveBeenCalledWith(
      'https://api.openai.com/v1/chat/completions',
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('strips markdown backtick wrapper from response', async () => {
    const wrapped = '```json\n' + JSON.stringify(SUCCESS_PAYLOAD) + '\n```';
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: async () =>
        JSON.stringify({ choices: [{ message: { content: wrapped } }] }),
    });

    const result = await callProvider({
      model: 'gpt-4o',
      apiKey: 'sk-test',
      systemPrompt: '',
      nlQuery: '',
      providerName: 'OpenAI',
    });

    expect(result.sql).toBe('SELECT 1');
  });

  it('throws with parsed error message on HTTP error', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      statusText: 'Unauthorized',
      text: async () => JSON.stringify({ error: { message: 'Invalid API key' } }),
    });

    await expect(
      callProvider({ model: 'gpt-4o', apiKey: 'bad', systemPrompt: '', nlQuery: '', providerName: 'OpenAI' }),
    ).rejects.toThrow('Invalid API key');
  });

  it('handles missing choices gracefully (uses || fallback chain)', async () => {
    // No choices → raw = '' → JSON.parse('') throws → caller gets a parse error
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => JSON.stringify({}), // no choices key
    });

    await expect(
      callProvider({ model: 'gpt-4o', apiKey: 'sk-test', systemPrompt: '', nlQuery: '', providerName: 'OpenAI' }),
    ).rejects.toThrow();
  });

  it('falls back to statusText when error body has no message field', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      statusText: 'Too Many Requests',
      text: async () => JSON.stringify({ error: {} }), // parsed but no .message
    });

    await expect(
      callProvider({ model: 'gpt-4o', apiKey: 'bad', systemPrompt: '', nlQuery: '', providerName: 'OpenAI' }),
    ).rejects.toThrow('Too Many Requests');
  });
});

describe('callProvider — Anthropic', () => {
  beforeEach(() => { vi.resetAllMocks(); });

  it('handles missing content array (uses || [] fallback)', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => JSON.stringify({}), // no content key
    });

    await expect(
      callProvider({ model: 'claude-sonnet-4-5', apiKey: 'sk-ant-test', systemPrompt: '', nlQuery: '', providerName: 'Anthropic' }),
    ).rejects.toThrow();
  });

  it('calls the Anthropic endpoint', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: async () =>
        JSON.stringify({ content: [{ text: JSON.stringify(SUCCESS_PAYLOAD) }] }),
    });

    const result = await callProvider({
      model: 'claude-sonnet-4-5',
      apiKey: 'sk-ant-test',
      systemPrompt: '',
      nlQuery: 'top employers',
      providerName: 'Anthropic',
    });

    expect(result.sql).toBe('SELECT 1');
    expect(vi.mocked(fetch)).toHaveBeenCalledWith(
      'https://api.anthropic.com/v1/messages',
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('throws on Anthropic HTTP error', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      statusText: 'Forbidden',
      text: async () => '{}',
    });

    await expect(
      callProvider({ model: 'claude-sonnet-4-5', apiKey: 'bad', systemPrompt: '', nlQuery: '', providerName: 'Anthropic' }),
    ).rejects.toThrow('Forbidden');
  });

  it('falls back to statusText when Anthropic error has no message field', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      statusText: 'Service Unavailable',
      text: async () => JSON.stringify({ error: {} }),
    });

    await expect(
      callProvider({ model: 'claude-sonnet-4-5', apiKey: 'bad', systemPrompt: '', nlQuery: '', providerName: 'Anthropic' }),
    ).rejects.toThrow('Service Unavailable');
  });

  it('handles content block with no text property', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: async () =>
        JSON.stringify({ content: [{ type: 'tool_use' }, { text: JSON.stringify(SUCCESS_PAYLOAD) }] }),
    });

    const result = await callProvider({
      model: 'claude-sonnet-4-5',
      apiKey: 'key',
      systemPrompt: '',
      nlQuery: '',
      providerName: 'Anthropic',
    });
    expect(result.sql).toBe('SELECT 1');
  });

  it('concatenates multiple content blocks', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: async () =>
        JSON.stringify({
          content: [{ text: '{"sql":"SELECT 2",' }, { text: '"explanation":"two"}' }],
        }),
    });

    const result = await callProvider({
      model: 'claude-sonnet-4-5',
      apiKey: 'key',
      systemPrompt: '',
      nlQuery: '',
      providerName: 'Anthropic',
    });

    expect(result.sql).toBe('SELECT 2');
  });
});
