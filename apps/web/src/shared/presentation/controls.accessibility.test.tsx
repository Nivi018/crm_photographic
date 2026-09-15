import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Field } from './controls';

describe('Field accessibility', () => {
  it('associates its label and validation error with the input', () => {
    render(
      <Field error="El nombre es obligatorio." label="Nombre">
        <input />
      </Field>,
    );

    const input = screen.getByLabelText('Nombre');
    expect(input).toHaveAttribute('aria-describedby');
    expect(screen.getByText('El nombre es obligatorio.')).toHaveAttribute('role', 'alert');
  });
});
