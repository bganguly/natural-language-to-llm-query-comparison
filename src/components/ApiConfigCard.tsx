import { useState } from 'react';
import { DIALECTS, MODELS } from '../constants.ts';

interface ApiConfigCardProps {
  anthropicKey: string;
  onAnthropicKeyChange: (key: string) => void;
  openAiKey: string;
  onOpenAiKeyChange: (key: string) => void;
  model: string;
  onModelChange: (model: string) => void;
  dialect: string;
  onDialectChange: (dialect: string) => void;
  providerName: string;
  errors: Record<string, string>;
}

const ApiConfigCard = ({
  anthropicKey,
  onAnthropicKeyChange,
  openAiKey,
  onOpenAiKeyChange,
  model,
  onModelChange,
  dialect,
  onDialectChange,
  providerName,
  errors,
}: ApiConfigCardProps) => {
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
          className={errors.anthropicKey ? 'input-error' : ''}
          onChange={(e) => onAnthropicKeyChange(e.target.value)}
        />
        <button className="btn-sm" onClick={() => setShowAnthropic((s) => !s)}>
          {showAnthropic ? 'hide' : 'show'}
        </button>
      </div>
      <p className="input-hint">{errors.anthropicKey ?? ''}</p>

      <label>OpenAI API key</label>
      <div className="row">
        <input
          type={showOpenAi ? 'text' : 'password'}
          value={openAiKey}
          placeholder="sk-..."
          className={errors.openAiKey ? 'input-error' : ''}
          onChange={(e) => onOpenAiKeyChange(e.target.value)}
        />
        <button className="btn-sm" onClick={() => setShowOpenAi((s) => !s)}>
          {showOpenAi ? 'hide' : 'show'}
        </button>
      </div>
      <p className="input-hint">{errors.openAiKey ?? ''}</p>

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
};

export default ApiConfigCard;
