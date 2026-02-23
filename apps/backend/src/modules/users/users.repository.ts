import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class UsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByExternalId(externalId: string) {
    return this.prisma.user.findFirst({
      where: { externalId, isDeleted: false },
    });
  }

  async findById(id: string) {
    return this.prisma.user.findFirst({
      where: { id, isDeleted: false },
    });
  }

  async create(data: { externalId: string; email?: string }) {
    return this.prisma.user.create({
      data: {
        externalId: data.externalId,
        email: data.email,
        role: 'user',
        preferredLanguage: 'no',
      },
    });
  }
}
