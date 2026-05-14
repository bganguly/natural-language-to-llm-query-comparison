import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ApiConfigCard from '../../components/ApiConfigCard.tsx';
import { MODELS } from '../../constants.ts';

const defaultProps = {
  anthropicKey: '',
  onAnthropicKeyChange: vi.fn(),
  openAiKey: '',
  onOpenAiKeyChange: vi.fn(),
  model: MODELS.anthropic[0],
  onModelChange: vi.fn(),
  dialect: 'DuckDB',
  onDialectChange: vi.fn(),
  providerName: 'Anthropic',
};

describe('ApiConfigCard', () => {
  it('shows active provider name', () => {
    render(<ApiConfigCard {...defaultProps} />);
    expect(screen.getByText(/Active provider: Anthropic/)).toBeInTheDocument();
  });

  it('anthropic key input is password type by default', () => {
    render(<ApiConfigCard {...defaultProps} />);
    const inputs = screen.getAllByDisplayValue('');
    // First password input is Anthropic key
    expect(inputs[0]).toHaveAttribute('type', 'password');
  });

  it('toggles anthropic key to text type when show is clicked', () => {
    render(<ApiConfigCard {...defaultProps} />);
    const [showAnthropicBtn] = screen.getAllByRole('button', { name: /show/i });
    fireEvent.click(showAnthropicBtn);
    expect(screen.getAllByRole('textbox').some((el) => el === document.querySelector('input[type="text"]'))).toBe(true);
  });

  it('hides key again when hide is clicked', () => {
    render(<ApiConfigCard {...defaultProps} />);
    const [showBtn] = screen.getAllByRole('button', { name: /show/i });
    fireEvent.click(showBtn);
    const [hideBtn] = screen.getAllByRole('button', { name: /hide/i });
    fireEvent.click(hideBtn);
    // Should be back to password
    const inputs = document.querySelectorAll('input[type="password"]');
    expect(inputs.length).toBeGreaterThanOrEqual(1);
  });

  it('calls onAnthropicKeyChange when anthropic input changes', () => {
    const onAnthropicKeyChange = vi.fn();
    render(<ApiConfigCard {...defaultProps} onAnthropicKeyChange={onAnthropicKeyChange} />);
    // Toggle to visible first to get textbox
    fireEvent.click(screen.getAllByRole('button', { name: /show/i })[0]);
    const inputs = screen.getAllByRole('textbox');
    fireEvent.change(inputs[0], { target: { value: 'sk-ant-xyz' } });
    expect(onAnthropicKeyChange).toHaveBeenCalledWith('sk-ant-xyz');
  });

  it('renders all anthropic and openai models as options', () => {
    render(<ApiConfigCard {...defaultProps} />);
    MODELS.anthropic.forEach((m) => {
      expect(screen.getByRole('option', { name: m })).toBeInTheDocument();
    });
    MODELS.openai.forEach((m) => {
      expect(screen.getByRole('option', { name: m })).toBeInTheDocument();
    });
  });

  it('calls onModelChange when model is changed', () => {
    const onModelChange = vi.fn();
    render(<ApiConfigCard {...defaultProps} onModelChange={onModelChange} />);
    fireEvent.change(screen.getAllByRole('combobox')[0], { target: { value: MODELS.openai[0] } });
    expect(onModelChange).toHaveBeenCalledWith(MODELS.openai[0]);
  });

  it('calls onDialectChange when dialect is changed', () => {
    const onDialectChange = vi.fn();
    render(<ApiConfigCard {...defaultProps} onDialectChange={onDialectChange} />);
    fireEvent.change(screen.getAllByRole('combobox')[1], { target: { value: 'BigQuery' } });
    expect(onDialectChange).toHaveBeenCalledWith('BigQuery');
  });

  it('openai key input is password type by default', () => {
    render(<ApiConfigCard {...defaultProps} />);
    const passwords = document.querySelectorAll('input[type="password"]');
    expect(passwords.length).toBeGreaterThanOrEqual(2);
  });

  it('toggles openai key to text type when second show is clicked', () => {
    render(<ApiConfigCard {...defaultProps} />);
    const [, showOpenAiBtn] = screen.getAllByRole('button', { name: /show/i });
    fireEvent.click(showOpenAiBtn);
    const textInputs = document.querySelectorAll('input[type="text"]');
    expect(textInputs.length).toBeGreaterThanOrEqual(1);
  });

  it('hides openai key again when hide is clicked', () => {
    render(<ApiConfigCard {...defaultProps} />);
    const [, showOpenAiBtn] = screen.getAllByRole('button', { name: /show/i });
    fireEvent.click(showOpenAiBtn);
    const [hideBtn] = screen.getAllByRole('button', { name: /hide/i });
    fireEvent.click(hideBtn);
    const passwords = document.querySelectorAll('input[type="password"]');
    expect(passwords.length).toBeGreaterThanOrEqual(2);
  });
});
