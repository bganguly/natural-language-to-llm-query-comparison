import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import SchemaColumnsCard from '../../components/SchemaColumnsCard.tsx';
import { DEFAULT_COLS } from '../../constants.ts';

const baseProps = {
  cols: DEFAULT_COLS,
  onSniff: vi.fn(),
  onAddCol: vi.fn(),
  onRemoveCol: vi.fn(),
};

describe('SchemaColumnsCard', () => {
  it('renders all columns as tags', () => {
    render(<SchemaColumnsCard {...baseProps} />);
    DEFAULT_COLS.forEach((c) => {
      expect(screen.getByText(c.name)).toBeInTheDocument();
    });
  });

  it('calls onSniff when auto-detect button clicked', () => {
    const onSniff = vi.fn();
    render(<SchemaColumnsCard {...baseProps} onSniff={onSniff} />);
    fireEvent.click(screen.getByRole('button', { name: /auto-detect/i }));
    expect(onSniff).toHaveBeenCalledTimes(1);
  });

  it('calls onRemoveCol with correct index when × is clicked', () => {
    const onRemoveCol = vi.fn();
    render(<SchemaColumnsCard {...baseProps} onRemoveCol={onRemoveCol} />);
    const removeButtons = screen.getAllByRole('button', { name: '×' });
    fireEvent.click(removeButtons[0]);
    expect(onRemoveCol).toHaveBeenCalledWith(0);
  });

  it('calls onAddCol when a valid new column is added', () => {
    const onAddCol = vi.fn();
    render(<SchemaColumnsCard {...baseProps} cols={[]} onAddCol={onAddCol} />);
    fireEvent.change(screen.getByPlaceholderText('column name'), { target: { value: 'new_col' } });
    fireEvent.click(screen.getByRole('button', { name: /^add$/i }));
    expect(onAddCol).toHaveBeenCalledWith('new_col', 'TEXT');
  });

  it('replaces spaces with underscores in column names', () => {
    const onAddCol = vi.fn();
    render(<SchemaColumnsCard {...baseProps} cols={[]} onAddCol={onAddCol} />);
    fireEvent.change(screen.getByPlaceholderText('column name'), { target: { value: 'my col' } });
    fireEvent.click(screen.getByRole('button', { name: /^add$/i }));
    expect(onAddCol).toHaveBeenCalledWith('my_col', 'TEXT');
  });

  it('does NOT call onAddCol when name is empty', () => {
    const onAddCol = vi.fn();
    render(<SchemaColumnsCard {...baseProps} cols={[]} onAddCol={onAddCol} />);
    fireEvent.click(screen.getByRole('button', { name: /^add$/i }));
    expect(onAddCol).not.toHaveBeenCalled();
  });

  it('does NOT call onAddCol when column name already exists', () => {
    const onAddCol = vi.fn();
    render(<SchemaColumnsCard {...baseProps} onAddCol={onAddCol} />);
    // 'employer' already exists in DEFAULT_COLS
    fireEvent.change(screen.getByPlaceholderText('column name'), { target: { value: 'employer' } });
    fireEvent.click(screen.getByRole('button', { name: /^add$/i }));
    expect(onAddCol).not.toHaveBeenCalled();
  });

  it('clears input after successful add', () => {
    const input = () => screen.getByPlaceholderText('column name') as HTMLInputElement;
    render(<SchemaColumnsCard {...baseProps} cols={[]} onAddCol={vi.fn()} />);
    fireEvent.change(input(), { target: { value: 'brand_new' } });
    fireEvent.click(screen.getByRole('button', { name: /^add$/i }));
    expect(input().value).toBe('');
  });

  it('calls onAddCol with selected type', () => {
    const onAddCol = vi.fn();
    render(<SchemaColumnsCard {...baseProps} cols={[]} onAddCol={onAddCol} />);
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'INTEGER' } });
    fireEvent.change(screen.getByPlaceholderText('column name'), { target: { value: 'age' } });
    fireEvent.click(screen.getByRole('button', { name: /^add$/i }));
    expect(onAddCol).toHaveBeenCalledWith('age', 'INTEGER');
  });

  it('adds column on Enter key in name input', () => {
    const onAddCol = vi.fn();
    render(<SchemaColumnsCard {...baseProps} cols={[]} onAddCol={onAddCol} />);
    const nameInput = screen.getByPlaceholderText('column name');
    fireEvent.change(nameInput, { target: { value: 'enter_col' } });
    fireEvent.keyDown(nameInput, { key: 'Enter' });
    expect(onAddCol).toHaveBeenCalledWith('enter_col', 'TEXT');
  });
});
