import { ArgumentsHost } from '@nestjs/common';
import { DomainExceptionFilter } from './domain-exception.filter';
import { InvalidBBoxError } from '../errors/invalid-bbox.error';
import { SpotNotFoundOrDeletedError } from '../errors/spot-not-found.error';

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
});
