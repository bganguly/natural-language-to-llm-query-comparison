import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

// Declare mock functions via vi.hoisted so they're ready before vi.mock factories run
const { mockConnect, mockInstantiate, mockSelectBundle } = vi.hoisted(() => ({
  mockConnect: vi.fn().mockResolvedValue({ query: vi.fn() }),
  mockInstantiate: vi.fn().mockResolvedValue(undefined),
  mockSelectBundle: vi.fn().mockResolvedValue({
    mainWorker: 'worker.js',
    mainModule: 'module.wasm',
    pthreadWorker: null,
  }),
}));

vi.mock('@duckdb/duckdb-wasm', () => ({
  getJsDelivrBundles: () => ({}),
  selectBundle: mockSelectBundle,
  ConsoleLogger: class {},
  AsyncDuckDB: class {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    instantiate(...args: any[]) { return mockInstantiate(...args); }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    connect(...args: any[]) { return mockConnect(...args); }
  },
}));

import { useDuckDb } from '../../hooks/useDuckDb.ts';

describe('useDuckDb', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockConnect.mockResolvedValue({ query: vi.fn() });
    mockInstantiate.mockResolvedValue(undefined);
  });

  it('starts in loading state', () => {
    const { result } = renderHook(() => useDuckDb(vi.fn()));
    expect(result.current.duckReady).toBe('loading');
  });

  it('transitions to ready after successful init', async () => {
    const { result } = renderHook(() => useDuckDb(vi.fn()));
    // wait for the async init triggered by useEffect
    await act(async () => {
      await result.current.getConnection();
    });
    expect(result.current.duckReady).toBe('ready');
  });

  it('returns the same connection on subsequent calls', async () => {
    const { result } = renderHook(() => useDuckDb(vi.fn()));
    await act(async () => {
      const conn1 = await result.current.getConnection();
      const conn2 = await result.current.getConnection();
      expect(conn1).toBe(conn2);
    });
    // connect should only have been called once
    expect(mockConnect).toHaveBeenCalledTimes(1);
  });

  it('logs DuckDB ready on success', async () => {
    const addLog = vi.fn();
    const { result } = renderHook(() => useDuckDb(addLog));
    await act(async () => {
      await result.current.getConnection();
    });
    expect(addLog).toHaveBeenCalledWith('DuckDB-WASM ready', 'ok');
  });

  it('transitions to error and rethrows when init fails', async () => {
    mockInstantiate.mockRejectedValueOnce(new Error('WASM load failed'));
    const addLog = vi.fn();
    const { result } = renderHook(() => useDuckDb(addLog));
    await act(async () => {
      await expect(result.current.getConnection()).rejects.toThrow('WASM load failed');
    });
    expect(result.current.duckReady).toBe('error');
    expect(addLog).toHaveBeenCalledWith(expect.stringContaining('WASM load failed'), 'er');
  });
});
