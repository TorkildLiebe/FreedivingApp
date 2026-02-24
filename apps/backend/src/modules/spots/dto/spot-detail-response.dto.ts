import { ParkingLocationResponseDto } from './parking-location-response.dto';
import { SpotDiveLogPreviewResponseDto } from './spot-dive-log-preview-response.dto';

export class SpotDetailResponseDto {
  id!: string;
  title!: string;
  description!: string;
  centerLat!: number;
  centerLon!: number;
  createdById!: string;
  creatorDisplayName!: string | null;
  accessInfo!: string | null;
  parkingLocations!: ParkingLocationResponseDto[];
  photoUrls!: string[];
  isFavorite!: boolean;
  averageVisibilityMeters!: number | null;
  averageRating!: number | null;
  reportCount!: number;
  latestReportAt!: Date | null;
  diveLogs!: SpotDiveLogPreviewResponseDto[];
  shareUrl!: string | null;
  shareableAccessInfo!: boolean | null;
  createdAt!: Date;
  updatedAt!: Date;
}
