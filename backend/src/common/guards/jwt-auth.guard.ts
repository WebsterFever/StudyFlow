import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/** Applied to every private controller/route; delegates to JwtStrategy. */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
