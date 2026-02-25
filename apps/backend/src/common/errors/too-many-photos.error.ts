import { DomainError } from './domain.error';

export class TooManyPhotosError extends DomainError {
  readonly statusCode = 400;

  constructor() {
    super('Maximum 5 photos per spot');
  }
}
