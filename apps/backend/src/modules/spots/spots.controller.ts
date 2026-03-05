import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard, CurrentUser } from '../../common/auth';
import { SpotsService } from './spots.service';
import { ListSpotsByBBoxQueryDto } from './dto/list-spots-by-bbox-query.dto';
import { ListSpotsResponseDto } from './dto/list-spots-response.dto';
import { SpotSummaryResponseDto } from './dto/spot-summary-response.dto';
import { SpotDetailResponseDto } from './dto/spot-detail-response.dto';
import { CreateSpotDto } from './dto/create-spot.dto';
import { UpdateSpotDto } from './dto/update-spot.dto';
import { AddSpotPhotoDto } from './dto/add-spot-photo.dto';
import { CreateSpotPhotoUploadUrlDto } from './dto/create-spot-photo-upload-url.dto';
import { SpotPhotoUploadUrlResponseDto } from './dto/spot-photo-upload-url-response.dto';
import { ListSpotDiveLogsQueryDto } from './dto/list-spot-dive-logs-query.dto';
import { ListSpotDiveLogsResponseDto } from './dto/list-spot-dive-logs-response.dto';
import { UpsertSpotRatingDto } from './dto/upsert-spot-rating.dto';
import { UpsertSpotRatingResponseDto } from './dto/upsert-spot-rating-response.dto';
import type { AuthenticatedUser } from '../../common/auth';

@Controller('spots')
@UseGuards(AuthGuard)
export class SpotsController {
  constructor(private readonly spotsService: SpotsService) {}

  @Get('summaries')
  async listSummaries(): Promise<SpotSummaryResponseDto[]> {
    return this.spotsService.listSummaries();
  }

  @Get()
  async listByBBox(
    @Query() query: ListSpotsByBBoxQueryDto,
  ): Promise<ListSpotsResponseDto> {
    return this.spotsService.listByBBox(
      query.latMin,
      query.latMax,
      query.lonMin,
      query.lonMax,
      query.maxResults,
    );
  }

  @Get(':id')
  async getById(
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<SpotDetailResponseDto> {
    return this.spotsService.getById(id);
  }

  @Get(':id/dive-logs')
  async listDiveLogs(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Query() query: ListSpotDiveLogsQueryDto,
  ): Promise<ListSpotDiveLogsResponseDto> {
    return this.spotsService.listDiveLogs(id, query.page, query.limit);
  }

  @Post()
  async create(
    @Body() dto: CreateSpotDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<SpotDetailResponseDto> {
    return this.spotsService.create(dto, actor);
  }

  @Patch(':id')
  async update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateSpotDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<SpotDetailResponseDto> {
    return this.spotsService.update(id, dto, actor);
  }

  @Post(':id/photos/upload-url')
  async createPhotoUploadUrl(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: CreateSpotPhotoUploadUrlDto,
  ): Promise<SpotPhotoUploadUrlResponseDto> {
    return this.spotsService.createPhotoUploadUrl(id, dto.mimeType);
  }

  @Post(':id/photos')
  async addPhoto(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: AddSpotPhotoDto,
  ): Promise<SpotDetailResponseDto> {
    return this.spotsService.addPhoto(id, dto.url);
  }

  @Post(':id/ratings')
  async upsertRating(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpsertSpotRatingDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<UpsertSpotRatingResponseDto> {
    return this.spotsService.upsertRating(id, dto, actor);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async softDelete(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<void> {
    await this.spotsService.softDelete(id, actor);
  }
}
