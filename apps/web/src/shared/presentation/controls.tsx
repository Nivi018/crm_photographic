import { cloneElement, useId, type ReactElement, type ReactNode } from 'react';

import './controls.css';

export function Field({
  error,
  label,
  children,
}: {
  children: ReactElement<{ 'aria-describedby'?: string; id?: string }>;
  error?: string | undefined;
  label: string;
}) {
  const id = useId();
  const errorId = `${id}-error`;

  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      {cloneElement(children, {
        ...(error ? { 'aria-describedby': errorId } : {}),
        id,
      })}
      {error ? (
        <small id={errorId} role="alert">
          {error}
        </small>
      ) : null}
    </div>
  );
}

export function DataState({ children, title }: { children: ReactNode; title: string }) {
  return (
    <section aria-live="polite" className="data-state">
      <h2>{title}</h2>
      <p>{children}</p>
    </section>
  );
}

export function Pagination({
  page,
  totalPages,
  onPageChange,
}: {
  onPageChange: (page: number) => void;
  page: number;
  totalPages: number;
}) {
  return (
    <nav aria-label="Paginacion" className="pagination">
      <button disabled={page <= 1} onClick={() => onPageChange(page - 1)} type="button">
        Anterior
      </button>
      <span>
        Pagina {page} de {totalPages}
      </span>
      <button disabled={page >= totalPages} onClick={() => onPageChange(page + 1)} type="button">
        Siguiente
      </button>
    </nav>
  );
}

export function DataTable({ children, headers }: { children: ReactNode; headers: string[] }) {
  return (
    <div className="data-table">
      <table>
        <thead>
          <tr>
            {headers.map((header) => (
              <th key={header} scope="col">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}
