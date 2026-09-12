import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiSuccessResponse } from '../interfaces/api-response.interface';

@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, ApiSuccessResponse<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiSuccessResponse<T>> {
    return next.handle().pipe(
      map((data) => {
        // If the controller returned a pre-shaped envelope, pass it through
        if (data && typeof data === 'object' && 'success' in data && 'data' in data) {
          return {
            ...data,
            timestamp: data.timestamp || new Date().toISOString(),
          };
        }

        // If data contains meta (e.g. pagination)
        if (data && typeof data === 'object' && 'items' in data && 'meta' in data) {
          return {
            success: true,
            data: data.items,
            message: data.message || 'Success',
            meta: data.meta,
            timestamp: new Date().toISOString(),
          };
        }

        return {
          success: true,
          data: data !== undefined ? data : null,
          message: 'Success',
          timestamp: new Date().toISOString(),
        };
      }),
    );
  }
}
