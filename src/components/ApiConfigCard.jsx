import { useState } from 'react';
import { DIALECTS, MODELS } from '../constants.js';

export default function ApiConfigCard({
  anthropicKey,
  onAnthropicKeyChange,
  openAiKey,
  onOpenAiKeyChange,
  model,
  onModelChange,
  dialect,
  onDialectChange,
  providerName,
}) {
  const [showAnthropic, setShowAnthropic] = useState(false);
  const [showOpenAi, setShowOpenAi] = useState(false);

  return (
    <div className="card">
      <p className="label">API Config</p>

      <label>Anthropic API key</label>
      <div className="row">
        <input
          type={showAnthropic ? 'text' : 'password'}
          value={anthropicKey}
          placeholder="sk-ant-..."
          onChange={(e) => onAnthropicKeyChange(e.target.value)}
        />
        <button className="btn-sm" onClick={() => setShowAnthropic((s) => !s)}>
          {showAnthropic ? 'hide' : 'show'}
        </button>
      </div>

      <label>OpenAI API key</label>
      <div className="row">
        <input
          type={showOpenAi ? 'text' : 'password'}
          value={openAiKey}
          placeholder="sk-..."
          onChange={(e) => onOpenAiKeyChange(e.target.value)}
        />
        <button className="btn-sm" onClick={() => setShowOpenAi((s) => !s)}>
          {showOpenAi ? 'hide' : 'show'}
        </button>
      </div>

      <p className="hint">Active provider: {providerName} (selected from model).</p>

      <label>Model</label>
      <select value={model} onChange={(e) => onModelChange(e.target.value)}>
        <optgroup label="Anthropic">
          {MODELS.anthropic.map((m) => (
            <option value={m} key={m}>
              {m}
            </option>
          ))}
        </optgroup>
        <optgroup label="OpenAI">
          {MODELS.openai.map((m) => (
            <option value={m} key={m}>
              {m}
            </option>
          ))}
        </optgroup>
      </select>

      <label>SQL dialect</label>
      <select value={dialect} onChange={(e) => onDialectChange(e.target.value)}>
        {DIALECTS.map((d) => (
          <option value={d} key={d}>
            {d}
          </option>
        ))}
      </select>
    </div>
  );
}
