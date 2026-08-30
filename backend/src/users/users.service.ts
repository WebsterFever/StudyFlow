import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import type { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { email: email.toLowerCase() } });
  }

  /** Same as findByEmail but also selects the passwordHash column (excluded by default). */
  findByEmailWithPassword(email: string): Promise<User | null> {
    return this.usersRepository
      .createQueryBuilder('user')
      .addSelect('user.passwordHash')
      .where('user.email = :email', { email: email.toLowerCase() })
      .getOne();
  }

  findById(id: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { id } });
  }

  async create(name: string, email: string, passwordHash: string): Promise<User> {
    const existing = await this.findByEmail(email);
    if (existing) {
      throw new ConflictException('An account with this email already exists.');
    }
    const user = this.usersRepository.create({ name, email: email.toLowerCase(), passwordHash });
    return this.usersRepository.save(user);
  }

  async markLocalDataMigrated(userId: string): Promise<void> {
    await this.usersRepository.update({ id: userId }, { localDataMigratedAt: new Date() });
  }

  async updateProfile(userId: string, dto: UpdateProfileDto): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found.');
    }

    if (dto.timezone) {
      try {
        new Intl.DateTimeFormat('en-US', { timeZone: dto.timezone });
      } catch {
        throw new BadRequestException(`"${dto.timezone}" is not a valid IANA timezone.`);
      }
      user.timezone = dto.timezone;
    }

    if (dto.quietHoursStart !== undefined) user.quietHoursStart = dto.quietHoursStart;
    if (dto.quietHoursEnd !== undefined) user.quietHoursEnd = dto.quietHoursEnd;
    if (dto.quietHoursEnabled !== undefined) user.quietHoursEnabled = dto.quietHoursEnabled;

    if (user.quietHoursEnabled && (!user.quietHoursStart || !user.quietHoursEnd)) {
      throw new BadRequestException('Set both a start and end time before enabling quiet hours.');
    }

    return this.usersRepository.save(user);
  }
}
