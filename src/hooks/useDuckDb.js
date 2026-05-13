import { useCallback, useEffect, useRef, useState } from 'react';
import * as duckdb from '@duckdb/duckdb-wasm';

export const useDuckDb = (addLog) => {
  const [duckReady, setDuckReady] = useState('loading');
  const connRef = useRef(null);
  const initPromiseRef = useRef(null);
  // keep a ref so the async IIFE always calls the latest addLog
  const addLogRef = useRef(addLog);
  addLogRef.current = addLog;

  const getConnection = useCallback(async () => {
    if (connRef.current) return connRef.current;
    if (initPromiseRef.current) return initPromiseRef.current;

    initPromiseRef.current = (async () => {
      try {
        addLogRef.current('Initialising DuckDB-WASM ...');
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
        connRef.current = conn;
        setDuckReady('ready');
        addLogRef.current('DuckDB-WASM ready', 'ok');
        return conn;
      } catch (error) {
        setDuckReady('error');
        initPromiseRef.current = null;
        addLogRef.current(`DuckDB init failed: ${error.message}`, 'er');
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
