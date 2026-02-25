import { DomainError } from './domain.error';

export class InvalidPhotoUrlError extends DomainError {
  readonly statusCode = 400;

  constructor() {
    super('Photo URL must be a valid HTTPS URL');
  }
}
