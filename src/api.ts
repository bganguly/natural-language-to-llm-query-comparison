/**
 * callProvider — sends the NL prompt to the active LLM provider and
 * returns { sql, explanation }.  Throws on network/API/parse errors.
 */

interface CallProviderArgs {
  model: string;
  apiKey: string;
  systemPrompt: string;
  nlQuery: string;
  providerName: string;
}

interface CallProviderResult {
  sql: string;
  explanation: string;
}

export const callProvider = async ({ model, apiKey, systemPrompt, nlQuery, providerName }: CallProviderArgs): Promise<CallProviderResult> => {
  let raw;

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
