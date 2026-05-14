import { describe, it, expect } from 'vitest';
import {
  parquetTypeToSql,
  nowClock,
  MODELS,
  DIALECTS,
  QUERY_GROUPS,
  DEFAULT_COLS,
  SQL_TYPES,
  NOTES,
  ADJS,
  NOUNS,
} from '../constants.ts';

describe('parquetTypeToSql', () => {
  it('maps INT32 to INTEGER', () => expect(parquetTypeToSql('INT32')).toBe('INTEGER'));
  it('maps INT64 to INTEGER', () => expect(parquetTypeToSql('INT64')).toBe('INTEGER'));
  it('maps INT96 to INTEGER', () => expect(parquetTypeToSql('INT96')).toBe('INTEGER'));
  it('maps FLOAT to DOUBLE', () => expect(parquetTypeToSql('FLOAT')).toBe('DOUBLE'));
  it('maps DOUBLE to DOUBLE', () => expect(parquetTypeToSql('DOUBLE')).toBe('DOUBLE'));
  it('maps BOOLEAN to BOOLEAN', () => expect(parquetTypeToSql('BOOLEAN')).toBe('BOOLEAN'));
  it('maps unknown type to TEXT', () => expect(parquetTypeToSql('VARCHAR')).toBe('TEXT'));
  it('maps empty string to TEXT', () => expect(parquetTypeToSql('')).toBe('TEXT'));
  it('is case-insensitive', () => expect(parquetTypeToSql('int32')).toBe('INTEGER'));
  it('maps BYTE_ARRAY to TEXT', () => expect(parquetTypeToSql('BYTE_ARRAY')).toBe('TEXT'));
});

describe('nowClock', () => {
  it('returns a time string', () => {
    const result = nowClock();
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  it('returns HH:MM:SS format', () => {
    const result = nowClock();
    expect(result).toMatch(/\d{2}:\d{2}:\d{2}/);
  });
});

describe('MODELS', () => {
  it('has at least one anthropic model', () => {
    expect(MODELS.anthropic.length).toBeGreaterThan(0);
  });

  it('has at least one openai model', () => {
    expect(MODELS.openai.length).toBeGreaterThan(0);
  });

  it('anthropic models start with claude-', () => {
    MODELS.anthropic.forEach((m) => expect(m).toMatch(/^claude-/));
  });

  it('openai models start with gpt-', () => {
    MODELS.openai.forEach((m) => expect(m).toMatch(/^gpt-/));
  });
});

describe('DIALECTS', () => {
  it('includes DuckDB', () => expect(DIALECTS).toContain('DuckDB'));
  it('has multiple dialects', () => expect(DIALECTS.length).toBeGreaterThan(1));
});

describe('QUERY_GROUPS', () => {
  it('has multiple groups', () => expect(QUERY_GROUPS.length).toBeGreaterThan(0));

  it('each group has a non-empty label', () => {
    QUERY_GROUPS.forEach((g) => expect(g.label).toBeTruthy());
  });

  it('each group has at least one query', () => {
    QUERY_GROUPS.forEach((g) => expect(g.queries.length).toBeGreaterThan(0));
  });
});

describe('DEFAULT_COLS', () => {
  it('includes employer column', () => {
    expect(DEFAULT_COLS.map((c) => c.name)).toContain('employer');
  });

  it('includes wage column', () => {
    expect(DEFAULT_COLS.map((c) => c.name)).toContain('wage');
  });

  it('each col has name and type', () => {
    DEFAULT_COLS.forEach((c) => {
      expect(c.name).toBeTruthy();
      expect(c.type).toBeTruthy();
    });
  });
});

describe('SQL_TYPES', () => {
  it('contains TEXT', () => expect(SQL_TYPES).toContain('TEXT'));
  it('contains INTEGER', () => expect(SQL_TYPES).toContain('INTEGER'));
  it('contains DOUBLE', () => expect(SQL_TYPES).toContain('DOUBLE'));
});

describe('NOTES', () => {
  it('is an array', () => expect(Array.isArray(NOTES)).toBe(true));

  it('each note has match and text', () => {
    NOTES.forEach((n) => {
      expect(n.match).toBeTruthy();
      expect(n.text).toBeTruthy();
    });
  });
});

describe('ADJS and NOUNS', () => {
  it('ADJS has entries', () => expect(ADJS.length).toBeGreaterThan(0));
  it('NOUNS has entries', () => expect(NOUNS.length).toBeGreaterThan(0));
  it('ADJS values are strings', () => ADJS.forEach((a) => expect(typeof a).toBe('string')));
  it('NOUNS values are strings', () => NOUNS.forEach((n) => expect(typeof n).toBe('string')));
});
