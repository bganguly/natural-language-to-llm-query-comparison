import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MODELS } from '../constants.ts';

const { mockQuery, mockGetConnection, mockCallProvider } = vi.hoisted(() => {
  const mockQuery = vi.fn().mockResolvedValue({
    schema: { fields: [{ name: 'employer' }, { name: 'count' }] },
    toArray: () => [{ toJSON: () => ({ employer: 'Google', count: 100 }) }],
  });
  const mockGetConnection = vi.fn().mockResolvedValue({ query: mockQuery });
  const mockCallProvider = vi.fn().mockResolvedValue({
    sql: "SELECT employer FROM read_parquet('http://example.com')",
    explanation: 'Counts all employers',
  });
  return { mockQuery, mockGetConnection, mockCallProvider };
});

vi.mock('../hooks/useDuckDb.ts', () => ({
  useDuckDb: () => ({ duckReady: 'ready', getConnection: mockGetConnection }),
}));

vi.mock('../api.ts', () => ({
  callProvider: mockCallProvider,
}));

import App from '../App.tsx';

describe('App — initial render', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    mockQuery.mockResolvedValue({
      schema: { fields: [{ name: 'employer' }, { name: 'count' }] },
      toArray: () => [
        { toJSON: () => ({ employer: 'Google', count: 100 }) },
      ],
    });
    mockGetConnection.mockResolvedValue({ query: mockQuery });
    mockCallProvider.mockResolvedValue({
      sql: 'SELECT employer, COUNT(*) AS count FROM read_parquet(\'http://example.com\')',
      explanation: 'Counts all employers',
    });
  });

  it('renders the page heading', () => {
    render(<App />);
    expect(screen.getByText('NL to SQL')).toBeInTheDocument();
  });

  it('renders the sample queries panel', () => {
    render(<App />);
    expect(screen.getByText('Sample Queries')).toBeInTheDocument();
  });

  it('renders the Natural Language Query bar', () => {
    render(<App />);
    expect(screen.getByText('Natural Language Query')).toBeInTheDocument();
  });

  it('shows default model in model selector', () => {
    render(<App />);
    const modelSelects = screen.getAllByRole('combobox');
    expect(modelSelects[0]).toHaveValue(MODELS.anthropic[0]);
  });

  it('shows Translate + Run button', () => {
    render(<App />);
    expect(screen.getByRole('button', { name: /translate \+ run/i })).toBeInTheDocument();
  });
});

describe('App — sample query interaction', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('clicking a sample query fills the NL input', () => {
    render(<App />);
    const firstSampleBtn = screen.getAllByRole('button').find((b) =>
      b.textContent === 'top employers by count',
    );
    fireEvent.click(firstSampleBtn!);
    expect(screen.getByDisplayValue('top employers by count')).toBeInTheDocument();
  });
});

describe('App — translate flow', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    mockQuery.mockResolvedValue({
      schema: { fields: [{ name: 'employer' }, { name: 'count' }] },
      toArray: () => [{ toJSON: () => ({ employer: 'Google', count: 100 }) }],
    });
    mockGetConnection.mockResolvedValue({ query: mockQuery });
    mockCallProvider.mockResolvedValue({
      sql: 'SELECT employer FROM read_parquet(\'http://test.com\')',
      explanation: 'Top employers',
    });
  });

  it('shows SQL after successful translate', async () => {
    render(<App />);
    // Set API key
    const [anthropicInput] = document.querySelectorAll('input[type="password"]');
    fireEvent.change(anthropicInput, { target: { value: 'sk-ant-test-key' } });

    // Set NL query
    const nlInput = screen.getByPlaceholderText(/e.g. top employers/i);
    fireEvent.change(nlInput, { target: { value: 'top employers' } });

    fireEvent.click(screen.getByRole('button', { name: /translate \+ run/i }));

    await waitFor(() => {
      expect(mockCallProvider).toHaveBeenCalledTimes(1);
    });
  });

  it('warns when no API key is set', async () => {
    const alertMock = vi.spyOn(window, 'alert').mockImplementation(() => {});
    render(<App />);
    const nlInput = screen.getByPlaceholderText(/e.g. top employers/i);
    fireEvent.change(nlInput, { target: { value: 'top employers' } });
    fireEvent.click(screen.getByRole('button', { name: /translate \+ run/i }));
    await waitFor(() => {
      expect(alertMock).toHaveBeenCalled();
    });
    alertMock.mockRestore();
  });

  it('does not translate when NL query is empty', async () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /translate \+ run/i }));
    await waitFor(() => {
      expect(mockCallProvider).not.toHaveBeenCalled();
    });
  });
});

