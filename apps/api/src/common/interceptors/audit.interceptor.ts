import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger('Audit');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<{
      method: string;
      url: string;
      user?: { id?: string; email?: string };
      tenant?: { id?: string };
    }>();

    const { method, url, user, tenant } = request;

    return next.handle().pipe(
      tap(() => {
        if (['POST', 'PATCH', 'PUT', 'DELETE'].includes(method)) {
          this.logger.log(
            `${method} ${url} | user=${user?.id ?? 'anonymous'} | tenant=${tenant?.id ?? 'none'}`,
          );
        }
      }),
    );
  }
}
