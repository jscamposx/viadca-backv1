import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';

@Injectable()
export class DebugBodyInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    
    if (request.method === 'POST' || request.method === 'PATCH') {
      console.log('🔍 [DEBUG] RAW BODY ANTES DE VALIDACIÓN:', JSON.stringify(request.body, null, 2));
      console.log('🔍 [DEBUG] Headers:', request.headers);
      console.log('🔍 [DEBUG] Method:', request.method);
      console.log('🔍 [DEBUG] URL:', request.url);
    }

    return next.handle();
  }
}
