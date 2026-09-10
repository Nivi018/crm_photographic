import {
  type MovementResult,
  type RegisterFinalStockAdjustmentCommand,
} from '../movement.contracts';
import { ArticleService } from '../../articles/article.service';

export class RegisterFinalStockAdjustmentUseCase {
  constructor(private readonly articles: ArticleService) {}

  execute(command: RegisterFinalStockAdjustmentCommand): Promise<MovementResult> {
    return this.articles.registerFinalStockAdjustment(command);
  }
}
