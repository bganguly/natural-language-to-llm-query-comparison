import type { KeyMode } from './constants.ts';

interface CallProviderArgs {
  model: string;
  apiKey: string;
  systemPrompt: string;
  nlQuery: string;
  providerName: string;
  keyMode: KeyMode;
}

interface CallProviderResult {
  sql: string;
  explanation: string;
}

async function callViaProxy(model: string, systemPrompt: string, nlQuery: string, providerName: string): Promise<CallProviderResult> {
  const response = await fetch('/api/proxy', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, systemPrompt, nlQuery, providerName }),
  });
  const txt = await response.text();
  if (response.status === 503) throw new Error('__suspended__');
  if (response.status === 429) throw new Error('Rate limit exceeded — try again later.');
  if (!response.ok) {
    let msg = response.statusText;
    try { msg = JSON.parse(txt).error || msg; } catch { /* no-op */ }
    throw new Error(msg);
  }
  return JSON.parse(txt) as CallProviderResult;
}

export const callProvider = async ({ model, apiKey, systemPrompt, nlQuery, providerName, keyMode }: CallProviderArgs): Promise<CallProviderResult> => {
  if (keyMode === 'predefined') {
    return callViaProxy(model, systemPrompt, nlQuery, providerName);
  }

  let raw: string;

  if (providerName === 'OpenAI') {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        max_tokens: 1000,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: nlQuery },
        ],
      }),
    });
    const txt = await response.text();
    if (!response.ok) {
      let message = response.statusText;
      try { message = JSON.parse(txt).error.message || message; } catch { /* no-op */ }
      throw new Error(message);
    }
    const data = JSON.parse(txt);
    raw = (((data.choices || [])[0] || {}).message || {}).content || '';
  } else if (providerName === 'Google') {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemPrompt }] },
        contents: [{ role: 'user', parts: [{ text: nlQuery }] }],
        generationConfig: { maxOutputTokens: 1000 },
      }),
    });
    const txt = await response.text();
    if (!response.ok) {
      let message = response.statusText;
      try { message = JSON.parse(txt).error.message || message; } catch { /* no-op */ }
      throw new Error(message);
    }
    const data = JSON.parse(txt);
    raw = ((data.candidates || [])[0]?.content?.parts || []).map((p: { text?: string }) => p.text || '').join('');
  } else {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model,
        max_tokens: 1000,
        system: systemPrompt,
        messages: [{ role: 'user', content: nlQuery }],
      }),
    });
    const txt = await response.text();
    if (!response.ok) {
      let message = response.statusText;
      try { message = JSON.parse(txt).error.message || message; } catch { /* no-op */ }
      throw new Error(message);
    }
    const data = JSON.parse(txt);
    raw = (data.content || []).map((b: { text?: string }) => b.text || '').join('');
  }

  const parsed = JSON.parse(raw.trim().replace(/```json|```/g, '').trim());
  return {
    sql: String(parsed.sql || '').trim(),
    explanation: String(parsed.explanation || '').trim(),
  };
};
