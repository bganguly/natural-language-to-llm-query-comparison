import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import ResultsCard from '../../components/ResultsCard.tsx';

const makeResults = (overrides = {}) => ({
  visible: true,
  loading: false,
  error: '',
  fields: ['employer', 'count', 'wage', 'fiscal_year', 'notes'],
  rows: [
    { employer: 'Google', count: 100, wage: 150000.5, fiscal_year: 2025, notes: 'top' },
    { employer: 'Meta', count: 90, wage: null, fiscal_year: 2024, notes: null },
  ],
  elapsed: '0.5',
  badge: '2 rows',
  badgeClass: 'b-ok',
  ...overrides,
});

const defaultProps = {
  results: makeResults(),
  fetchLimit: 500,
  onFetchMore: vi.fn(),
};

describe('ResultsCard — visibility', () => {
  it('renders nothing when visible=false', () => {
    const { container } = render(
      <ResultsCard {...defaultProps} results={makeResults({ visible: false })} />,
    );
    expect(container.firstChild).toBeNull();
  });
});

describe('ResultsCard — loading state', () => {
  it('shows spinner when loading', () => {
    render(<ResultsCard {...defaultProps} results={makeResults({ loading: true })} />);
    expect(screen.getByText(/Fetching parquet/i)).toBeInTheDocument();
    expect(document.querySelector('.spin')).toBeInTheDocument();
  });
});

describe('ResultsCard — error state', () => {
  it('shows error message', () => {
    render(
      <ResultsCard {...defaultProps} results={makeResults({ error: 'Table not found' })} />,
    );
    expect(screen.getByText(/Error: Table not found/)).toBeInTheDocument();
  });
});

describe('ResultsCard — badge', () => {
  it('shows badge when provided', () => {
    render(<ResultsCard {...defaultProps} />);
    expect(screen.getByText('2 rows')).toBeInTheDocument();
  });

  it('hides badge when empty', () => {
    render(<ResultsCard {...defaultProps} results={makeResults({ badge: '' })} />);
    expect(screen.queryByText('2 rows')).not.toBeInTheDocument();
  });
});

describe('ResultsCard — table rendering', () => {
  it('renders column headers', () => {
    render(<ResultsCard {...defaultProps} />);
    expect(screen.getByRole('columnheader', { name: 'employer' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'wage' })).toBeInTheDocument();
  });

  it('renders row data', () => {
    render(<ResultsCard {...defaultProps} />);
    expect(screen.getByText('Google')).toBeInTheDocument();
    expect(screen.getByText('Meta')).toBeInTheDocument();
  });
});

describe('ResultsCard — isNumericCol header alignment', () => {
  it('applies num class to "wage" column header (name match)', () => {
    render(<ResultsCard {...defaultProps} />);
    const wageHeader = screen.getByRole('columnheader', { name: 'wage' });
    expect(wageHeader.className).toContain('num');
  });

  it('applies num class to "fiscal_year" column header (name match)', () => {
    render(<ResultsCard {...defaultProps} />);
    const fyHeader = screen.getByRole('columnheader', { name: 'fiscal_year' });
    expect(fyHeader.className).toContain('num');
  });

  it('applies num class to "count" column header (numeric row values)', () => {
    render(<ResultsCard {...defaultProps} />);
    const countHeader = screen.getByRole('columnheader', { name: 'count' });
    expect(countHeader.className).toContain('num');
  });

  it('does NOT apply num class to "employer" (text column)', () => {
    render(<ResultsCard {...defaultProps} />);
    const empHeader = screen.getByRole('columnheader', { name: 'employer' });
    expect(empHeader.className).not.toContain('num');
  });

  it('does NOT apply num class to text col with no data (empty rows)', () => {
    render(
      <ResultsCard
        {...defaultProps}
        results={makeResults({ rows: [], fields: ['employer', 'notes'] })}
      />,
    );
    const empHeader = screen.getByRole('columnheader', { name: 'employer' });
    expect(empHeader.className).not.toContain('num');
  });
});

