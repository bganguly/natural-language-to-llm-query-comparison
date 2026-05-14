import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import NlQueryBar from '../../components/NlQueryBar.tsx';

describe('NlQueryBar', () => {
  it('renders input with placeholder', () => {
    render(<NlQueryBar value="" onChange={vi.fn()} onTranslate={vi.fn()} />);
    expect(screen.getByPlaceholderText(/e.g. top employers/i)).toBeInTheDocument();
  });

  it('displays the current value', () => {
    render(<NlQueryBar value="top employers" onChange={vi.fn()} onTranslate={vi.fn()} />);
    expect(screen.getByDisplayValue('top employers')).toBeInTheDocument();
  });

  it('calls onChange when user types', () => {
    const onChange = vi.fn();
    render(<NlQueryBar value="" onChange={onChange} onTranslate={vi.fn()} />);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'hello' } });
    expect(onChange).toHaveBeenCalledWith('hello');
  });

  it('calls onTranslate when button is clicked', () => {
    const onTranslate = vi.fn();
    render(<NlQueryBar value="test" onChange={vi.fn()} onTranslate={onTranslate} />);
    fireEvent.click(screen.getByRole('button', { name: /translate/i }));
    expect(onTranslate).toHaveBeenCalledTimes(1);
  });

  it('calls onTranslate on Enter key press', () => {
    const onTranslate = vi.fn();
    render(<NlQueryBar value="test" onChange={vi.fn()} onTranslate={onTranslate} />);
    fireEvent.keyDown(screen.getByRole('textbox'), { key: 'Enter' });
    expect(onTranslate).toHaveBeenCalledTimes(1);
  });

  it('does NOT call onTranslate on other key press', () => {
    const onTranslate = vi.fn();
    render(<NlQueryBar value="test" onChange={vi.fn()} onTranslate={onTranslate} />);
    fireEvent.keyDown(screen.getByRole('textbox'), { key: 'Tab' });
    expect(onTranslate).not.toHaveBeenCalled();
  });
});
