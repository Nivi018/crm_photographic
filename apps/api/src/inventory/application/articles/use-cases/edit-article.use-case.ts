import { type ArticleResult, type EditArticleCommand } from '../article.contracts';
import { ArticleService } from '../article.service';

export class EditArticleUseCase {
  constructor(private readonly articles: ArticleService) {}
  execute(command: EditArticleCommand): Promise<ArticleResult> {
    return this.articles.edit(command);
  }
}