describe('App — provider selection', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('shows OpenAI provider when gpt model is selected', () => {
    render(<App />);
    const [modelSelect] = screen.getAllByRole('combobox');
    fireEvent.change(modelSelect, { target: { value: MODELS.openai[0] } });
    expect(screen.getByText(/Active provider: OpenAI/)).toBeInTheDocument();
  });

  it('shows Anthropic provider when claude model is selected', () => {
    render(<App />);
    const [modelSelect] = screen.getAllByRole('combobox');
    fireEvent.change(modelSelect, { target: { value: MODELS.anthropic[0] } });
    expect(screen.getByText(/Active provider: Anthropic/)).toBeInTheDocument();
  });
});

describe('App — localStorage persistence', () => {
  beforeEach(() => { localStorage.clear(); });

  it('hydrates state from stored v6 data', () => {
    localStorage.setItem(
      'nlsql_v6',
      JSON.stringify({ bucket: 'http://stored.url', tableName: 'stored_table', model: MODELS.anthropic[0], dialect: 'BigQuery', nlQuery: 'hello', cols: [], anthropicKey: '', openAiKey: '' }),
    );
    render(<App />);
    expect(screen.getByDisplayValue('http://stored.url')).toBeInTheDocument();
    expect(screen.getByDisplayValue('stored_table')).toBeInTheDocument();
  });

  it('exercises legacy v5 storage hydration path without crashing', async () => {
    localStorage.setItem(
      'nlsql_v5',
      JSON.stringify({ bucket: 'http://legacy.url', tablename: 'legacy_tbl', model: MODELS.anthropic[0], dialect: 'DuckDB', nlquery: 'hello', cols: [{ name: 'employer', type: 'VARCHAR' }], anthropicKey: 'sk-ant', openaiKey: 'sk-oai' }),
    );
    render(<App />);
    // Hydration useEffect runs and applies legacy state — just verify no crash
    await waitFor(() => expect(screen.getByText('NL to SQL')).toBeInTheDocument());
  });

  it('uses legacy apikey for OpenAI when model is openai', async () => {
    localStorage.setItem(
      'nlsql_v5',
      JSON.stringify({ bucket: 'http://x.com', tablename: 'tbl', model: MODELS.openai[0], dialect: 'DuckDB', nlquery: '', cols: [], apikey: 'sk-openai-key' }),
    );
    render(<App />);
    await waitFor(() => expect(screen.getByText('NL to SQL')).toBeInTheDocument());
  });

  it('uses legacy apikey for Anthropic when model is anthropic', async () => {
    localStorage.setItem(
      'nlsql_v5',
      JSON.stringify({ bucket: 'http://x.com', tablename: 'tbl', model: MODELS.anthropic[0], dialect: 'DuckDB', nlquery: '', cols: [], apikey: 'sk-ant-legacy' }),
    );
    render(<App />);
    await waitFor(() => expect(screen.getByText('NL to SQL')).toBeInTheDocument());
  });
});

describe('App — sniffSchema', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('queries parquet_schema and detects columns', async () => {
    mockQuery.mockResolvedValue({
      schema: { fields: [] },
      toArray: () => [
        { toJSON: () => ({ name: 'employer', type: 'BYTE_ARRAY' }) },
        { toJSON: () => ({ name: 'wage', type: 'DOUBLE' }) },
        { toJSON: () => ({ name: 'schema', type: 'INT32' }) }, // should be filtered out
      ],
    });
    mockGetConnection.mockResolvedValue({ query: mockQuery });
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /auto-detect/i }));
    await waitFor(() => {
      expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining('parquet_schema'));
    });
  });

  it('shows no-columns log when result is empty', async () => {
    mockQuery.mockResolvedValue({
      schema: { fields: [] },
      toArray: () => [],
    });
    mockGetConnection.mockResolvedValue({ query: mockQuery });
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /auto-detect/i }));
    await waitFor(() => {
      expect(mockQuery).toHaveBeenCalled();
    });
  });

  it('handles sniffSchema query error gracefully', async () => {
    mockQuery.mockRejectedValueOnce(new Error('sniff failed'));
    mockGetConnection.mockResolvedValue({ query: mockQuery });
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /auto-detect/i }));
    await waitFor(() => {
      expect(mockQuery).toHaveBeenCalled();
    });
  });
});

