import { ADJS, NOUNS } from '../constants.ts';

interface DataSourceCardProps {
  tableName: string;
  onTableNameChange: (name: string) => void;
}

const DataSourceCard = ({ tableName, onTableNameChange }: DataSourceCardProps) => {
  const randomAlias = () => {
    const adj = ADJS[Math.floor(Math.random() * ADJS.length)];
    const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
    onTableNameChange(`${adj}_${noun}_${Math.floor(Math.random() * 90) + 10}`);
  }

  return (
    <div className="card">
      <p className="label">Data Source</p>
      <label>Table alias</label>
      <div className="row">
        <input value={tableName} onChange={(e) => onTableNameChange(e.target.value)} />
        <button className="btn-sm" onClick={randomAlias}>
          refresh
        </button>
      </div>
    </div>
  );
};

export default DataSourceCard;
