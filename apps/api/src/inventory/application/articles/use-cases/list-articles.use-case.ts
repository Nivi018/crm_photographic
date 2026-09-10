import { type ArticlePage, type ListArticlesQuery } from '../article.contracts';
import { ArticleService } from '../article.service';

export class ListArticlesUseCase {
  constructor(private readonly articles: ArticleService) {}
  execute(query: ListArticlesQuery): Promise<ArticlePage> {
    return this.articles.list(query);
  }
}
