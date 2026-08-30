import { CanActivate, ExecutionContext, Injectable, ServiceUnavailableException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { timingSafeEqual } from 'crypto';

/**
 * Guards machine-to-machine endpoints (the Lambda -> backend reminder trigger).
 * Never trusts a JWT — expects `Authorization: Bearer <REMINDER_JOB_SECRET>`.
 */
@Injectable()
export class InternalSecretGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const secret = this.configService.get<string>('REMINDER_JOB_SECRET');
    if (!secret) {
      // Fail closed, but with a clear signal that this is a config gap, not an auth failure.
      throw new ServiceUnavailableException('REMINDER_JOB_SECRET is not configured on this server.');
    }

    const request = context.switchToHttp().getRequest<{ headers: Record<string, string | undefined> }>();
    const header = request.headers['authorization'];
    const provided = header?.startsWith('Bearer ') ? header.slice(7) : undefined;

    if (!provided || !this.safeEqual(provided, secret)) {
      throw new UnauthorizedException();
    }
    return true;
  }

  private safeEqual(a: string, b: string): boolean {
    const bufA = Buffer.from(a);
    const bufB = Buffer.from(b);
    if (bufA.length !== bufB.length) return false;
    return timingSafeEqual(bufA, bufB);
  }
}
