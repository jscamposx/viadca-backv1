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
    
    // Obtener el tamaño del payload
    const contentLength = request.get('content-length');
    const payloadSizeMB = contentLength ? (parseInt(contentLength) / (1024 * 1024)).toFixed(2) : 'unknown';
    
    // Log para requests grandes (>10MB)
    if (contentLength && parseInt(contentLength) > 10 * 1024 * 1024) {
      this.logger.log(
        `Processing large payload: ${payloadSizeMB}MB - ${request.method} ${request.url}`
      );
    }

    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - start;
        
        // Log de finalización para requests grandes
        if (contentLength && parseInt(contentLength) > 10 * 1024 * 1024) {
          this.logger.log(
            `Large payload processed in ${duration}ms - ${payloadSizeMB}MB`
          );
        }
        
        // Advertencia para requests muy lentos
        if (duration > 30000) { // 30 segundos
          this.logger.warn(
            `Slow request detected: ${duration}ms - ${request.method} ${request.url}`
          );
        }
      })
    );
  }
}
