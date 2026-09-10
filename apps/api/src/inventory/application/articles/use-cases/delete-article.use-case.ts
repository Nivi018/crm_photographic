import { type ArticleStateCommand } from '../article.contracts';
import { ArticleService } from '../article.service';

export class DeleteArticleUseCase {
  constructor(private readonly articles: ArticleService) {}
  execute(command: ArticleStateCommand): Promise<void> {
    return this.articles.delete(command);
  }
}
