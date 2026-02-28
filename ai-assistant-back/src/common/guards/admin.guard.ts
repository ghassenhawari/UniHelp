import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Admin guard — checks for X-Admin-Secret header.
 * Use on admin-only endpoints (upload, reindex, stats).
 */
@Injectable()
export class AdminGuard implements CanActivate {
    constructor(private readonly config: ConfigService) { }

    canActivate(context: ExecutionContext): boolean {
        const request = context.switchToHttp().getRequest();
        const secret = request.headers['x-admin-secret'];
        const expected = this.config.get<string>('app.admin.secret');

        if (!secret || secret !== expected) {
            throw new UnauthorizedException('Invalid or missing admin secret');
        }
        return true;
    }
}
