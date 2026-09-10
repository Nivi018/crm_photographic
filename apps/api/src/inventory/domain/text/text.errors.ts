import { type RequiredTextField } from './text.properties';
import { InventoryErrorCode } from '@crm-photografy/shared';
import { InventoryError } from '../inventory-error';

export class RequiredTextError extends InventoryError {
  constructor(field: RequiredTextField) {
    super(InventoryErrorCode.Validation, `${field} is required`);
  }
}
