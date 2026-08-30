import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UsersService } from '../users/users.service';
import { User } from '../users/user.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

const SALT_ROUNDS = 10;

export interface AuthResult {
  accessToken: string;
  user: {
    id: string;
    name: string;
    email: string;
    localDataMigratedAt: Date | null;
  };
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  private toAuthResult(user: User): AuthResult {
    return {
      accessToken: this.jwtService.sign({ sub: user.id, email: user.email }),
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        localDataMigratedAt: user.localDataMigratedAt,
      },
    };
  }

  async register(dto: RegisterDto): Promise<AuthResult> {
    if (dto.password !== dto.confirmPassword) {
      throw new BadRequestException('Passwords do not match.');
    }
    const passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);
    const user = await this.usersService.create(dto.name.trim(), dto.email.trim(), passwordHash);
    return this.toAuthResult(user);
  }

  async login(dto: LoginDto): Promise<AuthResult> {
    const user = await this.usersService.findByEmailWithPassword(dto.email.trim());
    if (!user) {
      throw new UnauthorizedException('Invalid email or password.');
    }
    const passwordMatches = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid email or password.');
    }
    return this.toAuthResult(user);
  }

  async me(userId: string): Promise<AuthResult['user']> {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException();
    }
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      localDataMigratedAt: user.localDataMigratedAt,
    };
  }
}
