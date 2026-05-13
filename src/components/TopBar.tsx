interface TopBarProps {
  duckReady: 'loading' | 'ready' | 'error';
}

const TopBar = ({ duckReady }: TopBarProps) => {
  const pillClass =
    duckReady === 'ready' ? 'ready' : duckReady === 'error' ? '' : 'loading';
  const pillText =
    duckReady === 'ready'
      ? 'DuckDB ready'
      : duckReady === 'error'
      ? 'DuckDB failed'
      : 'loading DuckDB...';

  return (
    <header className="topbar">
      <div>
        <h1>NL to SQL</h1>
        <p className="sub">H1B explorer · Anthropic &amp; OpenAI · DuckDB-WASM</p>
      </div>
      <div className="topbar-actions">
        <a className="btn" href="/legacy/nl_to_sql.html" target="_blank" rel="noreferrer">
          Open Original HTML
        </a>
        <span className={`duck-pill ${pillClass}`}>{pillText}</span>
      </div>
    </header>
  );
};

export default TopBar;
