import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
} from '@nestjs/common';
import * as common from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
    constructor(private readonly logger: common.LoggerService) { }

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const request = context.switchToHttp().getRequest();
        const { method, url, requestId } = request;
        const start = Date.now();

        return next.handle().pipe(
            tap({
                next: () => {
                    const ms = Date.now() - start;
                    const status = context.switchToHttp().getResponse().statusCode;
                    this.logger.log(
                        `${method} ${url} → ${status} (${ms}ms) {${requestId}}`,
                        'HTTP',
                    );
                },
                error: () => {
                    const ms = Date.now() - start;
                    this.logger.warn(
                        `${method} ${url} → ERROR (${ms}ms) {${requestId}}`,
                        'HTTP',
                    );
                },
            }),
        );
    }
}
