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

  async findActiveSpotById(spotId: string) {
    return this.prisma.diveSpot.findFirst({
      where: { id: spotId, isDeleted: false },
      select: { id: true },
    });
  }

  async addFavoriteSpot(
    userId: string,
    spotId: string,
    currentFavoriteSpotIds: string[],
  ): Promise<string[]> {
    const nextFavoriteSpotIds = currentFavoriteSpotIds.includes(spotId)
      ? currentFavoriteSpotIds
      : [...currentFavoriteSpotIds, spotId];

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: { favoriteSpotIds: nextFavoriteSpotIds },
      select: { favoriteSpotIds: true },
    });

    return updatedUser.favoriteSpotIds;
  }

  async removeFavoriteSpot(
    userId: string,
    spotId: string,
    currentFavoriteSpotIds: string[],
  ): Promise<string[]> {
    const nextFavoriteSpotIds = currentFavoriteSpotIds.filter(
      (favoriteSpotId) => favoriteSpotId !== spotId,
    );

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: { favoriteSpotIds: nextFavoriteSpotIds },
      select: { favoriteSpotIds: true },
    });

    return updatedUser.favoriteSpotIds;
  }
}
