import { type CategoryStateCommand } from '../category.contracts';
import { CategoryService } from '../category.service';

export class DeleteCategoryUseCase {
  constructor(private readonly categories: CategoryService) {}

  execute(command: CategoryStateCommand): Promise<void> {
    return this.categories.delete(command);
  }
}
