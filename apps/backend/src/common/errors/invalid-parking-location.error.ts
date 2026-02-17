import { DomainError } from './domain.error';

export class InvalidParkingLocationError extends DomainError {
  readonly statusCode = 400;

  constructor(reason: string) {
    super(`Invalid parking location: ${reason}`);
  }
}
