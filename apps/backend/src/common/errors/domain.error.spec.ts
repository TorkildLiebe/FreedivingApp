import { DomainError } from './domain.error';
import { InvalidBBoxError } from './invalid-bbox.error';
import { SpotNotFoundOrDeletedError } from './spot-not-found.error';
import { TooCloseToExistingSpotError } from './too-close-to-existing-spot.error';
import { InvalidParkingLocationError } from './invalid-parking-location.error';
import { DuplicateParkingLocationError } from './duplicate-parking-location.error';
import { ForbiddenError } from './forbidden.error';

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

  describe('TooCloseToExistingSpotError', () => {
    it('should have statusCode 409', () => {
      const error = new TooCloseToExistingSpotError();
      expect(error.statusCode).toBe(409);
    });

    it('should have conflict message', () => {
      const error = new TooCloseToExistingSpotError();
      expect(error.message).toBe(
        'A dive spot already exists within 1000m of this location',
      );
    });
  });

  describe('InvalidParkingLocationError', () => {
    it('should have statusCode 400', () => {
      const error = new InvalidParkingLocationError('too far');
      expect(error.statusCode).toBe(400);
    });

    it('should include reason in message', () => {
      const error = new InvalidParkingLocationError('too far from center');
      expect(error.message).toBe(
        'Invalid parking location: too far from center',
      );
    });
  });

  describe('DuplicateParkingLocationError', () => {
    it('should have statusCode 409', () => {
      const error = new DuplicateParkingLocationError();
      expect(error.statusCode).toBe(409);
    });

    it('should have duplicate message', () => {
      const error = new DuplicateParkingLocationError();
      expect(error.message).toBe(
        'Duplicate parking location: parking entries must be at least 2m apart',
      );
    });
  });

  describe('ForbiddenError', () => {
    it('should have statusCode 403', () => {
      const error = new ForbiddenError('not owner');
      expect(error.statusCode).toBe(403);
    });

    it('should include reason in message', () => {
      const error = new ForbiddenError('not owner or moderator/admin');
      expect(error.message).toBe(
        'Forbidden: not owner or moderator/admin',
      );
    });
  });
});
