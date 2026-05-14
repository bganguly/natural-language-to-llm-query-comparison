import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import SampleQueries from '../../components/SampleQueries.tsx';
import { QUERY_GROUPS } from '../../constants.ts';

describe('SampleQueries', () => {
  it('renders all group labels', () => {
    render(<SampleQueries groups={QUERY_GROUPS} activeQuery="" onPick={vi.fn()} />);
    QUERY_GROUPS.forEach((g) => {
      expect(screen.getByText(g.label)).toBeInTheDocument();
    });
  });

  it('renders all queries as buttons', () => {
    render(<SampleQueries groups={QUERY_GROUPS} activeQuery="" onPick={vi.fn()} />);
    const firstQuery = QUERY_GROUPS[0].queries[0];
    expect(screen.getByRole('button', { name: firstQuery })).toBeInTheDocument();
  });

  it('calls onPick with query text when clicked', () => {
    const onPick = vi.fn();
    render(<SampleQueries groups={QUERY_GROUPS} activeQuery="" onPick={onPick} />);
    const firstQuery = QUERY_GROUPS[0].queries[0];
    fireEvent.click(screen.getByRole('button', { name: firstQuery }));
    expect(onPick).toHaveBeenCalledWith(firstQuery);
  });

  it('marks active query with active class', () => {
    const activeQuery = QUERY_GROUPS[0].queries[0];
    render(<SampleQueries groups={QUERY_GROUPS} activeQuery={activeQuery} onPick={vi.fn()} />);
    expect(screen.getByRole('button', { name: activeQuery }).className).toContain('active');
  });

  it('does not mark non-active queries with active class', () => {
    const activeQuery = QUERY_GROUPS[0].queries[0];
    render(<SampleQueries groups={QUERY_GROUPS} activeQuery={activeQuery} onPick={vi.fn()} />);
    const secondQuery = QUERY_GROUPS[0].queries[1];
    expect(screen.getByRole('button', { name: secondQuery }).className).not.toContain('active');
  });

  it('renders with empty groups without crashing', () => {
    render(<SampleQueries groups={[]} activeQuery="" onPick={vi.fn()} />);
    expect(screen.getByText(/Sample Queries/i)).toBeInTheDocument();
  });
});
