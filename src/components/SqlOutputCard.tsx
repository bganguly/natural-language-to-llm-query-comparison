interface SqlOutputCardProps {
  statusClass: string;
  statusText: string;
  sql: string;
  isPlaceholder: boolean;
  explanation: string;
  onSqlChange: (sql: string) => void;
  onCopy: () => void;
  onRunEdited: () => void;
  canShowActions: boolean;
}

const SqlOutputCard = ({
  statusClass,
  statusText,
  sql,
  isPlaceholder,
  explanation,
  onSqlChange,
  onCopy,
  onRunEdited,
  canShowActions,
}: SqlOutputCardProps) => {
  return (
    <div className="out-card">
      <div className="out-head">
        <span className={`badge ${statusClass}`}>{statusText}</span>
        <div className="out-actions">
          {canShowActions && (
            <>
              <button className="btn-copy" onClick={onRunEdited}>
                ▶ run edited SQL
              </button>
              <button className="btn-copy" onClick={onCopy}>
                ⎘ copy SQL
              </button>
            </>
          )}
        </div>
      </div>
      <textarea
        className={`sql-out ${isPlaceholder ? 'ph' : ''}`}
        spellCheck="false"
        value={sql}
        onChange={(event) => onSqlChange(event.target.value)}
      />
      {explanation && (
        <div className="expl">
          <strong>Why this query</strong>
          <span>{explanation}</span>
        </div>
      )}
    </div>
  );
};

export default SqlOutputCard;
