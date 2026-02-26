import { DomainError } from './domain.error';

export class DiveLogNotFoundError extends DomainError {
  readonly statusCode = 404;

  constructor(diveLogId: string) {
    super(`Dive log not found: ${diveLogId}`);
  }
}
