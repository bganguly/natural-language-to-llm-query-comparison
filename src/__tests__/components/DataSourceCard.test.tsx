import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import DataSourceCard from '../../components/DataSourceCard.tsx';

describe('DataSourceCard', () => {
  it('renders the parquet endpoint input', () => {
    render(
      <DataSourceCard bucket="http://example.com" onBucketChange={vi.fn()} tableName="h1b" onTableNameChange={vi.fn()} />,
    );
    expect(screen.getByDisplayValue('http://example.com')).toBeInTheDocument();
  });

  it('renders the table alias input', () => {
    render(
      <DataSourceCard bucket="" onBucketChange={vi.fn()} tableName="my_table" onTableNameChange={vi.fn()} />,
    );
    expect(screen.getByDisplayValue('my_table')).toBeInTheDocument();
  });

  it('calls onBucketChange when endpoint input changes', () => {
    const onBucketChange = vi.fn();
    render(
      <DataSourceCard bucket="" onBucketChange={onBucketChange} tableName="" onTableNameChange={vi.fn()} />,
    );
    fireEvent.change(screen.getAllByRole('textbox')[0], { target: { value: 'http://new.url' } });
    expect(onBucketChange).toHaveBeenCalledWith('http://new.url');
  });

  it('calls onTableNameChange when alias input changes', () => {
    const onTableNameChange = vi.fn();
    render(
      <DataSourceCard bucket="" onBucketChange={vi.fn()} tableName="" onTableNameChange={onTableNameChange} />,
    );
    fireEvent.change(screen.getAllByRole('textbox')[1], { target: { value: 'new_alias' } });
    expect(onTableNameChange).toHaveBeenCalledWith('new_alias');
  });

  it('calls onTableNameChange with a random alias when refresh is clicked', () => {
    const onTableNameChange = vi.fn();
    render(
      <DataSourceCard bucket="" onBucketChange={vi.fn()} tableName="" onTableNameChange={onTableNameChange} />,
    );
    fireEvent.click(screen.getByRole('button', { name: /refresh/i }));
    expect(onTableNameChange).toHaveBeenCalledTimes(1);
    const called = onTableNameChange.mock.calls[0][0] as string;
    // alias is adj_noun_NN format
    expect(called).toMatch(/^[a-z]+_[a-z]+_\d{2}$/);
  });
});
