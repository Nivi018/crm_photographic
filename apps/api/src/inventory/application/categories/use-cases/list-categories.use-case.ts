import { type CategoryListQuery, type CategoryPage } from '../category.contracts';
import { CategoryService } from '../category.service';

export class ListCategoriesUseCase {
  constructor(private readonly categories: CategoryService) {}

  execute(query: CategoryListQuery): Promise<CategoryPage> {
    return this.categories.list(query);
  }
}
