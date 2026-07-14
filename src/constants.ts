export const STORAGE_KEY = 'nlsql_v6';
export const LEGACY_STORAGE_KEY = 'nlsql_v5';

export const ADJS = ['amber', 'brisk', 'coral', 'dusty', 'ember', 'frost', 'gilded', 'hazy', 'ivory', 'jade'];
export const NOUNS = ['table', 'frame', 'batch', 'slice', 'shard', 'view', 'store'];

export const MODELS: { anthropic: string[]; openai: string[]; google: string[] } = {
  anthropic: [
    'claude-opus-4-8',
    'claude-opus-4-7',
    'claude-sonnet-5',
    'claude-sonnet-4-6',
    'claude-haiku-4-5-20251001',
  ],
  openai: ['gpt-4o', 'gpt-4.1', 'gpt-4.1-mini', 'gpt-4.1-nano', 'gpt-4o-mini', 'gpt-4-turbo'],
  google: [
    'gemini-3.5-flash',
    'gemini-3.1-pro-preview',
    'gemini-3.1-flash-lite',
    'gemini-3-pro-preview',
    'gemini-3-flash-preview',
  ],
};

export type KeyMode = 'predefined' | 'own-key';

export const DIALECTS: string[] = ['DuckDB', 'Presto/Athena', 'Spark SQL', 'BigQuery'];

export interface QueryGroup {
  label: string;
  queries: string[];
}

export const QUERY_GROUPS: QueryGroup[] = [
  {
    label: 'Employers',
    queries: [
      'top employers by count',
      'top 20 employers by total wage spend',
      'top employers by fiscal_year and fiscal_quarter',
      "top employers by fiscal_year and fiscal_quarter where status = 'Certified'",
      'fastest growing employers from fiscal_year 2020 to fiscal_year 2025',
      'employers with the most applications in India vs China by year',
      'top 1 employer headcount by fiscal_year and fiscal_quarter order by fiscal_year, fiscal_quarter',
    ],
  },
  {
    label: 'Wages',
    queries: [
      'average wage by job title',
      'top 10 job titles with highest average wage',
      'average wage by job_title for fiscal_year 2025',
      'show top 10 employers by average wage, skip empty wages',
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

export interface ColDef {
  name: string;
  type: string;
}

export const DEFAULT_COLS: ColDef[] = [
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

export interface Note {
  /** substring to match against the NL query; use wordMatch for column names */
  match: string;
  text: string;
  /** use word-boundary regex instead of substring match (for column names) */
  wordMatch?: boolean;
  /** if set, note only surfaces when the active provider matches */
  providerOnly?: string;
}

export const NOTES: Note[] = [
  {
    match: 'country',
    wordMatch: true,
    text: 'country is mostly null in this dataset — queries filtering by country may return 0 rows regardless of model',
  },
  {
    match: 'wage gap between certified and denied applications by job title',
    providerOnly: 'OpenAI',
    text: 'Results vary by provider: models that use a JOIN return fewer rows than models that use CASE WHEN aggregation',
  },
];

export const SQL_TYPES: string[] = ['TEXT', 'INTEGER', 'DOUBLE', 'DATE', 'BOOLEAN', 'TIMESTAMP'];

export const DEFAULT_BUCKET =
  'https://h1b-nlq-parquet-577479071532-20260511.s3.us-east-1.amazonaws.com/data/parquet/dol_lca_h1b_fy2020_q1_to_fy2026_q1.parquet?v=full_multi_fiscal_noempty_countrynull_20260512';

export const parquetTypeToSql = (rawType: string): string => {
  const raw = String(rawType || '').toUpperCase();
  if (raw === 'INT32' || raw === 'INT64' || raw === 'INT96') return 'INTEGER';
  if (raw === 'FLOAT' || raw === 'DOUBLE') return 'DOUBLE';
  if (raw === 'BOOLEAN') return 'BOOLEAN';
  return 'TEXT';
};

export const nowClock = (): string => {
  return new Date().toLocaleTimeString('en-US', { hour12: false });
};
