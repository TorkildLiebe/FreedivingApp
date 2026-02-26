import { Injectable, NotFoundException } from '@nestjs/common';
import { SpotNotFoundOrDeletedError } from '../../common/errors';
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

  async addFavoriteSpot(userId: string, spotId: string): Promise<string[]> {
    const [user, spot] = await Promise.all([
      this.usersRepository.findById(userId),
      this.usersRepository.findActiveSpotById(spotId),
    ]);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!spot) {
      throw new SpotNotFoundOrDeletedError(spotId);
    }

    return this.usersRepository.addFavoriteSpot(
      userId,
      spotId,
      user.favoriteSpotIds,
    );
  }

  async removeFavoriteSpot(userId: string, spotId: string): Promise<string[]> {
    const user = await this.usersRepository.findById(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.usersRepository.removeFavoriteSpot(
      userId,
      spotId,
      user.favoriteSpotIds,
    );
  }

  async getMyStats(userId: string): Promise<{
    totalReports: number;
    uniqueSpotsDived: number;
    favoritesCount: number;
    memberSince: Date;
  }> {
    const user = await this.usersRepository.findById(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const [totalReports, uniqueSpotsDived] = await Promise.all([
      this.usersRepository.countDiveLogsByAuthor(userId),
      this.usersRepository.countUniqueSpotsDivedByAuthor(userId),
    ]);

    return {
      totalReports,
      uniqueSpotsDived,
      favoritesCount: user.favoriteSpotIds.length,
      memberSince: user.createdAt,
    };
  }

  async getMyActivity(userId: string): Promise<{
    diveReports: Array<{
      id: string;
      spotId: string;
      spotName: string;
      date: Date;
      visibilityMeters: number;
      currentStrength: number;
      notesPreview: string | null;
    }>;
    createdSpots: Array<{
      id: string;
      name: string;
      createdAt: Date;
      reportCount: number;
    }>;
    favorites: Array<{
      id: string;
      spotId: string;
      spotName: string;
      latestVisibilityMeters: number | null;
      latestReportDate: Date | null;
    }>;
  }> {
    const user = await this.usersRepository.findById(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const [diveReports, createdSpots, favorites] = await Promise.all([
      this.usersRepository.listMyDiveReports(userId),
      this.usersRepository.listCreatedSpotsByUser(userId),
      this.usersRepository.listFavoriteSpots(user.favoriteSpotIds),
    ]);

    return {
      diveReports,
      createdSpots,
      favorites,
    };
  }
}
