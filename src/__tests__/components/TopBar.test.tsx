import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import TopBar from '../../components/TopBar.tsx';

describe('TopBar', () => {
  it('shows "DuckDB ready" when ready', () => {
    render(<TopBar duckReady="ready" />);
    expect(screen.getByText('DuckDB ready')).toBeInTheDocument();
    expect(screen.getByText('DuckDB ready').className).toContain('ready');
  });

  it('shows loading text when loading', () => {
    render(<TopBar duckReady="loading" />);
    expect(screen.getByText('loading DuckDB...')).toBeInTheDocument();
    expect(screen.getByText('loading DuckDB...').className).toContain('loading');
  });

  it('shows error text when failed', () => {
    render(<TopBar duckReady="error" />);
    expect(screen.getByText('DuckDB failed')).toBeInTheDocument();
  });

  it('renders the page title', () => {
    render(<TopBar duckReady="ready" />);
    expect(screen.getByText('NL to SQL')).toBeInTheDocument();
  });

  it('renders the Open Original HTML link', () => {
    render(<TopBar duckReady="ready" />);
    const link = screen.getByRole('link', { name: /open original html/i });
    expect(link).toHaveAttribute('href', '/legacy/nl_to_sql.html');
    expect(link).toHaveAttribute('target', '_blank');
  });
});
