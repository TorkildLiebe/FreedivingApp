import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { SpotNotFoundOrDeletedError } from '../../common/errors';
import { UsersRepository } from './users.repository';
import { UserAvatarStorageService } from './user-avatar-storage.service';

@Injectable()
export class UsersService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly userAvatarStorage: UserAvatarStorageService,
  ) {}

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

    const [totalReports, uniqueSpotsDived, activeFavorites] = await Promise.all(
      [
        this.usersRepository.countDiveLogsByAuthor(userId),
        this.usersRepository.countUniqueSpotsDivedByAuthor(userId),
        this.usersRepository.listFavoriteSpots(user.favoriteSpotIds),
      ],
    );

    return {
      totalReports,
      uniqueSpotsDived,
      favoritesCount: activeFavorites.length,
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

  async updateMe(
    userId: string,
    payload: {
      alias?: string;
      bio?: string | null;
      avatarUrl?: string | null;
      preferredLanguage?: 'en' | 'no';
    },
  ) {
    const user = await this.usersRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const hasUpdateField =
      payload.alias !== undefined ||
      payload.bio !== undefined ||
      payload.avatarUrl !== undefined ||
      payload.preferredLanguage !== undefined;

    if (!hasUpdateField) {
      throw new BadRequestException('No profile fields provided');
    }

    let normalizedAlias: string | undefined = undefined;
    if (typeof payload.alias === 'string') {
      normalizedAlias = payload.alias.trim();
      if (normalizedAlias.length === 0) {
        throw new BadRequestException('Alias is required');
      }
    }

    const normalizedBio =
      typeof payload.bio === 'string'
        ? payload.bio.trim() || null
        : payload.bio;

    return this.usersRepository.updateProfile(userId, {
      alias: normalizedAlias,
      bio: normalizedBio,
      avatarUrl: payload.avatarUrl,
      preferredLanguage: payload.preferredLanguage,
    });
  }

  async createAvatarUploadUrl(
    userId: string,
    mimeType?: string,
  ): Promise<{
    uploadUrl: string;
    publicUrl: string;
    expiresAt: string;
  }> {
    const user = await this.usersRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.userAvatarStorage.createUploadUrl(userId, mimeType);
  }
}
