import { type ArticleRepository } from './article-repository.port';
import { type CategoryRepository } from './category-repository.port';
import { type MovementRepository } from './movement-repository.port';

export interface InventoryRepositories {
  categories: CategoryRepository;
  articles: ArticleRepository;
  movements: MovementRepository;
}

export interface InventoryUnitOfWork {
  execute<T>(operation: (repositories: InventoryRepositories) => Promise<T>): Promise<T>;
}
