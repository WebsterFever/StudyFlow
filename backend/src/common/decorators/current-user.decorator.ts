import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
}

interface RequestWithUser {
  user: AuthenticatedUser;
}

/**
 * Extracts the authenticated user attached by JwtStrategy.validate().
 * Never trust a userId coming from the request body/query — always use this.
 */
export const CurrentUser = createParamDecorator((_data: unknown, ctx: ExecutionContext): AuthenticatedUser => {
  const request = ctx.switchToHttp().getRequest<RequestWithUser>();
  return request.user;
});
