import { DomainError } from './domain.error';

export class DuplicateParkingLocationError extends DomainError {
  readonly statusCode = 409;

  constructor() {
    super(
      'Duplicate parking location: parking entries must be at least 2m apart',
    );
  }
}
