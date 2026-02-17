import { ArgumentsHost } from '@nestjs/common';
import { DomainExceptionFilter } from './domain-exception.filter';
import { InvalidBBoxError } from '../errors/invalid-bbox.error';
import { SpotNotFoundOrDeletedError } from '../errors/spot-not-found.error';
import { TooCloseToExistingSpotError } from '../errors/too-close-to-existing-spot.error';
import { InvalidParkingLocationError } from '../errors/invalid-parking-location.error';
import { DuplicateParkingLocationError } from '../errors/duplicate-parking-location.error';
import { ForbiddenError } from '../errors/forbidden.error';

describe('DomainExceptionFilter', () => {
  let filter: DomainExceptionFilter;
  let mockReply: { status: jest.Mock; send: jest.Mock };
  let mockHost: ArgumentsHost;

  beforeEach(() => {
    filter = new DomainExceptionFilter();
    mockReply = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
    };
    mockHost = {
      switchToHttp: () => ({
        getRequest: () => ({}),
        getResponse: () => mockReply,
      }),
    } as unknown as ArgumentsHost;
  });

  it('should return 400 for InvalidBBoxError', () => {
    const error = new InvalidBBoxError('test reason');

    filter.catch(error, mockHost);

    expect(mockReply.status).toHaveBeenCalledWith(400);
    expect(mockReply.send).toHaveBeenCalledWith({
      statusCode: 400,
      error: 'InvalidBBoxError',
      message: 'Invalid bounding box: test reason',
    });
  });

  it('should return 404 for SpotNotFoundOrDeletedError', () => {
    const error = new SpotNotFoundOrDeletedError('uuid-1');

    filter.catch(error, mockHost);

    expect(mockReply.status).toHaveBeenCalledWith(404);
    expect(mockReply.send).toHaveBeenCalledWith({
      statusCode: 404,
      error: 'SpotNotFoundOrDeletedError',
      message: 'Spot not found or deleted: uuid-1',
    });
  });

  it('should return 409 for TooCloseToExistingSpotError', () => {
    const error = new TooCloseToExistingSpotError();

    filter.catch(error, mockHost);

    expect(mockReply.status).toHaveBeenCalledWith(409);
    expect(mockReply.send).toHaveBeenCalledWith({
      statusCode: 409,
      error: 'TooCloseToExistingSpotError',
      message: 'A dive spot already exists within 1000m of this location',
    });
  });

  it('should return 400 for InvalidParkingLocationError', () => {
    const error = new InvalidParkingLocationError('too far');

    filter.catch(error, mockHost);

    expect(mockReply.status).toHaveBeenCalledWith(400);
    expect(mockReply.send).toHaveBeenCalledWith({
      statusCode: 400,
      error: 'InvalidParkingLocationError',
      message: 'Invalid parking location: too far',
    });
  });

  it('should return 409 for DuplicateParkingLocationError', () => {
    const error = new DuplicateParkingLocationError();

    filter.catch(error, mockHost);

    expect(mockReply.status).toHaveBeenCalledWith(409);
    expect(mockReply.send).toHaveBeenCalledWith({
      statusCode: 409,
      error: 'DuplicateParkingLocationError',
      message:
        'Duplicate parking location: parking entries must be at least 2m apart',
    });
  });

  it('should return 403 for ForbiddenError', () => {
    const error = new ForbiddenError('not owner');

    filter.catch(error, mockHost);

    expect(mockReply.status).toHaveBeenCalledWith(403);
    expect(mockReply.send).toHaveBeenCalledWith({
      statusCode: 403,
      error: 'ForbiddenError',
      message: 'Forbidden: not owner',
    });
  });
});
