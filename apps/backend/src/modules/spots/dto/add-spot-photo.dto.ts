import { IsString, IsUrl, MaxLength } from 'class-validator';

export class AddSpotPhotoDto {
  @IsString()
  @MaxLength(2048)
  @IsUrl({ require_protocol: true })
  url!: string;
}
