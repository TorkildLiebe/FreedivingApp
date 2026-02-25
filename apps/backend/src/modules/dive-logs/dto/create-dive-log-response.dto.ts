import { DiveLogResponseDto } from './dive-log-response.dto';

export class CreateDiveLogResponseDto {
  diveLog!: DiveLogResponseDto;
  shouldPromptRating!: boolean;
}
