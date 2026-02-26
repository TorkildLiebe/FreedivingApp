import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  Max,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';

export class CreateDiveLogDto {
  @IsUUID()
  spotId!: string;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(30)
  visibilityMeters!: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  currentStrength!: number;

  @IsOptional()
  @IsDateString()
  divedAt?: string;

  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsString()
  @MaxLength(500)
  notes?: string | null;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(5)
  @IsUrl({ require_protocol: true }, { each: true })
  photoUrls?: string[];
}
