import { QueryGroup } from '../constants.ts';

interface SampleQueriesProps {
  groups: QueryGroup[];
  activeQuery: string;
  onPick: (query: string) => void;
}

const SampleQueries = ({ groups, activeQuery, onPick }: SampleQueriesProps) => {
  return (
    <div className="card query-lib">
      <p className="label">Sample Queries</p>
      {groups.map((group) => (
        <div key={group.label} className="qlib-group">
          <p className="group-label">{group.label}</p>
          {group.queries.map((q) => (
            <button
              key={q}
              className={`qlib-item ${activeQuery === q ? 'active' : ''}`}
              onClick={() => onPick(q)}
            >
              {q}
            </button>
          ))}
        </div>
      ))}
    </div>
  );
};

export default SampleQueries;
