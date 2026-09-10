import { type ListMovementsQuery, type MovementPage } from '../movement.contracts';
import { ArticleService } from '../../articles/article.service';

export class ListMovementsUseCase {
  constructor(private readonly articles: ArticleService) {}

  execute(query: ListMovementsQuery): Promise<MovementPage> {
    return this.articles.listMovements(query);
  }
}
