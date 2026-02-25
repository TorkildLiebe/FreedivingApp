import { DomainError } from './domain.error';

export class DuplicatePhotoUrlError extends DomainError {
  readonly statusCode = 409;

  constructor() {
    super('Photo URL already attached to this spot');
  }
}
