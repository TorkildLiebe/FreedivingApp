import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

const SPOT_SUMMARY_SELECT = {
  id: true,
  title: true,
  centerLat: true,
  centerLon: true,
} as const;

const SPOT_DETAIL_INCLUDE = {
  parkingLocations: true,
  createdBy: { select: { alias: true } },
  _count: {
    select: {
      spotRatings: true,
    },
  },
} as const;

const SPOT_DIVE_LOG_INCLUDE = {
  author: {
    select: {
      alias: true,
      avatarUrl: true,
    },
  },
} as const;

@Injectable()
export class SpotsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async listByBBox(
    latMin: number,
    latMax: number,
    lonMin: number,
    lonMax: number,
    limit: number,
  ) {
    return this.prisma.diveSpot.findMany({
      where: {
        isDeleted: false,
        centerLat: { gte: latMin, lte: latMax },
        centerLon: { gte: lonMin, lte: lonMax },
      },
      select: SPOT_SUMMARY_SELECT,
      take: limit + 1,
    });
  }

  async findById(id: string) {
    return this.prisma.diveSpot.findFirst({
      where: { id, isDeleted: false },
      include: SPOT_DETAIL_INCLUDE,
    });
  }

  async findByIdAnyState(id: string) {
    return this.prisma.diveSpot.findFirst({
      where: { id },
      include: SPOT_DETAIL_INCLUDE,
    });
  }

  async findNearbyCenters(lat: number, lon: number, radiusMeters: number) {
    return this.prisma.$queryRaw<Array<{ id: string; distanceMeters: number }>>(
      Prisma.sql`
        SELECT
          id::text AS id,
          ST_Distance(
            ST_SetSRID(ST_MakePoint(center_lon, center_lat), 4326)::geography,
            ST_SetSRID(ST_MakePoint(${lon}, ${lat}), 4326)::geography
          ) AS "distanceMeters"
        FROM dive_spots
        WHERE is_deleted = false
          AND ST_DWithin(
            ST_SetSRID(ST_MakePoint(center_lon, center_lat), 4326)::geography,
            ST_SetSRID(ST_MakePoint(${lon}, ${lat}), 4326)::geography,
            ${radiusMeters}
          )
        ORDER BY "distanceMeters" ASC
      `,
    );
  }

  async createSpot(
    data: {
      title: string;
      description: string;
      centerLat: number;
      centerLon: number;
      createdById: string;
      accessInfo: string | null;
    },
    parkingLocations: Array<{ lat: number; lon: number; label: string | null }>,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const spot = await tx.diveSpot.create({ data });

      if (parkingLocations.length > 0) {
        await tx.parkingLocation.createMany({
          data: parkingLocations.map((parking) => ({
            lat: parking.lat,
            lon: parking.lon,
            label: parking.label,
            spotId: spot.id,
          })),
        });
      }

      return tx.diveSpot.findFirst({
        where: { id: spot.id, isDeleted: false },
        include: SPOT_DETAIL_INCLUDE,
      });
    });
  }

  async updateSpot(
    id: string,
    data: {
      title?: string;
      description?: string;
      accessInfo?: string | null;
    },
    parkingLocations?: Array<{
      lat: number;
      lon: number;
      label: string | null;
    }>,
  ) {
    return this.prisma.$transaction(async (tx) => {
      await tx.diveSpot.update({ where: { id }, data });

      if (parkingLocations) {
        await tx.parkingLocation.deleteMany({ where: { spotId: id } });

        if (parkingLocations.length > 0) {
          await tx.parkingLocation.createMany({
            data: parkingLocations.map((parking) => ({
              lat: parking.lat,
              lon: parking.lon,
              label: parking.label,
              spotId: id,
            })),
          });
        }
      }

      return tx.diveSpot.findFirst({
        where: { id, isDeleted: false },
        include: SPOT_DETAIL_INCLUDE,
      });
    });
  }

  async updatePhotoUrls(id: string, photoUrls: string[]) {
    await this.prisma.diveSpot.update({
      where: { id },
      data: { photoUrls },
    });

    return this.prisma.diveSpot.findFirst({
      where: { id, isDeleted: false },
      include: SPOT_DETAIL_INCLUDE,
    });
  }

  async softDeleteSpot(id: string): Promise<void> {
    await this.prisma.diveSpot.updateMany({
      where: { id, isDeleted: false },
      data: { isDeleted: true, deletedAt: new Date() },
    });
  }

  async listDiveLogsBySpot(spotId: string, skip: number, take: number) {
    const [items, total] = await this.prisma.$transaction([
      this.prisma.diveLog.findMany({
        where: { spotId, isDeleted: false },
        include: SPOT_DIVE_LOG_INCLUDE,
        orderBy: [{ divedAt: 'desc' }, { createdAt: 'desc' }],
        skip,
        take,
      }),
      this.prisma.diveLog.count({
        where: { spotId, isDeleted: false },
      }),
    ]);

    return { items, total };
  }

  async upsertSpotRatingAndRefreshAverage(
    spotId: string,
    userId: string,
    rating: number,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const savedRating = await tx.spotRating.upsert({
        where: {
          userId_spotId: {
            userId,
            spotId,
          },
        },
        create: {
          spotId,
          userId,
          rating,
        },
        update: {
          rating,
        },
      });

      const aggregates = await tx.spotRating.aggregate({
        where: { spotId },
        _avg: { rating: true },
        _count: { _all: true },
      });

      await tx.diveSpot.update({
        where: { id: spotId },
        data: {
          averageRating: aggregates._avg.rating,
        },
      });

      return {
        rating: savedRating,
        averageRating: aggregates._avg.rating,
        ratingCount: aggregates._count._all,
      };
    });
  }
}
