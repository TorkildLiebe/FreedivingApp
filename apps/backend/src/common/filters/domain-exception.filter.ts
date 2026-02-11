import { ExceptionFilter, Catch, ArgumentsHost } from '@nestjs/common';
import { DomainError } from '../errors';

@Catch(DomainError)
export class DomainExceptionFilter implements ExceptionFilter {
  catch(exception: DomainError, host: ArgumentsHost) {
    const reply = host.switchToHttp().getResponse<{
      status: (code: number) => { send: (body: unknown) => void };
    }>();

    reply.status(exception.statusCode).send({
      statusCode: exception.statusCode,
      error: exception.name,
      message: exception.message,
    });
  }
}
