import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, from } from 'rxjs';
import { RequestQueueService, TaskMetadata } from '../services/request-queue.service';
import { SKIP_QUEUE_KEY } from '../decorators/skip-queue.decorator';

@Injectable()
export class QueueInterceptor implements NestInterceptor {
  constructor(
    private readonly queue: RequestQueueService,
    private readonly reflector: Reflector,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<any>();

    const skip = this.reflector.getAllAndOverride<boolean>(SKIP_QUEUE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const method = request.method?.toUpperCase();
    // Criterio: encolar SOLO métodos mutadores; GET se salta salvo que se fuerce
    const shouldEnqueue = !skip && method !== 'GET';

    if (!shouldEnqueue) {
      return next.handle();
    }

    // Capturar metadata del request
    const metadata: TaskMetadata = {
      userId: request.user?.id || request.user?.usuario || null,
      userName: request.user?.usuario || request.user?.nombre_completo || 'Anónimo',
      userRole: request.user?.rol || 'guest',
      method: method,
      endpoint: request.originalUrl || request.url || request.path || 'unknown',
      ip: request.ip || request.connection?.remoteAddress || 'unknown',
      userAgent: request.headers?.['user-agent'] || 'unknown',
    };

    return from(
      this.queue.enqueue(async () => {
        return await next.handle().toPromise();
      }, metadata),
    );
  }
}
