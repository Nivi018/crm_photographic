import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Pagination } from './controls';

describe('Pagination keyboard access', () => {
  it('activates the focused next-page control with Enter', () => {
    const onPageChange = vi.fn();
    render(<Pagination onPageChange={onPageChange} page={1} totalPages={2} />);
    const next = screen.getByRole('button', { name: /siguiente/i });
    next.focus();
    fireEvent.keyDown(next, { key: 'Enter' });
    fireEvent.click(next);
    expect(onPageChange).toHaveBeenCalledWith(2);
  });
});
