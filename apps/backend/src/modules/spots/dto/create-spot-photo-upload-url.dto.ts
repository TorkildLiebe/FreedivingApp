import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateSpotPhotoUploadUrlDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  mimeType?: string;
}
