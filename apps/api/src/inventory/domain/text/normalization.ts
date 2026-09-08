export type RequiredTextField = 'name' | 'reason';

export class RequiredTextError extends Error {
  constructor(field: RequiredTextField) {
    super(`${field} is required`);
    this.name = 'RequiredTextError';
  }
}

export function trimRequiredText(value: string, field: RequiredTextField): string {
  const trimmed = value.trim();

  if (!trimmed) {
    throw new RequiredTextError(field);
  }

  return trimmed;
}

export function normalizeName(value: string): string {
  return trimRequiredText(value, 'name').normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
}

export function normalizeReason(value: string): string {
  return trimRequiredText(value, 'reason');
}
