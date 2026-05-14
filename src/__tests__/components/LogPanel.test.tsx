import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import LogPanel from '../../components/LogPanel.tsx';

const sampleLogs = [
  { id: '1', ts: '12:00:00', message: 'DuckDB ready', level: 'ok' },
  { id: '2', ts: '12:00:01', message: 'Query error', level: 'er' },
];

describe('LogPanel', () => {
  it('renders collapsed header by default', () => {
    render(<LogPanel logs={[]} open={false} onToggle={vi.fn()} />);
    expect(screen.getByText(/verbose log/)).toBeInTheDocument();
    expect(screen.getByText('expand')).toBeInTheDocument();
  });

  it('renders expanded header when open=true', () => {
    render(<LogPanel logs={[]} open={true} onToggle={vi.fn()} />);
    expect(screen.getByText('collapse')).toBeInTheDocument();
  });

  it('shows empty placeholder when open with no logs', () => {
    render(<LogPanel logs={[]} open={true} onToggle={vi.fn()} />);
    expect(screen.getByText(/no activity yet/)).toBeInTheDocument();
  });

  it('shows log entries when open', () => {
    render(<LogPanel logs={sampleLogs} open={true} onToggle={vi.fn()} />);
    expect(screen.getByText(/DuckDB ready/)).toBeInTheDocument();
    expect(screen.getByText(/Query error/)).toBeInTheDocument();
  });

  it('does not show log entries when closed', () => {
    render(<LogPanel logs={sampleLogs} open={false} onToggle={vi.fn()} />);
    expect(screen.queryByText(/DuckDB ready/)).not.toBeInTheDocument();
  });

  it('calls onToggle when header is clicked', () => {
    const onToggle = vi.fn();
    render(<LogPanel logs={[]} open={false} onToggle={onToggle} />);
    fireEvent.click(screen.getByText(/verbose log/));
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('applies level class to log entries', () => {
    render(<LogPanel logs={sampleLogs} open={true} onToggle={vi.fn()} />);
    const okEntry = screen.getByText(/DuckDB ready/).closest('.ll');
    expect(okEntry?.className).toContain('ok');
    const errEntry = screen.getByText(/Query error/).closest('.ll');
    expect(errEntry?.className).toContain('er');
  });
});
