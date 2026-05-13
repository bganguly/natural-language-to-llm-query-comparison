const formatValue = (value) => {
  if (value === null || value === undefined) {
    return '—';
  }

  if (typeof value === 'bigint') {
    return Number(value).toLocaleString('en-US');
  }

  if (typeof value === 'number') {
    if (Number.isInteger(value)) {
      return value.toLocaleString('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      });
    }
    return value.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  return String(value);
}

const ResultsCard = ({ results }) => {
  if (!results.visible) {
    return null;
  }

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
                {results.rows.map((row, index) => (
                  <tr key={`${index}-${results.fields[0] ?? 'row'}`}>
                    {results.fields.map((field) => (
                      <td key={`${index}-${field}`} className={typeof row[field] === 'number' || typeof row[field] === 'bigint' ? 'num' : ''}>
                        {formatValue(row[field])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="row-count">Showing {results.rows.length} rows · {results.elapsed}s</div>
        </>
      )}
    </div>
  );
};

export default ResultsCard;
