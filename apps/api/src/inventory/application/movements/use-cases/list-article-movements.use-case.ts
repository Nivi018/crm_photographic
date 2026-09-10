import { type ListArticleMovementsQuery, type MovementPage } from '../movement.contracts';
import { ArticleService } from '../../articles/article.service';

export class ListArticleMovementsUseCase {
  constructor(private readonly articles: ArticleService) {}

  execute(query: ListArticleMovementsQuery): Promise<MovementPage> {
    return this.articles.listArticleMovements(query.articleId, query);
  }
}
