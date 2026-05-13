import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
} from '@nestjs/common';
import { Response } from 'express';

const HTTP_ERROR_NAMES: Record<number, string> = {
  400: 'BadRequest',
  401: 'Unauthorized',
  403: 'Forbidden',
  404: 'NotFound',
  409: 'Conflict',
  422: 'UnprocessableEntity',
  500: 'InternalServerError',
};

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    let mensaje: string;
    if (typeof exceptionResponse === 'string') {
      mensaje = exceptionResponse;
    } else {
      const resp = exceptionResponse as Record<string, unknown>;
      if (Array.isArray(resp['message'])) {
        mensaje = (resp['message'] as string[]).join('; ');
      } else {
        mensaje = (resp['message'] as string) ?? exception.message;
      }
    }

    response.status(status).json({
      statusCode: status,
      mensaje,
      error: HTTP_ERROR_NAMES[status] ?? 'Error',
    });
  }
}
