import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LargePayloadInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LargePayloadInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const start = Date.now();

    const contentLength = request.get('content-length');
    const payloadSizeMB = contentLength
      ? (parseInt(contentLength) / (1024 * 1024)).toFixed(2)
      : 'unknown';

    if (contentLength && parseInt(contentLength) > 10 * 1024 * 1024) {
      this.logger.log(
        `Processing large payload: ${payloadSizeMB}MB - ${request.method} ${request.url}`,
      );
    }

    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - start;

        if (contentLength && parseInt(contentLength) > 10 * 1024 * 1024) {
          this.logger.log(
            `Large payload processed in ${duration}ms - ${payloadSizeMB}MB`,
          );
        }

        if (duration > 30000) {
          this.logger.warn(
            `Slow request detected: ${duration}ms - ${request.method} ${request.url}`,
          );
        }
      }),
    );
  }
}
