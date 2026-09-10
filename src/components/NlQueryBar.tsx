interface NlQueryBarProps {
  value: string;
  onChange: (value: string) => void;
  onTranslate: () => void;
  loading?: boolean;
}

const NlQueryBar = ({ value, onChange, onTranslate, loading }: NlQueryBarProps) => {
  return (
    <div className="card">
      <p className="label">Natural Language Query</p>
      <div className="row">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="e.g. top employers by fiscal year"
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), onTranslate())}
          rows={2}
          style={{ resize: 'vertical', whiteSpace: 'pre-wrap', overflowWrap: 'break-word', flex: 1, width: 0 }}
        />
        <button className="btn-go" onClick={onTranslate} disabled={loading} style={{ position: 'relative' }}>
          {loading && (
            <span className="btn-go-overlay">
              <span className="btn-go-ring" />
            </span>
          )}
          Translate + Run
        </button>
      </div>
    </div>
  );
};

export default NlQueryBar;
