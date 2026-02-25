import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { AuthGuard, CurrentUser } from '../../common/auth';
import type { AuthenticatedUser } from '../../common/auth';
import { CreateDiveLogDto } from './dto/create-dive-log.dto';
import { CreateDiveLogPhotoUploadUrlDto } from './dto/create-dive-log-photo-upload-url.dto';
import { CreateDiveLogResponseDto } from './dto/create-dive-log-response.dto';
import { DiveLogPhotoUploadUrlResponseDto } from './dto/dive-log-photo-upload-url-response.dto';
import { DiveLogsService } from './dive-logs.service';

@Controller('dive-logs')
@UseGuards(AuthGuard)
export class DiveLogsController {
  constructor(private readonly diveLogsService: DiveLogsService) {}

  @Post()
  async create(
    @Body() dto: CreateDiveLogDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<CreateDiveLogResponseDto> {
    return this.diveLogsService.create(dto, actor);
  }

  @Post('photos/upload-url')
  async createPhotoUploadUrl(
    @Body() dto: CreateDiveLogPhotoUploadUrlDto,
  ): Promise<DiveLogPhotoUploadUrlResponseDto> {
    return this.diveLogsService.createPhotoUploadUrl(dto);
  }
}
