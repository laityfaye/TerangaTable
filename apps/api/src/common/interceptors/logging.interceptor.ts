import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import type { Request } from 'express';

const SLOW_REQUEST_MS = 500;

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest<Request & {
      headers: Record<string, string>;
      tenantContext?: { id?: string };
    }>();

    const { method, url } = req;
    const requestId = req.headers['x-request-id'] ?? 'no-id';
    const tenantId  = req.tenantContext?.id ?? req.headers['x-tenant-id'] ?? '-';
    const start     = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const ms = Date.now() - start;
          const message = `${method} ${url} — request_id=${requestId} tenant=${tenantId} ${ms}ms`;
          if (ms > SLOW_REQUEST_MS) {
            this.logger.warn(`[SLOW] ${message}`);
          } else {
            this.logger.log(message);
          }
        },
        error: (err: Error) => {
          const ms = Date.now() - start;
          this.logger.error(
            `${method} ${url} — request_id=${requestId} tenant=${tenantId} ${ms}ms — ${err.message}`,
          );
        },
      }),
    );
  }
}
