import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';

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
}
