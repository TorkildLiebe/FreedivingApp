import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

const DIVE_LOG_NOTES_PREVIEW_MAX = 120;

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

  async countDiveLogsByAuthor(userId: string): Promise<number> {
    return this.prisma.diveLog.count({
      where: {
        authorId: userId,
        isDeleted: false,
      },
    });
  }

  async countUniqueSpotsDivedByAuthor(userId: string): Promise<number> {
    const grouped = await this.prisma.diveLog.groupBy({
      by: ['spotId'],
      where: {
        authorId: userId,
        isDeleted: false,
      },
    });

    return grouped.length;
  }

  async updateProfile(
    userId: string,
    data: {
      alias?: string;
      bio?: string | null;
      avatarUrl?: string | null;
      preferredLanguage?: 'en' | 'no';
    },
  ) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(data.alias !== undefined ? { alias: data.alias } : {}),
        ...(data.bio !== undefined ? { bio: data.bio } : {}),
        ...(data.avatarUrl !== undefined ? { avatarUrl: data.avatarUrl } : {}),
        ...(data.preferredLanguage !== undefined
          ? { preferredLanguage: data.preferredLanguage }
          : {}),
      },
    });
  }

  async listMyDiveReports(userId: string): Promise<
    Array<{
      id: string;
      spotId: string;
      spotName: string;
      date: Date;
      visibilityMeters: number;
      currentStrength: number;
      notesPreview: string | null;
    }>
  > {
    const diveLogs = await this.prisma.diveLog.findMany({
      where: {
        authorId: userId,
        isDeleted: false,
        spot: {
          isDeleted: false,
        },
      },
      orderBy: [{ divedAt: 'desc' }, { createdAt: 'desc' }],
      select: {
        id: true,
        spotId: true,
        visibilityMeters: true,
        currentStrength: true,
        notes: true,
        divedAt: true,
        spot: {
          select: {
            title: true,
          },
        },
      },
      take: 50,
    });

    return diveLogs.map((diveLog) => ({
      id: diveLog.id,
      spotId: diveLog.spotId,
      spotName: diveLog.spot.title,
      date: diveLog.divedAt,
      visibilityMeters: diveLog.visibilityMeters,
      currentStrength: diveLog.currentStrength,
      notesPreview: this.createNotesPreview(diveLog.notes),
    }));
  }

  async listCreatedSpotsByUser(userId: string): Promise<
    Array<{
      id: string;
      name: string;
      createdAt: Date;
      reportCount: number;
    }>
  > {
    const spots = await this.prisma.diveSpot.findMany({
      where: {
        createdById: userId,
        isDeleted: false,
      },
      orderBy: [{ createdAt: 'desc' }],
      select: {
        id: true,
        title: true,
        createdAt: true,
        reportCount: true,
      },
      take: 50,
    });

    return spots.map((spot) => ({
      id: spot.id,
      name: spot.title,
      createdAt: spot.createdAt,
      reportCount: spot.reportCount,
    }));
  }

  async listFavoriteSpots(favoriteSpotIds: string[]): Promise<
    Array<{
      id: string;
      spotId: string;
      spotName: string;
      latestVisibilityMeters: number | null;
      latestReportDate: Date | null;
    }>
  > {
    if (favoriteSpotIds.length === 0) {
      return [];
    }

    const spots = await this.prisma.diveSpot.findMany({
      where: {
        id: {
          in: favoriteSpotIds,
        },
        isDeleted: false,
      },
      select: {
        id: true,
        title: true,
        diveLogs: {
          where: { isDeleted: false },
          orderBy: [{ divedAt: 'desc' }],
          take: 1,
          select: {
            visibilityMeters: true,
            divedAt: true,
          },
        },
      },
    });

    const byId = new Map(spots.map((spot) => [spot.id, spot]));

    return favoriteSpotIds
      .map((spotId) => {
        const spot = byId.get(spotId);
        if (!spot) {
          return null;
        }

        const latest = spot.diveLogs[0] ?? null;

        return {
          id: spot.id,
          spotId: spot.id,
          spotName: spot.title,
          latestVisibilityMeters: latest?.visibilityMeters ?? null,
          latestReportDate: latest?.divedAt ?? null,
        };
      })
      .filter((spot) => spot !== null);
  }

  private createNotesPreview(notes: string | null): string | null {
    if (!notes) {
      return null;
    }

    const normalized = notes.trim();
    if (!normalized) {
      return null;
    }

    if (normalized.length <= DIVE_LOG_NOTES_PREVIEW_MAX) {
      return normalized;
    }

    return `${normalized.slice(0, DIVE_LOG_NOTES_PREVIEW_MAX - 1).trimEnd()}…`;
  }
}
