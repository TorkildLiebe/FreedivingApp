import { SpotDiveLogPreviewResponseDto } from './spot-dive-log-preview-response.dto';

export class ListSpotDiveLogsResponseDto {
  items!: SpotDiveLogPreviewResponseDto[];
  page!: number;
  limit!: number;
  total!: number;
}
