import { Redis } from '@upstash/redis';

let _kv: Redis | null = null;
function getKv(): Redis | null {
  if (_kv) return _kv;
  try { _kv = Redis.fromEnv(); } catch { /* env vars not set — rate limiting disabled */ }
  return _kv;
}
import type { VercelRequest, VercelResponse } from '@vercel/node';

const RATE_LIMIT = 20;
const WINDOW_SECONDS = 3600;
const ALERT_COOLDOWN_SECONDS = 7200;
const OWNER_EMAIL = 'gangulybikramjit@gmail.com';
const INFRA_DOWN_CMD =
  'bash /Users/bikram/Personal/interview-prep/grouped-projects/llm-implementations/natural-language-to-llm-query-comparison/infra-down.sh\n\nTo restore after investigating:\nbash /Users/bikram/Personal/interview-prep/grouped-projects/llm-implementations/natural-language-to-llm-query-comparison/scripts/deploy.sh';

async function sendAlert(ip: string, count: number): Promise<void> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return;
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'onboarding@resend.dev',
      to: OWNER_EMAIL,
      subject: `[nl-sql] rate-limit breach — ${ip}`,
      text: [
        `IP ${ip} hit ${count} requests in the last hour (limit: ${RATE_LIMIT}).`,
        '',
        'To suspend the service immediately, run:',
        '',
        INFRA_DOWN_CMD,
      ].join('\n'),
    }),
  }).catch(() => {});
}

async function checkRateLimit(ip: string): Promise<{ limited: boolean; count: number }> {
  const kv = getKv();
  if (!kv) return { limited: false, count: 0 };
  try {
    const countKey = `rl:${ip}`;
    const count = await kv.incr(countKey);
    if (count === 1) await kv.expire(countKey, WINDOW_SECONDS);
    if (count > RATE_LIMIT) {
      const alertKey = `alert:${ip}`;
      const alerted = await kv.get(alertKey);
      if (!alerted) {
        await kv.set(alertKey, '1', { ex: ALERT_COOLDOWN_SECONDS });
        await sendAlert(ip, count);
      }
      return { limited: true, count };
    }
    return { limited: false, count };
  } catch {
    return { limited: false, count: 0 };
  }
}

async function callAnthropic(model: string, systemPrompt: string, nlQuery: string): Promise<string> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY!,
      'anthropic-version': '2023-06-01',
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
    let msg = response.statusText;
    try { msg = JSON.parse(txt).error.message || msg; } catch { /* no-op */ }
    throw new Error(msg);
  }
  const data = JSON.parse(txt);
  return (data.content || []).map((b: { text?: string }) => b.text || '').join('');
}

async function callOpenAI(model: string, systemPrompt: string, nlQuery: string): Promise<string> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
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
    let msg = response.statusText;
    try { msg = JSON.parse(txt).error.message || msg; } catch { /* no-op */ }
    throw new Error(msg);
  }
  const data = JSON.parse(txt);
  return (((data.choices || [])[0] || {}).message || {}).content || '';
}

async function callGoogle(model: string, systemPrompt: string, nlQuery: string): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GOOGLE_API_KEY}`;
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
    let msg = response.statusText;
    try { msg = JSON.parse(txt).error.message || msg; } catch { /* no-op */ }
    throw new Error(msg);
  }
  const data = JSON.parse(txt);
  return ((data.candidates || [])[0]?.content?.parts || []).map((p: { text?: string }) => p.text || '').join('');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' });

  if (process.env.SUSPENDED === '1') {
    return res.status(503).json({ error: 'suspended' });
  }

  const ip =
    (typeof req.headers['x-forwarded-for'] === 'string'
      ? req.headers['x-forwarded-for'].split(',')[0]
      : (req.headers['x-forwarded-for'] || [])[0]) ||
    (req.socket as { remoteAddress?: string }).remoteAddress ||
    'unknown';

  const { limited } = await checkRateLimit(ip);
  if (limited) return res.status(429).json({ error: 'rate_limited' });

  const { model, systemPrompt, nlQuery, providerName } = req.body as {
    model: string;
    systemPrompt: string;
    nlQuery: string;
    providerName: string;
  };

  if (!model || !systemPrompt || !nlQuery || !providerName) {
    return res.status(400).json({ error: 'missing_fields' });
  }

  try {
    let raw: string;
    if (providerName === 'OpenAI') {
      raw = await callOpenAI(model, systemPrompt, nlQuery);
    } else if (providerName === 'Google') {
      raw = await callGoogle(model, systemPrompt, nlQuery);
    } else {
      raw = await callAnthropic(model, systemPrompt, nlQuery);
    }
    const parsed = JSON.parse(raw.trim().replace(/```json|```/g, '').trim());
    return res.json({
      sql: String(parsed.sql || '').trim(),
      explanation: String(parsed.explanation || '').trim(),
    });
  } catch (err) {
    return res.status(502).json({ error: (err as Error).message });
  }
}
