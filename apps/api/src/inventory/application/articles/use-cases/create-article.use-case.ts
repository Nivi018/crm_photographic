import { type ArticleResult, type CreateArticleCommand } from '../article.contracts';
import { ArticleService } from '../article.service';

export class CreateArticleUseCase {
  constructor(private readonly articles: ArticleService) {}
  execute(command: CreateArticleCommand): Promise<ArticleResult> {
    return this.articles.create(command);
  }
}
