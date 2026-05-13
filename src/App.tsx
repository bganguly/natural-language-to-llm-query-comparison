import { useEffect, useMemo, useRef, useState } from 'react';
import { callProvider } from './api.ts';
import ApiConfigCard from './components/ApiConfigCard.tsx';
import DataSourceCard from './components/DataSourceCard.tsx';
import LogPanel from './components/LogPanel.tsx';
import NlQueryBar from './components/NlQueryBar.tsx';
import ResultsCard from './components/ResultsCard.tsx';
import SampleQueries from './components/SampleQueries.tsx';
import SchemaColumnsCard from './components/SchemaColumnsCard.tsx';
import SqlOutputCard from './components/SqlOutputCard.tsx';
import TopBar from './components/TopBar.tsx';
import {
  DEFAULT_BUCKET,
  DEFAULT_COLS,
  LEGACY_STORAGE_KEY,
  MODELS,
  QUERY_GROUPS,
  QUERY_WARNS,
  STORAGE_KEY,
  nowClock,
  parquetTypeToSql,
} from './constants.ts';
import { useDuckDb } from './hooks/useDuckDb.ts';

const providerFromModel = (model: string): string => (model.startsWith('gpt-') ? 'OpenAI' : 'Anthropic');

// Replace a bare table-name reference with the full read_parquet(...) expression.
// Handles: FROM alias, JOIN alias, FROM alias AS x, subquery aliases.
const fixTableRef = (sqlStr: string, alias: string, bucketUrl: string): string => {
  if (!alias) return sqlStr;
  // Already uses read_parquet — nothing to do
  if (/read_parquet/i.test(sqlStr)) return sqlStr;
  const escaped = alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  // Match alias when preceded by FROM or JOIN (with optional whitespace/newline)
  const re = new RegExp(`(?<=(\\bFROM|\\bJOIN)\\s+)${escaped}\\b`, 'gi');
  return sqlStr.replace(re, `read_parquet('${bucketUrl}')`);
};

