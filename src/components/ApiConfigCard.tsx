import { useState } from 'react';
import { DIALECTS, MODELS } from '../constants.ts';
import type { KeyMode } from '../constants.ts';

interface ApiConfigCardProps {
  keyMode: KeyMode;
  onKeyModeChange: (mode: KeyMode) => void;
  anthropicKey: string;
  onAnthropicKeyChange: (key: string) => void;
  openAiKey: string;
  onOpenAiKeyChange: (key: string) => void;
  googleKey: string;
  onGoogleKeyChange: (key: string) => void;
  model: string;
  onModelChange: (model: string) => void;
  dialect: string;
  onDialectChange: (dialect: string) => void;
  providerName: string;
  errors: Record<string, string>;
}

const ApiConfigCard = ({
  keyMode,
  onKeyModeChange,
  anthropicKey,
  onAnthropicKeyChange,
  openAiKey,
  onOpenAiKeyChange,
  googleKey,
  onGoogleKeyChange,
  model,
  onModelChange,
  dialect,
  onDialectChange,
  providerName,
  errors,
}: ApiConfigCardProps) => {
  const [showAnthropic, setShowAnthropic] = useState(false);
  const [showOpenAi, setShowOpenAi] = useState(false);
  const [showGoogle, setShowGoogle] = useState(false);

  return (
    <div className="card">
      <p className="label">API Config</p>

      <label>Key source</label>
      <select value={keyMode} onChange={(e) => onKeyModeChange(e.target.value as KeyMode)}>
        <option value="predefined">predefined</option>
        <option value="own-key">own-key</option>
      </select>

      {keyMode === 'predefined' && (
        <p className="hint" style={{ marginTop: '0.5rem' }}>
          Using pre-configured server-side keys. No key entry required.
        </p>
      )}

      {keyMode === 'own-key' && (
        <>
          <p className="hint" style={{ marginTop: '0.5rem' }}>
            Only fill in the key for the provider you're using — the others are optional.
          </p>

          <label style={{ marginTop: '0.75rem' }}>Anthropic API key <span style={{ fontWeight: 400, opacity: 0.6 }}>(optional)</span></label>
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

          <label>OpenAI API key <span style={{ fontWeight: 400, opacity: 0.6 }}>(optional)</span></label>
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

          <label>Google API key <span style={{ fontWeight: 400, opacity: 0.6 }}>(optional)</span></label>
          <div className="row">
            <input
              type={showGoogle ? 'text' : 'password'}
              value={googleKey}
              placeholder="AIza..."
              className={errors.googleKey ? 'input-error' : ''}
              onChange={(e) => onGoogleKeyChange(e.target.value)}
            />
            <button className="btn-sm" onClick={() => setShowGoogle((s) => !s)}>
              {showGoogle ? 'hide' : 'show'}
            </button>
          </div>
          <p className="input-hint">{errors.googleKey ?? ''}</p>
        </>
      )}

      <p className="hint">Active provider: {providerName} (selected from model).</p>

      <label>Model</label>
      <select value={model} onChange={(e) => onModelChange(e.target.value)}>
        <optgroup label="Anthropic">
          {MODELS.anthropic.map((m) => (
            <option value={m} key={m}>{m}</option>
          ))}
        </optgroup>
        <optgroup label="OpenAI">
          {MODELS.openai.map((m) => (
            <option value={m} key={m}>{m}</option>
          ))}
        </optgroup>
        <optgroup label="Google">
          {MODELS.google.map((m) => (
            <option value={m} key={m}>{m}</option>
          ))}
        </optgroup>
      </select>

      <label>SQL dialect</label>
      <select value={dialect} onChange={(e) => onDialectChange(e.target.value)}>
        {DIALECTS.map((d) => (
          <option value={d} key={d}>{d}</option>
        ))}
      </select>
    </div>
  );
};

export default ApiConfigCard;