describe('ResultsCard — formatValue', () => {
  it('renders null as em-dash', () => {
    render(<ResultsCard {...defaultProps} />);
    // wage=null and notes=null for Meta row
    const cells = screen.getAllByRole('cell');
    const dashCells = cells.filter((c) => c.textContent === '—');
    expect(dashCells.length).toBeGreaterThanOrEqual(1);
  });

  it('formats integer non-year/wage col with locale thousands', () => {
    render(
      <ResultsCard
        {...defaultProps}
        results={makeResults({
          fields: ['headcount'],
          rows: [{ headcount: 1234567 }],
        })}
      />,
    );
    // 1,234,567
    expect(screen.getByText('1,234,567')).toBeInTheDocument();
  });

  it('formats integer wage col with 2 decimal places', () => {
    render(
      <ResultsCard
        {...defaultProps}
        results={makeResults({
          fields: ['wage'],
          rows: [{ wage: 100000 }],
        })}
      />,
    );
    expect(screen.getByText('100,000.00')).toBeInTheDocument();
  });

  it('formats integer year col as plain string (no formatting)', () => {
    render(
      <ResultsCard
        {...defaultProps}
        results={makeResults({
          fields: ['fiscal_year'],
          rows: [{ fiscal_year: 2025 }],
        })}
      />,
    );
    expect(screen.getByText('2025')).toBeInTheDocument();
  });

  it('formats float as 2-decimal locale string', () => {
    render(
      <ResultsCard
        {...defaultProps}
        results={makeResults({
          fields: ['score'],
          rows: [{ score: 3.14159 }],
        })}
      />,
    );
    expect(screen.getByText('3.14')).toBeInTheDocument();
  });

  it('formats bigint values', () => {
    render(
      <ResultsCard
        {...defaultProps}
        results={makeResults({
          fields: ['big_num'],
          rows: [{ big_num: BigInt(5000) }],
        })}
      />,
    );
    expect(screen.getByText('5,000')).toBeInTheDocument();
  });

  it('renders string values as-is', () => {
    render(<ResultsCard {...defaultProps} />);
    expect(screen.getByText('Google')).toBeInTheDocument();
  });
});

describe('ResultsCard — pagination', () => {
  const manyRows = Array.from({ length: 15 }, (_, i) => ({
    employer: `Employer${i}`,
    count: i,
  }));

  it('shows first page (10 rows) by default', () => {
    render(
      <ResultsCard
        {...defaultProps}
        results={makeResults({ fields: ['employer', 'count'], rows: manyRows })}
      />,
    );
    expect(screen.getByText('Employer0')).toBeInTheDocument();
    expect(screen.queryByText('Employer10')).not.toBeInTheDocument();
  });

  it('shows page info', () => {
    render(
      <ResultsCard
        {...defaultProps}
        results={makeResults({ fields: ['employer', 'count'], rows: manyRows })}
      />,
    );
    expect(screen.getByText(/page 1 \/ 2/)).toBeInTheDocument();
  });

  it('prev button is disabled on first page', () => {
    render(
      <ResultsCard
        {...defaultProps}
        results={makeResults({ fields: ['employer', 'count'], rows: manyRows })}
      />,
    );
    expect(screen.getByRole('button', { name: /prev/i })).toBeDisabled();
  });

  it('next button navigates to second page', () => {
    render(
      <ResultsCard
        {...defaultProps}
        results={makeResults({ fields: ['employer', 'count'], rows: manyRows })}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /next/i }));
    expect(screen.getByText('Employer10')).toBeInTheDocument();
    expect(screen.getByText(/page 2 \/ 2/)).toBeInTheDocument();
  });

  it('next button is disabled on last page', () => {
    render(
      <ResultsCard
        {...defaultProps}
        results={makeResults({ fields: ['employer', 'count'], rows: manyRows })}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /next/i }));
    expect(screen.getByRole('button', { name: /next/i })).toBeDisabled();
  });

  it('prev navigates back', () => {
    render(
      <ResultsCard
        {...defaultProps}
        results={makeResults({ fields: ['employer', 'count'], rows: manyRows })}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /next/i }));
    fireEvent.click(screen.getByRole('button', { name: /prev/i }));
    expect(screen.getByText(/page 1 \/ 2/)).toBeInTheDocument();
  });

  it('changing page size shows more rows', () => {
    render(
      <ResultsCard
        {...defaultProps}
        results={makeResults({ fields: ['employer', 'count'], rows: manyRows })}
      />,
    );
    const [pageSizeSelect] = screen.getAllByRole('combobox');
    fireEvent.change(pageSizeSelect, { target: { value: '25' } });
    // All 15 rows on one page
    expect(screen.getByText('Employer14')).toBeInTheDocument();
    expect(screen.getByText(/page 1 \/ 1/)).toBeInTheDocument();
  });

  it('calls onFetchMore when fetch limit select changes', () => {
    const onFetchMore = vi.fn();
    render(
      <ResultsCard
        fetchLimit={500}
        onFetchMore={onFetchMore}
        results={makeResults({ fields: ['employer'], rows: [{ employer: 'Test' }] })}
      />,
    );
    const selects = screen.getAllByRole('combobox');
    // second combobox is the fetch limit
    fireEvent.change(selects[1], { target: { value: '1000' } });
    expect(onFetchMore).toHaveBeenCalledWith(1000);
  });

  it('resets to page 0 when rows change', () => {
    const { rerender } = render(
      <ResultsCard
        {...defaultProps}
        results={makeResults({ fields: ['employer', 'count'], rows: manyRows })}
      />,
    );
    // go to page 2
    fireEvent.click(screen.getByRole('button', { name: /next/i }));
    expect(screen.getByText(/page 2/)).toBeInTheDocument();
    // re-render with new rows
    rerender(
      <ResultsCard
        {...defaultProps}
        results={makeResults({ fields: ['employer', 'count'], rows: manyRows.slice(0, 5) })}
      />,
    );
    expect(screen.getByText(/page 1 \/ 1/)).toBeInTheDocument();
  });
});
