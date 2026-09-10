import { type MovementResult, type RegisterExitCommand } from '../movement.contracts';
import { ArticleService } from '../../articles/article.service';

export class RegisterExitUseCase {
  constructor(private readonly articles: ArticleService) {}

  execute(command: RegisterExitCommand): Promise<MovementResult> {
    return this.articles.registerExit(command);
  }
}
