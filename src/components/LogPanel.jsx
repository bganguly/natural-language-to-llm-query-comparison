const LogPanel = ({ logs, open, onToggle }) => {
  return (
    <div className="log card full-span">
      <div className="log-hd" onClick={onToggle}>
        <span>{open ? '▾ verbose log' : '▸ verbose log'}</span>
        <span className="muted-small">{open ? 'collapse' : 'expand'}</span>
      </div>
      {open && (
        <div className="log-body">
          {logs.length === 0 && <div className="ll dim">- no activity yet -</div>}
          {logs.map((line) => (
            <div key={line.id} className={`ll ${line.level}`}>
              [{line.ts}] {line.message}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default LogPanel;
