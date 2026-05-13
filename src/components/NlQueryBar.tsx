interface NlQueryBarProps {
  value: string;
  onChange: (value: string) => void;
  onTranslate: () => void;
}

const NlQueryBar = ({ value, onChange, onTranslate }: NlQueryBarProps) => {
  return (
    <div className="card">
      <p className="label">Natural Language Query</p>
      <div className="row">
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="e.g. top employers by fiscal year"
          onKeyDown={(e) => e.key === 'Enter' && onTranslate()}
        />
        <button className="btn-go" onClick={onTranslate}>
          Translate + Run
        </button>
      </div>
    </div>
  );
};

export default NlQueryBar;
