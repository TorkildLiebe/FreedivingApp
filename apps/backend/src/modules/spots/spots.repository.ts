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
  createdBy: { select: { displayName: true } },
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
    parkingLocations?: Array<{ lat: number; lon: number; label: string | null }>,
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

  async softDeleteSpot(id: string): Promise<void> {
    await this.prisma.diveSpot.updateMany({
      where: { id, isDeleted: false },
      data: { isDeleted: true, deletedAt: new Date() },
    });
  }
}
