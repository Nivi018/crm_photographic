import { type CategoryResult, type CreateCategoryCommand } from '../category.contracts';
import { CategoryService } from '../category.service';

export class CreateCategoryUseCase {
  constructor(private readonly categories: CategoryService) {}

  execute(command: CreateCategoryCommand): Promise<CategoryResult> {
    return this.categories.create(command.name);
  }
}