const App = () => {
  // ── Config state ──────────────────────────────────────────────────────────
  const [bucket, setBucket] = useState(DEFAULT_BUCKET);
  const [tableName, setTableName] = useState('h1b');
  const [anthropicKey, setAnthropicKey] = useState('');
  const [openAiKey, setOpenAiKey] = useState('');
  const [model, setModel] = useState(MODELS.anthropic[0]);
  const [dialect, setDialect] = useState('DuckDB');
  const [cols, setCols] = useState(DEFAULT_COLS);

  // ── Query / output state ──────────────────────────────────────────────────
  const [nlQuery, setNlQuery] = useState('');
  const [activeQuery, setActiveQuery] = useState('');
  const [sql, setSql] = useState('Translated SQL will appear here.');
  const [sqlIsPlaceholder, setSqlIsPlaceholder] = useState(true);
  const [explanation, setExplanation] = useState('');
  const [statusText, setStatusText] = useState('waiting');
  const [statusClass, setStatusClass] = useState('b-idle');
  const [results, setResults] = useState<{
    visible: boolean; loading: boolean; error: string;
    fields: string[]; rows: Record<string, unknown>[]; elapsed: string; badge: string; badgeClass: string;
  }>({
    visible: false, loading: false, error: '',
    fields: [], rows: [], elapsed: '0.0', badge: '', badgeClass: 'b-idle',
  });

  // ── Log state ─────────────────────────────────────────────────────────────
  const [logs, setLogs] = useState<{ id: string; ts: string; message: string; level: string }[]>([]);
  const [logOpen, setLogOpen] = useState(false);
  const [fetchLimit, setFetchLimit] = useState(500);

  const hydratedRef = useRef(false);
  const providerName = useMemo(() => providerFromModel(model), [model]);
  const activeApiKey = providerName === 'OpenAI' ? openAiKey.trim() : anthropicKey.trim();

  const addLog = (message: string, level = 'n') => {
    setLogs((prev) => [...prev, { id: `${Date.now()}-${prev.length}`, ts: nowClock(), message, level }]);
    setLogOpen(true);
  };

  // ── DuckDB ────────────────────────────────────────────────────────────────
  const { duckReady, getConnection } = useDuckDb(addLog);

  // ── Run SQL ───────────────────────────────────────────────────────────────
  const runQuery = async (rawSql: string, limitOverride?: number) => {
    const sqlToRun = rawSql.trim();
    if (!sqlToRun) { alert('Enter SQL first.'); return; }
    const cap = limitOverride ?? fetchLimit;
    // Always strip any LIMIT/OFFSET the LLM injected, then apply our cap
    const stripped = sqlToRun
      .replace(/\bLIMIT\s+\d+(\s+OFFSET\s+\d+)?/gi, '')
      .replace(/;\s*$/, '')
      .trim();
    const safeSQL = `${stripped}\nLIMIT ${cap}`;
    setResults({ visible: true, loading: true, error: '', fields: [], rows: [], elapsed: '0.0', badge: 'querying', badgeClass: 'b-spin' });
    const t0 = Date.now();
    try {
      const conn = await getConnection();
      const result = await conn.query(safeSQL);
      const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
      const fields = result.schema.fields.map((f) => f.name);
      const rows = result.toArray().map((r) => (typeof r.toJSON === 'function' ? r.toJSON() : r));
      addLog(`Query done in ${elapsed}s - ${rows.length} rows`, 'ok');
      setResults({ visible: true, loading: false, error: '', fields, rows, elapsed, badge: `${rows.length} rows`, badgeClass: 'b-ok' });
    } catch (error) {
      addLog(`Query error: ${(error as Error).message}`, 'er');
      setResults({ visible: true, loading: false, error: (error as Error).message, fields: [], rows: [], elapsed: '0.0', badge: 'error', badgeClass: 'b-err' });
    }
  };

  // ── Schema sniff ──────────────────────────────────────────────────────────
  const sniffSchema = async () => {
    if (!bucket.trim()) { alert('Enter a parquet endpoint first.'); return; }
    try {
      addLog('Sniffing schema ...');
      const conn = await getConnection();
      const result = await conn.query(`SELECT name, type FROM parquet_schema('${bucket.trim()}')`);
      const rows = result.toArray().map((r) => (typeof r.toJSON === 'function' ? r.toJSON() : r));
      const detected = rows
        .map((r) => ({ name: String(r.name || ''), raw: String(r.type || '') }))
        .filter((r) => r.name && r.name !== 'schema' && r.raw)
        .map((r) => ({ name: r.name, type: parquetTypeToSql(r.raw) }));
      if (detected.length) { setCols(detected); addLog(`Detected ${detected.length} columns`, 'ok'); }
      else addLog('No columns detected from parquet_schema response', 'wn');
    } catch (error) {
      addLog(`Sniff error: ${(error as Error).message}`, 'er');
    }
  };

  // ── Translate (NL → SQL) ──────────────────────────────────────────────────
  const translate = async () => {
    if (!nlQuery.trim()) { addLog('No query entered.', 'wn'); return; }
    if (!activeApiKey) {
      addLog(`No API key for ${providerName}.`, 'er');
      alert(`Enter your ${providerName} API key.`);
      return;
    }
    addLog('--------------------');
    addLog(`Query: "${nlQuery.trim()}"`);
    addLog(`Provider: ${providerName} | Model: ${model} | Dialect: ${dialect}`);

    const schema = cols.map((c) => `  ${c.name} (${c.type})`).join('\n');
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1; // 1-based
    // DOL fiscal year runs Oct–Sep; FY2026 = Oct 2025–Sep 2026
    const currentFiscalYear = currentMonth >= 10 ? currentYear + 1 : currentYear;

    const systemPrompt =
      'You are an expert SQL engineer. Convert natural language to SQL.\n' +
      'Respond ONLY with a raw JSON object, no markdown, no backticks, two keys:\n' +
      '"sql" (string) and "explanation" (one sentence).\n\n' +
      `Today's date: ${now.toISOString().slice(0, 10)}. Current fiscal year: ${currentFiscalYear}.\n` +
      `Use ${dialect} syntax.\n` +
      `Source: read_parquet('${bucket.trim()}') AS ${tableName.trim() || 'h1b'}\n` +
      `Schema:\n${schema}\n` +
      'Default TOP N=10. ORDER BY for ranking. COUNT(*) for counts. AVG(wage) for averages.\n' +
      'fiscal_year+fiscal_quarter together for fiscal queries. year column for calendar year.\n' +
      'Only add WHERE filters that are explicitly requested in the natural language query.\n' +
      'Use ILIKE instead of LIKE for all string pattern matching on text columns.';

    setStatusText('translating'); setStatusClass('b-spin');
    setSql(`asking ${providerName}...`); setSqlIsPlaceholder(true); setExplanation('');
    setResults({ visible: false, loading: false, error: '', fields: [], rows: [], elapsed: '0.0', badge: '', badgeClass: 'b-idle' });

    try {
      const { sql: parsedSql, explanation: parsedExplanation } = await callProvider({
        model, apiKey: activeApiKey, systemPrompt, nlQuery: nlQuery.trim(), providerName,
      });
      if (!parsedSql) throw new Error('Model returned empty SQL.');
      const fixedSql = fixTableRef(parsedSql, tableName.trim() || 'h1b', bucket.trim());
      if (fixedSql !== parsedSql) addLog(`Rewrote bare table alias "${tableName.trim() || 'h1b'}" → read_parquet(...)`, 'wn');
      // Append data-quality notes only when the NL query is explicitly about that column
      const colNotes = cols
        .filter((c) => c.note && new RegExp(`\\b${c.name}s?\\b`, 'i').test(nlQuery.trim()))
        .map((c) => c.note);
      const queryWarn = providerName === 'OpenAI'
        ? Object.entries(QUERY_WARNS).find(([k]) => nlQuery.trim().toLowerCase().includes(k.toLowerCase()))?.[1]
        : undefined;
      const allNotes = [...colNotes, ...(queryWarn ? [queryWarn] : [])];
      const finalExplanation = allNotes.length
        ? `${parsedExplanation} ⚠️ Note: ${allNotes.join(' ')}`
        : parsedExplanation;
      setSql(fixedSql); setSqlIsPlaceholder(false); setExplanation(finalExplanation);
      setStatusText('SQL ready'); setStatusClass('b-ok');
      addLog(`SQL ready (${fixedSql.length} chars)`, 'ok');
      await runQuery(fixedSql);
    } catch (error) {
      setSql(`Error: ${(error as Error).message}`); setSqlIsPlaceholder(true);
      setStatusText('error'); setStatusClass('b-err');
      addLog(`Exception: ${(error as Error).message}`, 'er');
    }
  };

  // ── Persistence ───────────────────────────────────────────────────────────
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
            if (providerFromModel(s.model || MODELS.anthropic[0]) === 'OpenAI') setOpenAiKey(s.apikey);
            else setAnthropicKey(s.apikey);
          }
        }
      }
    } catch { /* ignore */ } finally { hydratedRef.current = true; }
  }, []);

  useEffect(() => {
    if (!hydratedRef.current) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ bucket, tableName, anthropicKey, openAiKey, dialect, model, nlQuery, cols }));
    } catch { /* ignore */ }
  }, [bucket, tableName, anthropicKey, openAiKey, dialect, model, nlQuery, cols]);

  // ── Layout ────────────────────────────────────────────────────────────────
  return (
    <main className="app">
      <TopBar duckReady={duckReady} />

      <div className="layout">
        {/* Left column: config panels */}
        <div>
          <DataSourceCard
            bucket={bucket} onBucketChange={setBucket}
            tableName={tableName} onTableNameChange={setTableName}
          />
          <ApiConfigCard
            anthropicKey={anthropicKey} onAnthropicKeyChange={setAnthropicKey}
            openAiKey={openAiKey} onOpenAiKeyChange={setOpenAiKey}
            model={model} onModelChange={setModel}
            dialect={dialect} onDialectChange={setDialect}
            providerName={providerName}
          />
          <SchemaColumnsCard
            cols={cols}
            onSniff={sniffSchema}
            onAddCol={(name, type) => setCols((prev) => [...prev, { name, type }])}
            onRemoveCol={(index: number) => setCols((prev) => prev.filter((_, i) => i !== index))}
          />
        </div>

        {/* Middle column: sample queries */}
        <SampleQueries groups={QUERY_GROUPS} activeQuery={activeQuery} onPick={(q) => {
          setNlQuery(q); setActiveQuery(q);
          setSql('Translated SQL will appear here.'); setSqlIsPlaceholder(true);
          setExplanation(''); setStatusText('waiting'); setStatusClass('b-idle');
          setResults({ visible: false, loading: false, error: '', fields: [], rows: [], elapsed: '0.0', badge: '', badgeClass: 'b-idle' });
        }} />

        {/* Right column: query input + SQL output + results */}
        <div>
          <NlQueryBar value={nlQuery} onChange={(v) => { setNlQuery(v); if (activeQuery && !v.startsWith(activeQuery)) setActiveQuery(''); }} onTranslate={translate} />
          <SqlOutputCard
            statusClass={statusClass} statusText={statusText}
            sql={sql} isPlaceholder={sqlIsPlaceholder} explanation={explanation}
            onSqlChange={(value) => { setSql(value); if (value.trim()) setSqlIsPlaceholder(false); }}
            onCopy={() => navigator.clipboard.writeText(sql).catch(() => addLog('Clipboard write failed', 'er'))}
            onRunEdited={() => runQuery(sql)}
            canShowActions={Boolean(sql.trim())}
          />
          <ResultsCard
            results={results}
            fetchLimit={fetchLimit}
            onFetchMore={(newLimit) => { setFetchLimit(newLimit); runQuery(sql, newLimit); }}
          />
        </div>
      </div>

      <LogPanel logs={logs} open={logOpen} onToggle={() => setLogOpen((s) => !s)} />
    </main>
  );
};

export default App;