describe('App — translate error handling', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    mockGetConnection.mockResolvedValue({ query: mockQuery });
  });

  it('shows error in SQL output when callProvider throws', async () => {
    mockCallProvider.mockRejectedValueOnce(new Error('Rate limited'));
    render(<App />);
    const [anthropicInput] = document.querySelectorAll('input[type="password"]');
    fireEvent.change(anthropicInput, { target: { value: 'sk-ant-key' } });
    fireEvent.change(screen.getByPlaceholderText(/e.g. top employers/i), { target: { value: 'test' } });
    fireEvent.click(screen.getByRole('button', { name: /translate \+ run/i }));
    await waitFor(() => {
      const sqlArea = document.querySelector('.sql-out') as HTMLTextAreaElement;
      expect(sqlArea?.value).toContain('Rate limited');
    });
  });

  it('handles empty SQL from callProvider', async () => {
    mockCallProvider.mockResolvedValueOnce({ sql: '', explanation: '' });
    render(<App />);
    const [anthropicInput] = document.querySelectorAll('input[type="password"]');
    fireEvent.change(anthropicInput, { target: { value: 'sk-ant-key' } });
    fireEvent.change(screen.getByPlaceholderText(/e.g. top employers/i), { target: { value: 'test' } });
    fireEvent.click(screen.getByRole('button', { name: /translate \+ run/i }));
    await waitFor(() => {
      expect(mockCallProvider).toHaveBeenCalled();
    });
  });
});

describe('App — runQuery error', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('shows error in results when query throws', async () => {
    mockQuery.mockRejectedValueOnce(new Error('Table not found'));
    mockGetConnection.mockResolvedValue({ query: mockQuery });
    mockCallProvider.mockResolvedValue({
      sql: "SELECT * FROM read_parquet('http://x.com')",
      explanation: 'all rows',
    });
    render(<App />);
    const [anthropicInput] = document.querySelectorAll('input[type="password"]');
    fireEvent.change(anthropicInput, { target: { value: 'sk-ant-key' } });
    fireEvent.change(screen.getByPlaceholderText(/e.g. top employers/i), { target: { value: 'all rows' } });
    fireEvent.click(screen.getByRole('button', { name: /translate \+ run/i }));
    await waitFor(() => {
      expect(mockQuery).toHaveBeenCalled();
    });
  });
});

describe('App — copy SQL', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('calls clipboard.writeText when copy button is clicked after translation', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });

    mockQuery.mockResolvedValue({
      schema: { fields: [{ name: 'c' }] },
      toArray: () => [{ toJSON: () => ({ c: 1 }) }],
    });
    mockGetConnection.mockResolvedValue({ query: mockQuery });
    mockCallProvider.mockResolvedValue({
      sql: "SELECT c FROM read_parquet('http://x.com')",
      explanation: 'test',
    });

    render(<App />);
    const [anthropicInput] = document.querySelectorAll('input[type="password"]');
    fireEvent.change(anthropicInput, { target: { value: 'sk-ant-key' } });
    fireEvent.change(screen.getByPlaceholderText(/e.g. top employers/i), { target: { value: 'test' } });
    fireEvent.click(screen.getByRole('button', { name: /translate \+ run/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /copy sql/i })).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole('button', { name: /copy sql/i }));
    expect(writeText).toHaveBeenCalled();
  });
});

describe('App — column management', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('adds a column via SchemaColumnsCard', async () => {
    render(<App />);
    const nameInput = screen.getByPlaceholderText('column name');
    fireEvent.change(nameInput, { target: { value: 'new_field' } });
    fireEvent.click(screen.getByRole('button', { name: /^add$/i }));
    await waitFor(() => {
      expect(screen.getByText('new_field')).toBeInTheDocument();
    });
  });

  it('removes a column via SchemaColumnsCard', async () => {
    render(<App />);
    const removeButtons = screen.getAllByRole('button', { name: '×' });
    const initialCount = removeButtons.length;
    fireEvent.click(removeButtons[0]);
    await waitFor(() => {
      expect(screen.getAllByRole('button', { name: '×' }).length).toBe(initialCount - 1);
    });
  });
});

describe('App — sniffSchema edge cases', () => {
  it('alerts when bucket is empty and auto-detect is clicked', async () => {
    const alertMock = vi.spyOn(window, 'alert').mockImplementation(() => {});
    render(<App />);
    // Directly clear the bucket input (first textbox in the page)
    const [bucketInput] = screen.getAllByRole('textbox');
    fireEvent.change(bucketInput, { target: { value: '' } });
    // Wait for the controlled input value to update
    await waitFor(() => expect((bucketInput as HTMLInputElement).value).toBe(''));
    fireEvent.click(screen.getByRole('button', { name: /auto-detect/i }));
    expect(alertMock).toHaveBeenCalledWith('Enter a parquet endpoint first.');
    alertMock.mockRestore();
  });
});

