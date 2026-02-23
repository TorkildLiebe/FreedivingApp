import { SpotSummaryResponseDto } from './spot-summary-response.dto';

export class ListSpotsResponseDto {
  items!: SpotSummaryResponseDto[];
  count!: number;
  truncated!: boolean;
}
