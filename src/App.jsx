import { useEffect, useMemo, useRef, useState } from 'react';
import * as duckdb from '@duckdb/duckdb-wasm';
import LogPanel from './components/LogPanel.jsx';
import ResultsCard from './components/ResultsCard.jsx';
import SampleQueries from './components/SampleQueries.jsx';
import SqlOutputCard from './components/SqlOutputCard.jsx';
import {
  ADJS,
  DEFAULT_COLS,
  DIALECTS,
  LEGACY_STORAGE_KEY,
  MODELS,
  NOUNS,
  QUERY_GROUPS,
  SQL_TYPES,
  STORAGE_KEY,
} from './constants.js';

const DEFAULT_BUCKET =
  'https://h1b-nlq-parquet-577479071532-20260511.s3.us-east-1.amazonaws.com/data/parquet/dol_lca_h1b_fy2020_q1_to_fy2026_q1.parquet?v=full_multi_fiscal_noempty_countrynull_20260512';

function providerFromModel(model) {
  return model.startsWith('gpt-') ? 'OpenAI' : 'Anthropic';
}

function parquetTypeToSql(rawType) {
  const raw = String(rawType || '').toUpperCase();
  if (raw === 'INT32' || raw === 'INT64' || raw === 'INT96') {
    return 'INTEGER';
  }
  if (raw === 'FLOAT' || raw === 'DOUBLE') {
    return 'DOUBLE';
  }
  if (raw === 'BOOLEAN') {
    return 'BOOLEAN';
  }
  return 'TEXT';
}

function nowClock() {
  return new Date().toLocaleTimeString('en-US', { hour12: false });
}

