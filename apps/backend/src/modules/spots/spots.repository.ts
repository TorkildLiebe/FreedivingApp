import { Injectable } from '@nestjs/common';
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
}
