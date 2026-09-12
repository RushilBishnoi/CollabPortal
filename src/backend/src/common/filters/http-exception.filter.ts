import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ApiErrorResponse, ApiErrorDetail } from '../interfaces/api-response.interface';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let errorCode = 'INTERNAL_SERVER_ERROR';
    let errorMessage = 'An unexpected internal server error occurred';
    let errorDetails: ApiErrorDetail[] | undefined = undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();

      if (typeof res === 'string') {
        errorMessage = res;
        errorCode = this.getErrorCodeFromStatus(status);
      } else if (typeof res === 'object' && res !== null) {
        const responseObj = res as Record<string, unknown>;
        errorMessage = (responseObj['message'] as string) || exception.message;
        errorCode = (responseObj['error'] as string) || this.getErrorCodeFromStatus(status);

        // Handle class-validator error arrays
        if (Array.isArray(responseObj['message'])) {
          errorMessage = 'Validation failed';
          errorCode = 'VALIDATION_ERROR';
          errorDetails = responseObj['message'].map((msg: unknown) => {
            if (typeof msg === 'string') {
              return { message: msg };
            }
            return msg as ApiErrorDetail;
          });
        }
      }
    } else if (exception instanceof Error) {
      // Server-side logging retains full diagnostics
      this.logger.error(`Unhandled Exception: ${exception.message}`, exception.stack);

      // Security hardening: Never leak database schema, raw SQL, or stack paths to the client
      const lowerMessage = exception.message.toLowerCase();
      const isSensitiveLeak =
        lowerMessage.includes('prisma') ||
        lowerMessage.includes('select') ||
        lowerMessage.includes('table') ||
        lowerMessage.includes('column') ||
        lowerMessage.includes('syntax error') ||
        lowerMessage.includes('database') ||
        lowerMessage.includes('connection');

      if (isSensitiveLeak) {
        errorMessage = 'An internal database error occurred. Request could not be processed.';
        errorCode = 'DATABASE_ERROR';
      } else {
        errorMessage = 'An unexpected internal server error occurred';
      }
    }

    const errorResponse: ApiErrorResponse = {
      success: false,
      error: {
        code: errorCode,
        message: errorMessage,
        ...(errorDetails ? { details: errorDetails } : {}),
      },
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    response.status(status).json(errorResponse);
  }

  private getErrorCodeFromStatus(status: number): string {
    switch (status) {
      case HttpStatus.BAD_REQUEST:
        return 'BAD_REQUEST';
      case HttpStatus.UNAUTHORIZED:
        return 'UNAUTHORIZED';
      case HttpStatus.FORBIDDEN:
        return 'FORBIDDEN';
      case HttpStatus.NOT_FOUND:
        return 'RESOURCE_NOT_FOUND';
      case HttpStatus.CONFLICT:
        return 'CONFLICT';
      case HttpStatus.UNPROCESSABLE_ENTITY:
        return 'UNPROCESSABLE_ENTITY';
      case HttpStatus.TOO_MANY_REQUESTS:
        return 'RATE_LIMIT_EXCEEDED';
      default:
        return 'INTERNAL_SERVER_ERROR';
    }
  }
}
