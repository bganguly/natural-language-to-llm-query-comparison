export const STORAGE_KEY = 'nlsql_v6';
export const LEGACY_STORAGE_KEY = 'nlsql_v5';

export const ADJS = ['amber', 'brisk', 'coral', 'dusty', 'ember', 'frost', 'gilded', 'hazy', 'ivory', 'jade'];
export const NOUNS = ['table', 'frame', 'batch', 'slice', 'shard', 'view', 'store'];

export const MODELS = {
  anthropic: [
    'claude-sonnet-4-5',
    'claude-opus-4-5',
    'claude-haiku-4-5-20251001',
  ],
  openai: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo'],
};

export const DIALECTS = ['DuckDB', 'Presto/Athena', 'Spark SQL', 'BigQuery'];

export const QUERY_GROUPS = [
  {
    label: 'Employers',
    queries: [
      'top employers by count',
      'top 20 employers by total wage spend',
      'top employers by fiscal_year and fiscal_quarter',
      "top employers by fiscal_year and fiscal_quarter where status = 'Certified'",
      'fastest growing employers from fiscal_year 2020 to fiscal_year 2025',
      'employers with the most applications in India vs China by year',
      'top 5 employers headcount by fiscal_year and fiscal_quarter',
    ],
  },
  {
    label: 'Wages',
    queries: [
      'average wage by job title',
      'top 10 job titles with highest average wage',
      'average wage by job_title for fiscal_year 2025',
      'top 20 employers by total wage spend',
      'wage gap between certified and denied applications by job title',
      'average wage by work_location and fiscal_year',
      'wage distribution by country and fiscal_quarter',
    ],
  },
  {
    label: 'Geography',
    queries: [
      'which countries have the most H1B applications by year',
      'top countries by application count in fiscal_year 2025',
      'top work locations by application count',
      'top work locations by average wage',
      'application count by country and fiscal_year and fiscal_quarter',
    ],
  },
  {
    label: 'Trends',
    queries: [
      'quarter over quarter growth in applications by employer',
      'application count by fiscal_year and fiscal_quarter',
      'top job titles by fiscal_year and fiscal_quarter',
      'certified vs denied application counts by fiscal_year',
      'employer count by status and fiscal_year',
      'new employers appearing for the first time each fiscal_year',
    ],
  },
  {
    label: 'Status & Jobs',
    queries: [
      'count of applications by status',
      'top 10 job titles with highest average wage in fiscal_year 2025',
      'job titles with most certified applications by fiscal_quarter',
      'denial rate by employer in fiscal_year 2024',
      'top job titles by country and fiscal_year',
    ],
  },
];

export const DEFAULT_COLS = [
  { name: 'employer', type: 'TEXT' },
  { name: 'job_title', type: 'TEXT' },
  { name: 'country', type: 'TEXT' },
  { name: 'work_location', type: 'TEXT' },
  { name: 'wage', type: 'DOUBLE' },
  { name: 'status', type: 'TEXT' },
  { name: 'year', type: 'INTEGER' },
  { name: 'fiscal_year', type: 'INTEGER' },
  { name: 'fiscal_quarter', type: 'INTEGER' },
];

export const SQL_TYPES = ['TEXT', 'INTEGER', 'DOUBLE', 'DATE', 'BOOLEAN', 'TIMESTAMP'];

export const DEFAULT_BUCKET =
  'https://h1b-nlq-parquet-577479071532-20260511.s3.us-east-1.amazonaws.com/data/parquet/dol_lca_h1b_fy2020_q1_to_fy2026_q1.parquet?v=full_multi_fiscal_noempty_countrynull_20260512';

export const parquetTypeToSql = (rawType) => {
  const raw = String(rawType || '').toUpperCase();
  if (raw === 'INT32' || raw === 'INT64' || raw === 'INT96') return 'INTEGER';
  if (raw === 'FLOAT' || raw === 'DOUBLE') return 'DOUBLE';
  if (raw === 'BOOLEAN') return 'BOOLEAN';
  return 'TEXT';
};

export const nowClock = () => {
  return new Date().toLocaleTimeString('en-US', { hour12: false });
};
