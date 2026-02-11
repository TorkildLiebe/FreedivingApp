import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '../../common/auth';
import { SpotsService } from './spots.service';
import { ListSpotsByBBoxQueryDto } from './dto/list-spots-by-bbox-query.dto';
import { ListSpotsResponseDto } from './dto/list-spots-response.dto';
import { SpotDetailResponseDto } from './dto/spot-detail-response.dto';

@Controller('spots')
@UseGuards(AuthGuard)
export class SpotsController {
  constructor(private readonly spotsService: SpotsService) {}

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
}
