import { type CategoryResult, type RenameCategoryCommand } from '../category.contracts';
import { CategoryService } from '../category.service';

export class RenameCategoryUseCase {
  constructor(private readonly categories: CategoryService) {}

  execute(command: RenameCategoryCommand): Promise<CategoryResult> {
    return this.categories.rename(command);
  }
}
