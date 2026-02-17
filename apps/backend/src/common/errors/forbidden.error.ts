import { DomainError } from './domain.error';

export class ForbiddenError extends DomainError {
  readonly statusCode = 403;

  constructor(reason: string) {
    super(`Forbidden: ${reason}`);
  }
}
