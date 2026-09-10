import { type ArticlePage, type ListLowStockArticlesQuery } from '../article.contracts';
import { ArticleService } from '../article.service';

export class ListLowStockArticlesUseCase {
  constructor(private readonly articles: ArticleService) {}
  execute(query: ListLowStockArticlesQuery): Promise<ArticlePage> {
    return this.articles.listLowStock(query);
  }
}
