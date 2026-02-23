import { Injectable } from '@nestjs/common';
import { UsersRepository } from './users.repository';

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  async getOrCreate(externalId: string, email?: string) {
    const existing = await this.usersRepository.findByExternalId(externalId);
    if (existing) return existing;
    return this.usersRepository.create({ externalId, email });
  }

  async findById(id: string) {
    return this.usersRepository.findById(id);
  }
}
