import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

const DIVE_LOG_WITH_AUTHOR_INCLUDE = {
  author: {
    select: {
      alias: true,
      avatarUrl: true,
    },
  },
} as const;

@Injectable()
export class DiveLogsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findActiveSpotById(spotId: string) {
    return this.prisma.diveSpot.findFirst({
      where: { id: spotId, isDeleted: false },
      select: { id: true },
    });
  }

  async hasExistingRating(userId: string, spotId: string): Promise<boolean> {
    const existing = await this.prisma.spotRating.findFirst({
      where: { userId, spotId },
      select: { id: true },
    });

    return Boolean(existing);
  }

  async createDiveLog(data: {
    spotId: string;
    authorId: string;
    visibilityMeters: number;
    currentStrength: number;
    notes: string | null;
    photoUrls: string[];
    divedAt: Date;
  }) {
    return this.prisma.$transaction(async (tx) => {
      const diveLog = await tx.diveLog.create({
        data,
        include: DIVE_LOG_WITH_AUTHOR_INCLUDE,
      });

      const aggregates = await tx.diveLog.aggregate({
        where: { spotId: data.spotId, isDeleted: false },
        _avg: { visibilityMeters: true },
        _count: { _all: true },
        _max: { divedAt: true },
      });

      await tx.diveSpot.update({
        where: { id: data.spotId },
        data: {
          averageVisibilityMeters: aggregates._avg.visibilityMeters,
          reportCount: aggregates._count._all,
          latestReportAt: aggregates._max.divedAt,
        },
      });

      return diveLog;
    });
  }

  async findDiveLogById(id: string) {
    return this.prisma.diveLog.findFirst({
      where: { id },
      include: DIVE_LOG_WITH_AUTHOR_INCLUDE,
    });
  }

  async updateDiveLog(
    id: string,
    spotId: string,
    data: {
      visibilityMeters?: number;
      currentStrength?: number;
      notes?: string | null;
      photoUrls?: string[];
      divedAt?: Date;
    },
  ) {
    return this.prisma.$transaction(async (tx) => {
      const diveLog = await tx.diveLog.update({
        where: { id },
        data,
        include: DIVE_LOG_WITH_AUTHOR_INCLUDE,
      });

      const aggregates = await tx.diveLog.aggregate({
        where: { spotId, isDeleted: false },
        _avg: { visibilityMeters: true },
        _count: { _all: true },
        _max: { divedAt: true },
      });

      await tx.diveSpot.update({
        where: { id: spotId },
        data: {
          averageVisibilityMeters: aggregates._avg.visibilityMeters,
          reportCount: aggregates._count._all,
          latestReportAt: aggregates._max.divedAt,
        },
      });

      return diveLog;
    });
  }
}