export default function App() {
  const [bucket, setBucket] = useState(DEFAULT_BUCKET);
  const [tableName, setTableName] = useState('h1b');
  const [anthropicKey, setAnthropicKey] = useState('');
  const [openAiKey, setOpenAiKey] = useState('');
  const [showAnthropicKey, setShowAnthropicKey] = useState(false);
  const [showOpenAiKey, setShowOpenAiKey] = useState(false);
  const [model, setModel] = useState(MODELS.anthropic[0]);
  const [dialect, setDialect] = useState('DuckDB');
  const [cols, setCols] = useState(DEFAULT_COLS);
  const [newColName, setNewColName] = useState('');
  const [newColType, setNewColType] = useState('TEXT');
  const [nlQuery, setNlQuery] = useState('');
  const [sql, setSql] = useState('Translated SQL will appear here.');
  const [sqlIsPlaceholder, setSqlIsPlaceholder] = useState(true);
  const [explanation, setExplanation] = useState('');
  const [statusText, setStatusText] = useState('waiting');
  const [statusClass, setStatusClass] = useState('b-idle');
  const [results, setResults] = useState({
    visible: false,
    loading: false,
    error: '',
    fields: [],
    rows: [],
    elapsed: '0.0',
    badge: '',
    badgeClass: 'b-idle',
  });
  const [logs, setLogs] = useState([]);
  const [logOpen, setLogOpen] = useState(false);
  const [duckReady, setDuckReady] = useState('loading');

  const hydratedRef = useRef(false);
  const dbRef = useRef(null);
  const connRef = useRef(null);
  const initPromiseRef = useRef(null);

  const providerName = useMemo(() => providerFromModel(model), [model]);
  const activeApiKey = providerName === 'OpenAI' ? openAiKey.trim() : anthropicKey.trim();

  function addLog(message, level = 'n') {
    setLogs((prev) => [...prev, { id: `${Date.now()}-${prev.length}`, ts: nowClock(), message, level }]);
    setLogOpen(true);
  }

  async function initDuckDb() {
    if (connRef.current) {
      return connRef.current;
    }

    if (initPromiseRef.current) {
      return initPromiseRef.current;
    }

    initPromiseRef.current = (async () => {
      try {
        addLog('Initialising DuckDB-WASM ...');
        setDuckReady('loading');
        const bundles = duckdb.getJsDelivrBundles();
        const bundle = await duckdb.selectBundle(bundles);
        const workerUrl = URL.createObjectURL(
          new Blob([`importScripts("${bundle.mainWorker}");`], { type: 'text/javascript' })
        );
        const worker = new Worker(workerUrl);
        const db = new duckdb.AsyncDuckDB(new duckdb.ConsoleLogger(), worker);
        await db.instantiate(bundle.mainModule, bundle.pthreadWorker);
        URL.revokeObjectURL(workerUrl);
        const conn = await db.connect();
        dbRef.current = db;
        connRef.current = conn;
        setDuckReady('ready');
        addLog('DuckDB-WASM ready', 'ok');
        return conn;
      } catch (error) {
        setDuckReady('error');
        initPromiseRef.current = null;
        addLog(`DuckDB init failed: ${error.message}`, 'er');
        throw error;
      }
    })();

    return initPromiseRef.current;
  }

  async function runQuery(rawSql) {
    const sqlToRun = rawSql.trim();
    if (!sqlToRun) {
      alert('Enter SQL first.');
      return;
    }

    setResults({
      visible: true,
      loading: true,
      error: '',
      fields: [],
      rows: [],
      elapsed: '0.0',
      badge: 'querying',
      badgeClass: 'b-spin',
    });

    const t0 = Date.now();
    try {
      const conn = await initDuckDb();
      const result = await conn.query(sqlToRun);
      const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
      const fields = result.schema.fields.map((f) => f.name);
      const rows = result.toArray().map((r) => (typeof r.toJSON === 'function' ? r.toJSON() : r));
      addLog(`Query done in ${elapsed}s - ${rows.length} rows`, 'ok');
      setResults({
        visible: true,
        loading: false,
        error: '',
        fields,
        rows,
        elapsed,
        badge: `${rows.length} rows`,
        badgeClass: 'b-ok',
      });
    } catch (error) {
      addLog(`Query error: ${error.message}`, 'er');
      setResults({
        visible: true,
        loading: false,
        error: error.message,
        fields: [],
        rows: [],
        elapsed: '0.0',
        badge: 'error',
        badgeClass: 'b-err',
      });
    }
  }

  async function sniffSchema() {
    if (!bucket.trim()) {
      alert('Enter a parquet endpoint first.');
      return;
    }

    try {
      addLog('Sniffing schema ...');
      const conn = await initDuckDb();
      const result = await conn.query(`SELECT name, type FROM parquet_schema('${bucket.trim()}')`);
      const rows = result.toArray().map((r) => (typeof r.toJSON === 'function' ? r.toJSON() : r));
      const detected = rows
        .map((r) => ({ name: String(r.name || ''), raw: String(r.type || '') }))
        .filter((r) => r.name && r.name !== 'schema' && r.raw)
        .map((r) => ({ name: r.name, type: parquetTypeToSql(r.raw) }));

      if (detected.length) {
        setCols(detected);
        addLog(`Detected ${detected.length} columns`, 'ok');
      } else {
        addLog('No columns detected from parquet_schema response', 'wn');
      }
    } catch (error) {
      addLog(`Sniff error: ${error.message}`, 'er');
    }
  }

  function randomAlias() {
    const adj = ADJS[Math.floor(Math.random() * ADJS.length)];
    const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
    setTableName(`${adj}_${noun}_${Math.floor(Math.random() * 90) + 10}`);
  }

  function addColumn() {
    const cleanName = newColName.trim().replace(/\s+/g, '_');
    if (!cleanName) {
      return;
    }
    if (cols.some((c) => c.name === cleanName)) {
      return;
    }
    setCols((prev) => [...prev, { name: cleanName, type: newColType }]);
    setNewColName('');
  }

  function removeColumn(index) {
    setCols((prev) => prev.filter((_, i) => i !== index));
  }

  async function translate() {
    if (!nlQuery.trim()) {
      addLog('No query entered.', 'wn');
      return;
    }

    if (!activeApiKey) {
      addLog(`No API key for ${providerName}.`, 'er');
      alert(`Enter your ${providerName} API key.`);
      return;
    }

    addLog('--------------------');
    addLog(`Query: "${nlQuery.trim()}"`);
    addLog(`Model: ${model} | Dialect: ${dialect}`);
    addLog(`Provider: ${providerName} | Model: ${model}`);

    const schema = cols.map((c) => `  ${c.name} (${c.type})`).join('\n');
    const sys =
      'You are an expert SQL engineer. Convert natural language to SQL.\n' +
      'Respond ONLY with a raw JSON object, no markdown, no backticks, two keys:\n' +
      '"sql" (string) and "explanation" (one sentence).\n\n' +
      `Use ${dialect} syntax.\n` +
      `Source: read_parquet('${bucket.trim()}') AS ${tableName.trim() || 'h1b'}\n` +
      `Schema:\n${schema}\n` +
      'Default TOP N=10. ORDER BY for ranking. COUNT(*) for counts. AVG(wage) for averages.\n' +
      'fiscal_year+fiscal_quarter together for fiscal queries. year column for calendar year.\n' +
      'Always add WHERE country IS NOT NULL when country column is used.';

    setStatusText('translating');
    setStatusClass('b-spin');
    setSql(`asking ${providerName}...`);
    setSqlIsPlaceholder(true);
    setExplanation('');

    try {
      let raw;
      if (providerName === 'OpenAI') {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${activeApiKey}`,
          },
          body: JSON.stringify({
            model,
            max_tokens: 1000,
            messages: [
              { role: 'system', content: sys },
              { role: 'user', content: nlQuery.trim() },
            ],
          }),
        });
        const txt = await response.text();
        if (!response.ok) {
          let message = response.statusText;
          try {
            message = JSON.parse(txt).error.message || message;
          } catch {
            // no-op
          }
          throw new Error(message);
        }
        const data = JSON.parse(txt);
        raw = (((data.choices || [])[0] || {}).message || {}).content || '';
      } else {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': activeApiKey,
            'anthropic-version': '2023-06-01',
            'anthropic-dangerous-direct-browser-access': 'true',
          },
          body: JSON.stringify({
            model,
            max_tokens: 1000,
            system: sys,
            messages: [{ role: 'user', content: nlQuery.trim() }],
          }),
        });
        const txt = await response.text();
        if (!response.ok) {
          let message = response.statusText;
          try {
            message = JSON.parse(txt).error.message || message;
          } catch {
            // no-op
          }
          throw new Error(message);
        }
        const data = JSON.parse(txt);
        raw = (data.content || []).map((block) => block.text || '').join('');
      }

      const parsed = JSON.parse(raw.trim().replace(/```json|```/g, '').trim());
      const parsedSql = String(parsed.sql || '').trim();
      const parsedExplanation = String(parsed.explanation || '').trim();

      if (!parsedSql) {
        throw new Error('Model returned empty SQL.');
      }

      setSql(parsedSql);
      setSqlIsPlaceholder(false);
      setExplanation(parsedExplanation);
      setStatusText('SQL ready');
      setStatusClass('b-ok');
      addLog(`SQL ready (${parsedSql.length} chars)`, 'ok');
      await runQuery(parsedSql);
    } catch (error) {
      setSql(`Error: ${error.message}`);
      setSqlIsPlaceholder(true);
      setStatusText('error');
      setStatusClass('b-err');
      addLog(`Exception: ${error.message}`, 'er');
    }
  }

  function copySql() {
    navigator.clipboard.writeText(sql).catch(() => {
      addLog('Clipboard write failed', 'er');
    });
  }

  useEffect(() => {
    try {
      const v6Raw = localStorage.getItem(STORAGE_KEY);
      if (v6Raw) {
        const s = JSON.parse(v6Raw);
        if (s.bucket) setBucket(s.bucket);
        if (s.tableName) setTableName(s.tableName);
        if (s.anthropicKey) setAnthropicKey(s.anthropicKey);
        if (s.openAiKey) setOpenAiKey(s.openAiKey);
        if (s.dialect) setDialect(s.dialect);
        if (s.model) setModel(s.model);
        if (s.nlQuery) setNlQuery(s.nlQuery);
        if (Array.isArray(s.cols) && s.cols.length) setCols(s.cols);
      } else {
        const legacyRaw = localStorage.getItem(LEGACY_STORAGE_KEY);
        if (legacyRaw) {
          const s = JSON.parse(legacyRaw);
          if (s.bucket) setBucket(s.bucket);
          if (s.tablename) setTableName(s.tablename);
          if (s.model) setModel(s.model);
          if (s.dialect) setDialect(s.dialect);
          if (s.nlquery) setNlQuery(s.nlquery);
          if (Array.isArray(s.cols) && s.cols.length) setCols(s.cols);
          if (s.anthropicKey) setAnthropicKey(s.anthropicKey);
          if (s.openaiKey) setOpenAiKey(s.openaiKey);
          if (s.apikey && !s.anthropicKey && !s.openaiKey) {
            if (providerFromModel(s.model || MODELS.anthropic[0]) === 'OpenAI') {
              setOpenAiKey(s.apikey);
            } else {
              setAnthropicKey(s.apikey);
            }
          }
        }
      }
    } catch {
      // ignore hydrate parse errors
    } finally {
      hydratedRef.current = true;
    }
  }, []);

  useEffect(() => {
    if (!hydratedRef.current) {
      return;
    }
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          bucket,
          tableName,
          anthropicKey,
          openAiKey,
          dialect,
          model,
          nlQuery,
          cols,
        })
      );
    } catch {
      // ignore localStorage errors
    }
  }, [bucket, tableName, anthropicKey, openAiKey, dialect, model, nlQuery, cols]);

  useEffect(() => {
    initDuckDb().catch(() => {
      // handled in logger
    });
  }, []);

  return (
    <main className="app">
      <header className="topbar">
        <div>
          <h1>NL to SQL - React App</h1>
          <p className="sub">H1B explorer with provider switch and editable SQL</p>
        </div>
        <div className="topbar-actions">
          <a className="btn" href="/legacy/nl_to_sql.html" target="_blank" rel="noreferrer">
            Open Original HTML
          </a>
          <span className={`duck-pill ${duckReady === 'ready' ? 'ready' : duckReady === 'error' ? '' : 'loading'}`}>
            {duckReady === 'ready' ? 'DuckDB ready' : duckReady === 'error' ? 'DuckDB failed' : 'loading DuckDB...'}
          </span>
        </div>
      </header>

      <div className="layout">
        <div>
          <div className="card">
            <p className="label">Data Source</p>
            <label>Parquet endpoint</label>
            <input value={bucket} onChange={(e) => setBucket(e.target.value)} />
            <label>Table alias</label>
            <div className="row">
              <input value={tableName} onChange={(e) => setTableName(e.target.value)} />
              <button className="btn-sm" onClick={randomAlias}>
                refresh
              </button>
            </div>
          </div>

          <div className="card">
            <p className="label">API Config</p>
            <label>Anthropic API key</label>
            <div className="row">
              <input
                type={showAnthropicKey ? 'text' : 'password'}
                value={anthropicKey}
                placeholder="sk-ant-..."
                onChange={(e) => setAnthropicKey(e.target.value)}
              />
              <button className="btn-sm" onClick={() => setShowAnthropicKey((s) => !s)}>
                {showAnthropicKey ? 'hide' : 'show'}
              </button>
            </div>
            <label>OpenAI API key</label>
            <div className="row">
              <input
                type={showOpenAiKey ? 'text' : 'password'}
                value={openAiKey}
                placeholder="sk-..."
                onChange={(e) => setOpenAiKey(e.target.value)}
              />
              <button className="btn-sm" onClick={() => setShowOpenAiKey((s) => !s)}>
                {showOpenAiKey ? 'hide' : 'show'}
              </button>
            </div>
            <p className="hint">Active provider: {providerName} (selected from model).</p>
            <label>Model</label>
            <select value={model} onChange={(e) => setModel(e.target.value)}>
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
            <select value={dialect} onChange={(e) => setDialect(e.target.value)}>
              {DIALECTS.map((d) => (
                <option value={d} key={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          <div className="card">
            <p className="label">Schema Columns</p>
            <button className="btn-sm wide" onClick={sniffSchema}>
              Auto-detect from parquet
            </button>
            <div className="col-tags">
              {cols.map((c, index) => (
                <span key={`${c.name}-${index}`} className="ctag">
                  {c.name}
                  <span className="ctype">{c.type}</span>
                  <button className="cdel" onClick={() => removeColumn(index)}>
                    x
                  </button>
                </span>
              ))}
            </div>
            <div className="row">
              <input
                value={newColName}
                onChange={(e) => setNewColName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addColumn()}
                placeholder="column name"
              />
              <select value={newColType} onChange={(e) => setNewColType(e.target.value)}>
                {SQL_TYPES.map((t) => (
                  <option value={t} key={t}>
                    {t}
                  </option>
                ))}
              </select>
              <button className="btn-sm" onClick={addColumn}>
                Add
              </button>
            </div>
          </div>
        </div>

        <SampleQueries groups={QUERY_GROUPS} activeQuery={nlQuery} onPick={setNlQuery} />

        <div>
          <div className="card">
            <p className="label">Natural Language Query</p>
            <div className="row">
              <input
                value={nlQuery}
                onChange={(e) => setNlQuery(e.target.value)}
                placeholder="e.g. top employers by fiscal year"
                onKeyDown={(e) => e.key === 'Enter' && translate()}
              />
              <button className="btn-go" onClick={translate}>
                Translate + Run
              </button>
            </div>
          </div>

          <SqlOutputCard
            statusClass={statusClass}
            statusText={statusText}
            sql={sql}
            isPlaceholder={sqlIsPlaceholder}
            explanation={explanation}
            onSqlChange={(value) => {
              setSql(value);
              if (value.trim()) {
                setSqlIsPlaceholder(false);
              }
            }}
            onCopy={copySql}
            onRunEdited={() => runQuery(sql)}
            canShowActions={Boolean(sql.trim())}
          />

          <ResultsCard results={results} />
        </div>
      </div>

      <LogPanel logs={logs} open={logOpen} onToggle={() => setLogOpen((s) => !s)} />
    </main>
  );
}