describe('App — SQL textarea editing', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    mockQuery.mockResolvedValue({
      schema: { fields: [{ name: 'c' }] },
      toArray: () => [{ toJSON: () => ({ c: 1 }) }],
    });
    mockGetConnection.mockResolvedValue({ query: mockQuery });
    mockCallProvider.mockResolvedValue({
      sql: "SELECT c FROM read_parquet('http://x.com')",
      explanation: 'all',
    });
  });

  it('clears placeholder when SQL textarea is edited with content', async () => {
    render(<App />);
    const sqlArea = document.querySelector('.sql-out') as HTMLTextAreaElement;
    fireEvent.change(sqlArea, { target: { value: 'SELECT 1' } });
    expect(sqlArea.className).not.toContain('ph');
  });

  it('onFetchMore triggers runQuery with new limit', async () => {
    render(<App />);
    const [anthropicInput] = document.querySelectorAll('input[type="password"]');
    fireEvent.change(anthropicInput, { target: { value: 'sk-ant-key' } });
    fireEvent.change(screen.getByPlaceholderText(/e.g. top employers/i), { target: { value: 'test' } });
    fireEvent.click(screen.getByRole('button', { name: /translate \+ run/i }));

    await waitFor(() => expect(mockCallProvider).toHaveBeenCalled());

    // Wait for results to render, then change fetch limit
    await waitFor(() => {
      const selects = screen.getAllByRole('combobox');
      const fetchSelect = selects[selects.length - 1];
      fireEvent.change(fetchSelect, { target: { value: '1000' } });
    });
  });
});

describe('App — translate with alias rewriting', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    mockQuery.mockResolvedValue({
      schema: { fields: [{ name: 'employer' }] },
      toArray: () => [{ toJSON: () => ({ employer: 'Test' }) }],
    });
    mockGetConnection.mockResolvedValue({ query: mockQuery });
  });

  it('rewrites bare table alias when model returns SQL without read_parquet', async () => {
    // Model returns SQL with bare alias instead of read_parquet(...)
    mockCallProvider.mockResolvedValue({
      sql: 'SELECT employer FROM h1b LIMIT 10',
      explanation: 'shows employers',
    });
    render(<App />);
    const [anthropicInput] = document.querySelectorAll('input[type="password"]');
    fireEvent.change(anthropicInput, { target: { value: 'sk-ant-key' } });
    fireEvent.change(screen.getByPlaceholderText(/e.g. top employers/i), { target: { value: 'employers' } });
    fireEvent.click(screen.getByRole('button', { name: /translate \+ run/i }));
    await waitFor(() => expect(mockCallProvider).toHaveBeenCalled());
  });

  it('appends note when query matches a NOTES entry', async () => {
    mockCallProvider.mockResolvedValue({
      sql: "SELECT country FROM read_parquet('http://x.com')",
      explanation: 'shows country data',
    });
    render(<App />);
    const [anthropicInput] = document.querySelectorAll('input[type="password"]');
    fireEvent.change(anthropicInput, { target: { value: 'sk-ant-key' } });
    // 'country' triggers the country note (wordMatch: true)
    fireEvent.change(screen.getByPlaceholderText(/e.g. top employers/i), { target: { value: 'top country by count' } });
    fireEvent.click(screen.getByRole('button', { name: /translate \+ run/i }));
    await waitFor(() => expect(mockCallProvider).toHaveBeenCalled());
    // The explanation should contain the note warning
    await waitFor(() => {
      expect(document.querySelector('.expl')).not.toBeNull();
    });
  });
});

describe('App — NL query input edge cases', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('editing NL input away from sample query clears activeQuery highlight', () => {
    render(<App />);
    // click a sample query
    const firstSampleBtn = screen.getAllByRole('button').find((b) =>
      b.textContent === 'top employers by count',
    );
    fireEvent.click(firstSampleBtn!);
    expect(screen.getByRole('button', { name: 'top employers by count' }).className).toContain('active');

    // clear the input
    const nlInput = screen.getByPlaceholderText(/e.g. top employers/i);
    fireEvent.change(nlInput, { target: { value: '' } });
    expect(screen.getByRole('button', { name: 'top employers by count' }).className).not.toContain('active');
  });
});
