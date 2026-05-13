import { QUERY_WARNS } from '../constants.js';

const SampleQueries = ({ groups, activeQuery, onPick }) => {
  return (
    <div className="card query-lib">
      <p className="label">Sample Queries</p>
      {groups.map((group) => (
        <div key={group.label} className="qlib-group">
          <p className="group-label">{group.label}</p>
          {group.queries.map((q) => (
            <div key={q} className="qlib-wrap">
              <button
                className={`qlib-item ${activeQuery === q ? 'active' : ''}`}
                onClick={() => onPick(q)}
              >
                {q}
              </button>
              {QUERY_WARNS[q] && (
                <p className="qlib-note">⚠ {QUERY_WARNS[q]}</p>
              )}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

export default SampleQueries;
