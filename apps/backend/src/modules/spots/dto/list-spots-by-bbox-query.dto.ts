import { Type } from 'class-transformer';
import { IsNumber, Min, Max, IsOptional, IsInt } from 'class-validator';

export class ListSpotsByBBoxQueryDto {
  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  latMin!: number;

  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  latMax!: number;

  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  lonMin!: number;

  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  lonMax!: number;

  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(1000)
  maxResults?: number;
}
