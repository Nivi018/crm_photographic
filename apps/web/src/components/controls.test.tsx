import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { DataState, DataTable, Field, Pagination } from './controls';

describe('reusable controls', () => {
  it('renders accessible form, table, state, and pagination controls', () => {
    const onPageChange = vi.fn();
    render(
      <>
        <Field error="Obligatorio" label="Nombre">
          <input />
        </Field>
        <DataState title="Sin resultados">Ajusta los filtros.</DataState>
        <DataTable headers={['Nombre']}>
          <tr>
            <td>Tripode</td>
          </tr>
        </DataTable>
        <Pagination onPageChange={onPageChange} page={2} totalPages={3} />
      </>,
    );
    expect(screen.getByLabelText('Nombre')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('Obligatorio');
    expect(screen.getByRole('columnheader', { name: 'Nombre' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Siguiente' }));
    expect(onPageChange).toHaveBeenCalledWith(3);
  });
});
