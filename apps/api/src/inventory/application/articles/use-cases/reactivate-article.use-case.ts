import { type ArticleResult, type ReactivateArticleCommand } from '../article.contracts';
import { ArticleService } from '../article.service';

export class ReactivateArticleUseCase {
  constructor(private readonly articles: ArticleService) {}
  execute(command: ReactivateArticleCommand): Promise<ArticleResult> {
    return this.articles.reactivate(command);
  }
}
