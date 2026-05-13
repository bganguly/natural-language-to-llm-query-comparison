import { useEffect, useState } from 'react';

const WAGE_COL_RE = /wage|salary|pay|compensation/i;
const YEAR_COL_RE = /year|quarter/i;

const formatValue = (value: unknown, col = ''): string => {
  if (value === null || value === undefined) {
    return '—';
  }

  if (typeof value === 'bigint') {
    return Number(value).toLocaleString('en-US');
  }

  if (typeof value === 'number') {
    const isWageCol = WAGE_COL_RE.test(col);
    const isYearCol = YEAR_COL_RE.test(col);
    if (Number.isInteger(value)) {
      if (isYearCol) return String(value);
      return value.toLocaleString('en-US', {
        minimumFractionDigits: isWageCol ? 2 : 0,
        maximumFractionDigits: isWageCol ? 2 : 0,
      });
    }
    return value.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  return String(value);
}

const FETCH_LIMITS = [50, 100, 500, 1000, 5000];
const PAGE_SIZES = [10, 25, 50, 100];

interface ResultsState {
  visible: boolean;
  loading: boolean;
  error: string;
  fields: string[];
  rows: Record<string, unknown>[];
  elapsed: string;
  badge: string;
  badgeClass: string;
}

interface ResultsCardProps {
  results: ResultsState;
  fetchLimit: number;
  onFetchMore: (limit: number) => void;
}

const ResultsCard = ({ results, fetchLimit, onFetchMore }: ResultsCardProps) => {
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => { setPage(0); }, [results.rows]);

  if (!results.visible) return null;

  const total = results.rows.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const currPage = Math.min(page, totalPages - 1);
  const start = currPage * pageSize;
  const pageRows = results.rows.slice(start, start + pageSize);

  return (
    <div className="results-card">
      <div className="results-head">
        <p className="label">Results</p>
        {results.badge && <span className={`badge ${results.badgeClass}`}>{results.badge}</span>}
      </div>

      {results.loading && (
        <div className="qspin-wrap">
          <span className="spin" />
          <span className="qspin-label">Fetching parquet + running query...</span>
        </div>
      )}

      {!results.loading && results.error && <div className="error-box">Error: {results.error}</div>}

      {!results.loading && !results.error && (
        <>
          <div className="tbl-wrap">
            <table>
              <thead>
                <tr>
                  {results.fields.map((field) => (
                    <th key={field}>{field}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pageRows.map((row, index) => (
                  <tr key={`${start + index}-${results.fields[0] ?? 'row'}`}>
                    {results.fields.map((field) => (
                      <td key={`${start + index}-${field}`} className={typeof row[field] === 'number' || typeof row[field] === 'bigint' ? 'num' : ''}>
                        {formatValue(row[field], field)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="pagination">
            <button
              className="btn-sm"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={currPage === 0}
            >
              ‹ prev
            </button>
            <span className="pg-info">
              page {currPage + 1} / {totalPages} &nbsp;·&nbsp; {total} rows · {results.elapsed}s
            </span>
            <button
              className="btn-sm"
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={currPage >= totalPages - 1}
            >
              next ›
            </button>
            <select
              className="pg-size"
              value={pageSize}
              onChange={(e) => { setPageSize(Number(e.target.value)); setPage(0); }}
            >
              {PAGE_SIZES.map((n) => (
                <option key={n} value={n}>{n} / page</option>
              ))}
            </select>
            <select
              className="pg-size"
              value={fetchLimit}
              onChange={(e) => onFetchMore(Number(e.target.value))}
              title="Max rows fetched from DB"
            >
              {FETCH_LIMITS.map((n) => (
                <option key={n} value={n}>fetch {n}</option>
              ))}
            </select>
          </div>
        </>
      )}
    </div>
  );
};

export default ResultsCard;
