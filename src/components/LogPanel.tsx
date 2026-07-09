import { useEffect, useRef } from 'react';

interface LogEntry {
  id: string;
  ts: string;
  message: string;
  level: string;
}

interface LogPanelProps {
  logs: LogEntry[];
  open: boolean;
  onToggle: () => void;
}

const LogPanel = ({ logs, open, onToggle }: LogPanelProps) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs, open]);

  return (
    <div className="log card">
      <div className="log-hd" onClick={onToggle}>
        <span>{open ? '▾ activity log' : '▸ activity log'}</span>
        <span className="muted-small">{logs.length} entries{open ? ' · collapse' : ''}</span>
      </div>
      {open && (
        <div className="log-body">
          {logs.length === 0 && <div className="ll dim">- no activity yet -</div>}
          {logs.map((line) => (
            <div key={line.id} className={`ll ${line.level}`}>
              [{line.ts}] {line.message}
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      )}
    </div>
  );
};

export default LogPanel;
