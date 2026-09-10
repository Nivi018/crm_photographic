import { RequiredTextError } from './text.errors';
import { type RequiredTextField } from './text.properties';

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
