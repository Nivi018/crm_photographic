import { type CategoryResult, type CategoryStateCommand } from '../category.contracts';
import { CategoryService } from '../category.service';

export class DeactivateCategoryUseCase {
  constructor(private readonly categories: CategoryService) {}

  execute(command: CategoryStateCommand): Promise<CategoryResult> {
    return this.categories.deactivate(command);
  }
}
