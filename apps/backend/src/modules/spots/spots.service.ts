import { Injectable } from '@nestjs/common';
import { SpotsRepository } from './spots.repository';
import {
  InvalidBBoxError,
  SpotNotFoundOrDeletedError,
} from '../../common/errors';
import { ListSpotsResponseDto } from './dto/list-spots-response.dto';
import { SpotDetailResponseDto } from './dto/spot-detail-response.dto';

const DEFAULT_LIMIT = 300;
const MAX_LIMIT = 1000;

@Injectable()
export class SpotsService {
  constructor(private readonly spotsRepository: SpotsRepository) {}

  async listByBBox(
    latMin: number,
    latMax: number,
    lonMin: number,
    lonMax: number,
    maxResults?: number,
  ): Promise<ListSpotsResponseDto> {
    if (latMin >= latMax) {
      throw new InvalidBBoxError('latMin must be less than latMax');
    }
    if (lonMin > lonMax) {
      throw new InvalidBBoxError(
        'antimeridian-spanning bounding boxes are not supported',
      );
    }

    const limit = Math.min(maxResults ?? DEFAULT_LIMIT, MAX_LIMIT);
    const rows = await this.spotsRepository.listByBBox(
      latMin,
      latMax,
      lonMin,
      lonMax,
      limit,
    );
    const truncated = rows.length > limit;
    const items = truncated ? rows.slice(0, limit) : rows;

    return { items, count: items.length, truncated };
  }

  async getById(spotId: string): Promise<SpotDetailResponseDto> {
    const spot = await this.spotsRepository.findById(spotId);
    if (!spot) {
      throw new SpotNotFoundOrDeletedError(spotId);
    }

    return {
      id: spot.id,
      title: spot.title,
      description: spot.description,
      centerLat: spot.centerLat,
      centerLon: spot.centerLon,
      createdById: spot.createdById,
      accessInfo: spot.accessInfo,
      parkingLocations: spot.parkingLocations.map((p) => ({
        id: p.id,
        lat: p.lat,
        lon: p.lon,
        label: p.label,
      })),
      shareUrl: spot.shareUrl,
      shareableAccessInfo: spot.shareableAccessInfo,
      createdAt: spot.createdAt,
      updatedAt: spot.updatedAt,
    };
  }
}
