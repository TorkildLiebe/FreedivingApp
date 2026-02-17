import { DomainError } from './domain.error';

export class TooCloseToExistingSpotError extends DomainError {
  readonly statusCode = 409;

  constructor() {
    super('A dive spot already exists within 1000m of this location');
  }
}
