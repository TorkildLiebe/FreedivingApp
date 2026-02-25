import { DomainError } from './domain.error';

export class InvalidDiveLogError extends DomainError {
  readonly statusCode = 422;

  constructor(message: string) {
    super(message);
  }
}
