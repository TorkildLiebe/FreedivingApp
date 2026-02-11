import { DomainError } from './domain.error';
import { InvalidBBoxError } from './invalid-bbox.error';
import { SpotNotFoundOrDeletedError } from './spot-not-found.error';

describe('Domain Errors', () => {
  describe('InvalidBBoxError', () => {
    it('should have statusCode 400', () => {
      const error = new InvalidBBoxError('test reason');
      expect(error.statusCode).toBe(400);
    });

    it('should include reason in message', () => {
      const error = new InvalidBBoxError('test reason');
      expect(error.message).toBe('Invalid bounding box: test reason');
    });

    it('should be an instance of DomainError', () => {
      const error = new InvalidBBoxError('test');
      expect(error).toBeInstanceOf(DomainError);
    });

    it('should have correct name', () => {
      const error = new InvalidBBoxError('test');
      expect(error.name).toBe('InvalidBBoxError');
    });
  });

  describe('SpotNotFoundOrDeletedError', () => {
    it('should have statusCode 404', () => {
      const error = new SpotNotFoundOrDeletedError('uuid-1');
      expect(error.statusCode).toBe(404);
    });

    it('should include spotId in message', () => {
      const error = new SpotNotFoundOrDeletedError('uuid-1');
      expect(error.message).toBe('Spot not found or deleted: uuid-1');
    });

    it('should be an instance of DomainError', () => {
      const error = new SpotNotFoundOrDeletedError('uuid-1');
      expect(error).toBeInstanceOf(DomainError);
    });

    it('should have correct name', () => {
      const error = new SpotNotFoundOrDeletedError('uuid-1');
      expect(error.name).toBe('SpotNotFoundOrDeletedError');
    });
  });
});
