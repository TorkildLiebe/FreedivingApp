import { IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateDiveLogPhotoUploadUrlDto {
  @IsUUID()
  spotId!: string;

  @IsOptional()
  @IsString()
  mimeType?: string;
}
