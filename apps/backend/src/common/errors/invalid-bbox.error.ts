import { DomainError } from './domain.error';

export class InvalidBBoxError extends DomainError {
  readonly statusCode = 400;

  constructor(reason: string) {
    super(`Invalid bounding box: ${reason}`);
  }
}
