import { useState } from 'react';
import { SQL_TYPES, ColDef } from '../constants.ts';

interface SchemaColumnsCardProps {
  cols: ColDef[];
  onSniff: () => void;
  onAddCol: (name: string, type: string) => void;
  onRemoveCol: (index: number) => void;
}

const SchemaColumnsCard = ({ cols, onSniff, onAddCol, onRemoveCol }: SchemaColumnsCardProps) => {
  const [newColName, setNewColName] = useState('');
  const [newColType, setNewColType] = useState('TEXT');

  const handleAdd = () => {
    const cleanName = newColName.trim().replace(/\s+/g, '_');
    if (!cleanName || cols.some((c) => c.name === cleanName)) return;
    onAddCol(cleanName, newColType);
    setNewColName('');
  }

  return (
    <div className="card">
      <p className="label">Schema Columns</p>
      <button className="btn-sm wide" onClick={onSniff}>
        Auto-detect from parquet
      </button>
      <div className="col-tags">
        {cols.map((c, i) => (
          <span key={`${c.name}-${i}`} className="ctag">
            {c.name}
            <span className="ctype">{c.type}</span>
            <button className="cdel" onClick={() => onRemoveCol(i)}>
              ×
            </button>
          </span>
        ))}
      </div>
      <div className="row">
        <input
          value={newColName}
          onChange={(e) => setNewColName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          placeholder="column name"
        />
        <select value={newColType} onChange={(e) => setNewColType(e.target.value)}>
          {SQL_TYPES.map((t) => (
            <option value={t} key={t}>
              {t}
            </option>
          ))}
        </select>
        <button className="btn-sm" onClick={handleAdd}>
          Add
        </button>
      </div>
    </div>
  );
};

export default SchemaColumnsCard;
