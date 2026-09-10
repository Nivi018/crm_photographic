import { type RequiredTextField } from './text.properties';

export class RequiredTextError extends Error {
  constructor(field: RequiredTextField) {
    super(`${field} is required`);
    this.name = 'RequiredTextError';
  }
}
