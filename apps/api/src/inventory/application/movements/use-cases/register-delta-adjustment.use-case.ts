import { type MovementResult, type RegisterDeltaAdjustmentCommand } from '../movement.contracts';
import { ArticleService } from '../../articles/article.service';

export class RegisterDeltaAdjustmentUseCase {
  constructor(private readonly articles: ArticleService) {}

  execute(command: RegisterDeltaAdjustmentCommand): Promise<MovementResult> {
    return this.articles.registerDeltaAdjustment(command);
  }
}
