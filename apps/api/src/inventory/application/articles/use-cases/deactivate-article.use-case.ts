import { type ArticleResult, type ArticleStateCommand } from '../article.contracts';
import { ArticleService } from '../article.service';

export class DeactivateArticleUseCase {
  constructor(private readonly articles: ArticleService) {}
  execute(command: ArticleStateCommand): Promise<ArticleResult> {
    return this.articles.deactivate(command);
  }
}
