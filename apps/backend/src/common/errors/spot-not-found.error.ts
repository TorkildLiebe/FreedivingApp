import { DomainError } from './domain.error';

export class SpotNotFoundOrDeletedError extends DomainError {
  readonly statusCode = 404;

  constructor(spotId: string) {
    super(`Spot not found or deleted: ${spotId}`);
  }
}
