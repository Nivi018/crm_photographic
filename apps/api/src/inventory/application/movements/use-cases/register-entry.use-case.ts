import { type MovementResult, type RegisterEntryCommand } from '../movement.contracts';
import { ArticleService } from '../../articles/article.service';

export class RegisterEntryUseCase {
  constructor(private readonly articles: ArticleService) {}

  execute(command: RegisterEntryCommand): Promise<MovementResult> {
    return this.articles.registerEntry(command);
  }
}
