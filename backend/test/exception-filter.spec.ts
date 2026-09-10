import { describe, it, expect, vi } from 'vitest';
import { HttpException, HttpStatus, ArgumentsHost } from '@nestjs/common';
import { AllExceptionsFilter } from '../src/common/filters/http-exception.filter';

describe('AllExceptionsFilter', () => {
  it('should format HttpException correctly into standardized error shape', () => {
    const filter = new AllExceptionsFilter();

    const jsonMock = vi.fn();
    const statusMock = vi.fn().mockReturnValue({ json: jsonMock });

    const hostMock = {
      switchToHttp: vi.fn().mockReturnValue({
        getResponse: vi.fn().mockReturnValue({ status: statusMock }),
        getRequest: vi.fn().mockReturnValue({ url: '/api/v1/test' }),
      }),
    } as unknown as ArgumentsHost;

    const exception = new HttpException(
      { message: 'Resource not found', error: 'RESOURCE_NOT_FOUND' },
      HttpStatus.NOT_FOUND,
    );

    filter.catch(exception, hostMock);

    expect(statusMock).toHaveBeenCalledWith(404);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({
          code: 'RESOURCE_NOT_FOUND',
          message: 'Resource not found',
        }),
        path: '/api/v1/test',
      }),
    );
  });

  it('should format validation errors with details array', () => {
    const filter = new AllExceptionsFilter();

    const jsonMock = vi.fn();
    const statusMock = vi.fn().mockReturnValue({ json: jsonMock });

    const hostMock = {
      switchToHttp: vi.fn().mockReturnValue({
        getResponse: vi.fn().mockReturnValue({ status: statusMock }),
        getRequest: vi.fn().mockReturnValue({ url: '/api/v1/auth/register' }),
      }),
    } as unknown as ArgumentsHost;

    const validationMessages = ['email must be an email', 'password is too short'];
    const exception = new HttpException(
      { message: validationMessages, error: 'Bad Request' },
      HttpStatus.BAD_REQUEST,
    );

    filter.catch(exception, hostMock);

    expect(statusMock).toHaveBeenCalledWith(400);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: [
            { message: 'email must be an email' },
            { message: 'password is too short' },
          ],
        }),
      }),
    );
  });
});
