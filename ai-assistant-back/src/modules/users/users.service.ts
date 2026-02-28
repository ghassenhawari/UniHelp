import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from './user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(userData: Partial<User>): Promise<User> {
    const user = this.userRepository.create(userData);
    return this.userRepository.save(user);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ 
      where: { email },
      select: ['id', 'email', 'passwordHash', 'role', 'isEmailVerified', 'fullName'] 
    });
  }

  async findById(id: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { id } });
  }

  async update(id: string, updateData: Partial<User>): Promise<void> {
    await this.userRepository.update(id, updateData);
  }

  async findByToken(type: 'email' | 'reset' | 'refresh', hash: string): Promise<User | null> {
    const where: any = {};
    if (type === 'email') where.emailVerificationTokenHash = hash;
    if (type === 'reset') where.resetPasswordTokenHash = hash;
    if (type === 'refresh') where.refreshTokenHash = hash;

    return this.userRepository.findOne({ 
      where,
      select: ['id', 'email', 'role', 'fullName', 'isEmailVerified', 'emailVerificationExpiresAt', 'resetPasswordExpiresAt']
    });
  }
}
