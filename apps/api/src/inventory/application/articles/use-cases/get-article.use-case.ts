import { type ArticleResult, type GetArticleQuery } from '../article.contracts';
import { ArticleService } from '../article.service';

export class GetArticleUseCase {
  constructor(private readonly articles: ArticleService) {}
  execute(query: GetArticleQuery): Promise<ArticleResult | null> {
    return this.articles.findById(query.id);
  }
}
