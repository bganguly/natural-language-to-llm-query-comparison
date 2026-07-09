import { useCallback, useEffect, useRef, useState } from 'react';
import * as duckdb from '@duckdb/duckdb-wasm';

type LogLevel = 'ok' | 'er' | 'info';
type AddLog = (message: string, level?: LogLevel) => void;

interface UseDuckDbResult {
  duckReady: 'loading' | 'ready' | 'error';
  getConnection: () => Promise<duckdb.AsyncDuckDBConnection>;
}

export const useDuckDb = (addLog: AddLog): UseDuckDbResult => {
  const [duckReady, setDuckReady] = useState<'loading' | 'ready' | 'error'>('loading');
  const connRef = useRef<duckdb.AsyncDuckDBConnection | null>(null);
  const initPromiseRef = useRef<Promise<duckdb.AsyncDuckDBConnection> | null>(null);
  // keep a ref so the async IIFE always calls the latest addLog
  const addLogRef = useRef(addLog);
  addLogRef.current = addLog;

  const getConnection = useCallback(async () => {
    if (connRef.current) return connRef.current;
    if (initPromiseRef.current) return initPromiseRef.current;

    initPromiseRef.current = (async () => {
      try {
        setDuckReady('loading');
        addLogRef.current('DuckDB › fetching WASM bundle from CDN...');
        const bundles = duckdb.getJsDelivrBundles();
        const bundle = await duckdb.selectBundle(bundles);
        addLogRef.current(`DuckDB › bundle selected: ${bundle.mainModule.split('/').pop()}`);
        const workerUrl = URL.createObjectURL(
          new Blob([`importScripts("${bundle.mainWorker}");`], { type: 'text/javascript' })
        );
        addLogRef.current('DuckDB › starting web worker...');
        const worker = new Worker(workerUrl);
        const db = new duckdb.AsyncDuckDB(new duckdb.ConsoleLogger(), worker);
        addLogRef.current('DuckDB › instantiating engine...');
        await db.instantiate(bundle.mainModule, bundle.pthreadWorker);
        URL.revokeObjectURL(workerUrl);
        const conn = await db.connect();
        connRef.current = conn;
        setDuckReady('ready');
        addLogRef.current('DuckDB › ready', 'ok');
        return conn;
      } catch (error) {
        setDuckReady('error');
        initPromiseRef.current = null;
        addLogRef.current(`DuckDB init failed: ${(error as Error).message}`, 'er');
        throw error;
      }
    })();

    return initPromiseRef.current;
  }, []); // stable reference — deps are all refs

  useEffect(() => {
    getConnection().catch(() => {});
  }, [getConnection]);

  return { duckReady, getConnection };
};
