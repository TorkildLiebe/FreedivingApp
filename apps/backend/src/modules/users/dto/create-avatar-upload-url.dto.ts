import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateAvatarUploadUrlDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  mimeType?: string;
}
