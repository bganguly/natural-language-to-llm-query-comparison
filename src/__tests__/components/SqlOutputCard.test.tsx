import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import SqlOutputCard from '../../components/SqlOutputCard.tsx';

const baseProps = {
  statusClass: 'b-ok',
  statusText: 'SQL ready',
  sql: 'SELECT * FROM h1b',
  isPlaceholder: false,
  explanation: '',
  onSqlChange: vi.fn(),
  onCopy: vi.fn(),
  onRunEdited: vi.fn(),
  canShowActions: true,
};

describe('SqlOutputCard', () => {
  it('renders status badge with correct text', () => {
    render(<SqlOutputCard {...baseProps} />);
    expect(screen.getByText('SQL ready')).toBeInTheDocument();
  });

  it('applies status class to badge', () => {
    render(<SqlOutputCard {...baseProps} statusClass="b-err" statusText="error" />);
    const badge = screen.getByText('error');
    expect(badge.className).toContain('b-err');
  });

  it('shows action buttons when canShowActions=true', () => {
    render(<SqlOutputCard {...baseProps} canShowActions={true} />);
    expect(screen.getByRole('button', { name: /run edited sql/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /copy sql/i })).toBeInTheDocument();
  });

  it('hides action buttons when canShowActions=false', () => {
    render(<SqlOutputCard {...baseProps} canShowActions={false} />);
    expect(screen.queryByRole('button', { name: /run edited sql/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /copy sql/i })).not.toBeInTheDocument();
  });

  it('calls onRunEdited when run button clicked', () => {
    const onRunEdited = vi.fn();
    render(<SqlOutputCard {...baseProps} onRunEdited={onRunEdited} />);
    fireEvent.click(screen.getByRole('button', { name: /run edited sql/i }));
    expect(onRunEdited).toHaveBeenCalledTimes(1);
  });

  it('calls onCopy when copy button clicked', () => {
    const onCopy = vi.fn();
    render(<SqlOutputCard {...baseProps} onCopy={onCopy} />);
    fireEvent.click(screen.getByRole('button', { name: /copy sql/i }));
    expect(onCopy).toHaveBeenCalledTimes(1);
  });

  it('renders sql in textarea', () => {
    render(<SqlOutputCard {...baseProps} sql="SELECT 42" />);
    expect(screen.getByRole('textbox')).toHaveValue('SELECT 42');
  });

  it('calls onSqlChange when textarea is edited', () => {
    const onSqlChange = vi.fn();
    render(<SqlOutputCard {...baseProps} onSqlChange={onSqlChange} />);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'SELECT 99' } });
    expect(onSqlChange).toHaveBeenCalledWith('SELECT 99');
  });

  it('applies ph class when isPlaceholder=true', () => {
    render(<SqlOutputCard {...baseProps} isPlaceholder={true} />);
    expect(screen.getByRole('textbox').className).toContain('ph');
  });

  it('shows explanation when provided', () => {
    render(<SqlOutputCard {...baseProps} explanation="Groups by employer" />);
    expect(screen.getByText('Groups by employer')).toBeInTheDocument();
    expect(screen.getByText('Why this query')).toBeInTheDocument();
  });

  it('hides explanation section when empty', () => {
    render(<SqlOutputCard {...baseProps} explanation="" />);
    expect(screen.queryByText('Why this query')).not.toBeInTheDocument();
  });
});
