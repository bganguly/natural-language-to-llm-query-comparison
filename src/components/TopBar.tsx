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
      <div className="topbar-inner">
        <div>
          <h1>NL to SQL</h1>
          <p className="sub">H1B explorer · Anthropic &amp; OpenAI · DuckDB-WASM</p>
        </div>
        <div className="topbar-actions">
          <span className={`duck-pill ${pillClass}`}>{pillText}</span>
        </div>
      </div>
    </header>
  );
};

export default TopBar;
